# backend/integrations/clinvar.py
"""
NCBI ClinVar & Ensembl Variation API Integration.
Provides real-time clinical pathogenicity, South Asian allele frequencies,
and bystander missense risk classification.
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import logging
from typing import Any
import httpx

from backend.integrations.cache import bio_cache

logger = logging.getLogger(__name__)

ENSEMBL_REST_BASE = "https://rest.ensembl.org"
HEADERS = {"Content-Type": "application/json", "User-Agent": "NanoCRISPR-3D/1.0"}


async def lookup_variant_details(variant_id: str) -> dict[str, Any]:
    """
    Looks up variant details, clinical significance, and 1000G South Asian (SAS)
    population allele frequencies using Ensembl Variation API.
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
                    "clinicalSignificance": ["Uncertain significance / Unmapped"],
                    "sasFrequency": 0.05,
                    "mostSevereConsequence": "unknown",
                    "_source": "unmapped",
                }
            resp.raise_for_status()
            data = resp.json()

            # Parse Clinical Significance
            clin_sig = data.get("clinical_significance", [])
            if not clin_sig:
                clin_sig = ["Not reported in ClinVar / Research only"]

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
                "clinicalSignificance": ["Service Offline / Cached Heuristic"],
                "sasFrequency": 0.05,
                "error": str(exc),
                "_source": "fallback",
            }


# Grantham chemical distance matrix snippet for evaluating amino acid replacement severity
GRANTHAM_SEVERITY: dict[tuple[str, str], str] = {
    ("E", "V"): "Radical (Pathogenic Risk; Polar Negative to Non-polar Hydrophobic)",
    ("E", "G"): "Moderate (HbG-Makassar; Polar to Small Neutral)",
    ("C", "T"): "Silent / Transition",
    ("R", "H"): "Conservative (Positive Basic to Aromatic Weak Basic)",
    ("K", "R"): "Conservative (Basic Anchor Preservation)",
    ("L", "T"): "Moderate (Hydrophobic to Polar Neutral)",
    ("F", "A"): "Radical (Aromatic Large to Small Aliphatic)",
}


def annotate_bystander_pathogenicity(
    gene_symbol: str,
    original_aa: str,
    edited_aa: str,
    classification: str,
) -> dict[str, Any]:
    """
    Evaluates clinical pathogenicity risk for a predicted bystander amino acid alteration.
    Combines Grantham biochemical property distance with ClinVar rules.
    """
    cache_key = f"{gene_symbol}:{original_aa}->{edited_aa}"
    cached = bio_cache.get_clinvar(cache_key)
    if cached:
        return cached

    if original_aa == edited_aa or classification == "Silent (Synonymous)":
        res = {
            "riskLevel": "Benign / Tolerated",
            "clinvarTag": "Likely Benign (Synonymous Codon)",
            "granthamDistance": 0,
            "biochemicalImpact": "No change to primary protein sequence.",
        }
    elif classification == "Nonsense (Premature Stop)":
        res = {
            "riskLevel": "High Pathogenic Risk",
            "clinvarTag": "Pathogenic (Premature Truncation / NMD)",
            "granthamDistance": 200,
            "biochemicalImpact": "Loss of downstream protein domains via nonsense-mediated decay.",
        }
    else:
        # Check known severe alterations
        severity = GRANTHAM_SEVERITY.get(
            (original_aa, edited_aa),
            "Non-conservative Missense Alteration",
        )
        is_known_hb_s = (gene_symbol == "HBB" and original_aa == "E" and edited_aa == "V")
        is_makassar = (gene_symbol == "HBB" and original_aa == "V" and edited_aa == "A") or (
            gene_symbol == "HBB" and original_aa == "E" and edited_aa == "G"
        )

        if is_known_hb_s:
            clin_tag = "Pathogenic (HbS Sickle Mutation rs334)"
            risk = "High Pathogenic Risk"
        elif is_makassar:
            clin_tag = "Benign / Protective (HbG-Makassar Non-sickling Variant)"
            risk = "Low Risk / Therapeutic Goal"
        else:
            clin_tag = "VUS (Variant of Uncertain Significance - ClinVar Watchlist)"
            risk = "Moderate Risk (Bystander Missense)"

        res = {
            "riskLevel": risk,
            "clinvarTag": clin_tag,
            "granthamDistance": 109 if "Radical" in severity else 60,
            "biochemicalImpact": severity,
        }

    bio_cache.set_clinvar(cache_key, res)
    return res
