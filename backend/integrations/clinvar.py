# backend/integrations/clinvar.py
"""
Ensembl Variation lookup and a rule-based bystander impact annotation.

What is real here:
  - lookup_variant_details() asks the Ensembl Variation REST API about an rsID. When it answers, the
    clinical significance strings are Ensembl's own (they come from ClinVar), and the frequency is
    the 1000 Genomes / gnomAD South Asian value if Ensembl reports one.
  - When Ensembl does not answer, or does not know the rsID, the result carries a placeholder
    frequency (0.05) and `_source` is "fallback" or "unmapped". Callers must treat those as "no data",
    never as a measurement.

What is not:
  - annotate_bystander_pathogenicity() does NOT query ClinVar. It is a small rule: the consequence class
    (silent, missense, nonsense) plus a computed Grantham distance (integrations/grantham.py), plus two
    hand-written notes for the HBB sickle-cell site. Its labels say so.

Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import logging
from typing import Any
import httpx

from backend.integrations.cache import bio_cache
from backend.integrations.grantham import grantham_class, grantham_distance

logger = logging.getLogger(__name__)

ENSEMBL_REST_BASE = "https://rest.ensembl.org"
HEADERS = {"Content-Type": "application/json", "User-Agent": "NanoCRISPR-3D/1.0"}


async def lookup_variant_details(variant_id: str) -> dict[str, Any]:
    """
    Looks up an rsID in the Ensembl Variation REST API.

    The result always has `_source`:
      "live_api"  Ensembl answered just now
      "cached"    an earlier Ensembl answer, from the local SQLite cache
      "unmapped"  Ensembl has no such rsID; the frequency is a placeholder, not data
      "fallback"  Ensembl could not be reached; the frequency is a placeholder, not data
    """
    clean_id = variant_id.strip().lower()
    # Normalize rsID if needed
    if not clean_id.startswith("rs"):
        # If passed without 'rs', check if it's pure digits
        if clean_id.isdigit():
            clean_id = f"rs{clean_id}"

    # 1. Check local cache
    cached = bio_cache.get_variant(clean_id)
    if cached:
        cached["_source"] = "cached"
        return cached

    # 2. Query Ensembl Variation
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            url = f"{ENSEMBL_REST_BASE}/variation/homo_sapiens/{clean_id}?pops=1"
            resp = await client.get(url)
            if resp.status_code == 404:
                return {
                    "variantId": clean_id,
                    "clinicalSignificance": ["Not found in Ensembl"],
                    "sasFrequency": 0.05,  # placeholder, not data
                    "mostSevereConsequence": "unknown",
                    "_source": "unmapped",
                }
            resp.raise_for_status()
            data = resp.json()

            # Parse Clinical Significance
            clin_sig = data.get("clinical_significance", [])
            if not clin_sig:
                clin_sig = ["None reported by Ensembl"]

            # Parse South Asian Population Frequency
            sas_freq = 0.0
            populations = data.get("populations", [])
            for pop in populations:
                pop_name = pop.get("population", "")
                if "1000GENOMES:phase_3:SAS" in pop_name or "gnomADg:SAS" in pop_name:
                    freq = pop.get("frequency")
                    if freq is not None:
                        sas_freq = round(float(freq), 4)
                        break

            # Fallback to minor allele frequency (MAF) if SAS specific is missing
            if sas_freq == 0.0 and data.get("MAF") is not None:
                sas_freq = round(float(data.get("MAF")), 4)

            result: dict[str, Any] = {
                "variantId": clean_id,
                "name": data.get("name", clean_id),
                "mostSevereConsequence": data.get("most_severe_consequence", "unknown"),
                "clinicalSignificance": [s.title() for s in clin_sig],
                "sasFrequency": sas_freq,
                "minorAllele": data.get("minor_allele", "N/A"),
                "ancestralAllele": data.get("ancestral_allele", "N/A"),
                "synonyms": data.get("synonyms", []),
                "_source": "live_api",
            }

            bio_cache.set_variant(clean_id, result)
            return result

        except httpx.HTTPError as exc:
            logger.warning(f"Variation API lookup error for {clean_id}: {exc}")
            return {
                "variantId": clean_id,
                "clinicalSignificance": ["Ensembl not reachable"],
                "sasFrequency": 0.05,  # placeholder, not data
                "error": str(exc),
                "_source": "fallback",
            }


def annotate_bystander_pathogenicity(
    gene_symbol: str,
    original_aa: str,
    edited_aa: str,
    classification: str,
) -> dict[str, Any]:
    """
    Rule-based impact label for an unintended (bystander) amino-acid change. NOT a ClinVar lookup.

    Inputs are the amino acids before and after the edit and the consequence class the scanner
    assigned. The output combines that class with the Grantham distance between the two residues
    (computed in grantham.py). Chemistry alone cannot say a missense change is harmful, so every
    unintended missense is returned as "needs review"; a distance above 100 is flagged.

    Keys: riskLevel, impactTag, granthamDistance (None for stops), granthamClass, biochemicalImpact,
    annotationBasis ("rule" or "curated"). The TypeScript twin is src/engines/crispr/bystanderImpact.ts.
    """
    distance = grantham_distance(original_aa, edited_aa)
    cls = grantham_class(distance) if distance is not None else None

    if original_aa == edited_aa or classification == "Silent (Synonymous)":
        return {
            "riskLevel": "Neutral",
            "impactTag": "Silent",
            "granthamDistance": 0,
            "granthamClass": None,
            "biochemicalImpact": "Same amino acid; the protein sequence does not change.",
            "annotationBasis": "rule",
        }

    if classification == "Nonsense (Premature Stop)":
        return {
            "riskLevel": "Flag",
            "impactTag": "Premature stop codon",
            "granthamDistance": None,
            "granthamClass": None,
            "biochemicalImpact": "Truncates the protein. Usually removed by nonsense-mediated decay.",
            "annotationBasis": "rule",
        }

    if classification == "Target Edit":
        makassar = gene_symbol == "HBB" and original_aa == "V" and edited_aa == "A"
        note = (
            "Val to Ala at this site gives Hb G-Makassar, reported as non-sickling (Newby et al. 2021). Curated note."
            if makassar
            else "Planned change at the target base."
        )
        return {
            "riskLevel": "Neutral",
            "impactTag": f"Intended edit {original_aa}>{edited_aa}",
            "granthamDistance": distance,
            "granthamClass": cls,
            "biochemicalImpact": note,
            "annotationBasis": "curated" if makassar else "rule",
        }

    if gene_symbol == "HBB" and original_aa == "E" and edited_aa == "V":
        return {
            "riskLevel": "Flag",
            "impactTag": "Glu>Val: the HbS sickle change",
            "granthamDistance": distance,
            "granthamClass": cls,
            "biochemicalImpact": "This is the sickle-cell substitution (rs334). Curated note.",
            "annotationBasis": "curated",
        }

    if distance is None:
        return {
            "riskLevel": "Review",
            "impactTag": f"Missense {original_aa}>{edited_aa}",
            "granthamDistance": None,
            "granthamClass": None,
            "biochemicalImpact": "Grantham distance is not defined for this residue.",
            "annotationBasis": "rule",
        }

    return {
        "riskLevel": "Flag" if distance > 100 else "Review",
        "impactTag": f"Missense {original_aa}>{edited_aa}, Grantham {distance}",
        "granthamDistance": distance,
        "granthamClass": cls,
        "biochemicalImpact": f"{cls.capitalize()} chemical change. Needs review; chemistry alone does not say if it is harmful.",
        "annotationBasis": "rule",
    }
