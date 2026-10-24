# backend/integrations/clinvar.py
"""
Ensembl Variation (ClinVar-syndicated) & Bystander Pathogenicity Assessment.
Provides real-time clinical significance for cataloged variants via Ensembl Variation REST,
paired with a Grantham (1974) amino acid difference matrix for de novo bystander missense risk.
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
    Looks up cataloged variant details, ClinVar clinical significance, and 1000G / gnomAD
    South Asian (SAS) population allele frequencies using the Ensembl Variation API.
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

    # 2. Query Ensembl Variation (syndicates NCBI ClinVar and 1000 Genomes / gnomAD)
    async with httpx.AsyncClient(timeout=10.0, headers=HEADERS) as client:
        try:
            url = f"{ENSEMBL_REST_BASE}/variation/homo_sapiens/{clean_id}?pops=1"
            resp = await client.get(url)
            if resp.status_code == 404:
                return {
                    "variantId": clean_id,
                    "clinicalSignificance": ["Uncertain significance / Unmapped in ClinVar"],
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


# Complete 20x20 Grantham Amino Acid Difference Matrix (Grantham R., Science 1974; 185:862-864)
# Captures composition, polarity, and molecular volume evolutionary distance (scale 0-215).
GRANTHAM_MATRIX: dict[str, dict[str, int]] = {
    'A': {'A': 0, 'R': 112, 'N': 111, 'D': 126, 'C': 195, 'Q': 91, 'E': 107, 'G': 60, 'H': 86, 'I': 94, 'L': 96, 'K': 106, 'M': 84, 'F': 113, 'P': 27, 'S': 99, 'T': 58, 'W': 148, 'Y': 112, 'V': 64},
    'R': {'A': 112, 'R': 0, 'N': 86, 'D': 96, 'C': 180, 'Q': 43, 'E': 54, 'G': 125, 'H': 29, 'I': 97, 'L': 102, 'K': 26, 'M': 91, 'F': 97, 'P': 103, 'S': 110, 'T': 71, 'W': 101, 'Y': 77, 'V': 96},
    'N': {'A': 111, 'R': 86, 'N': 0, 'D': 23, 'C': 139, 'Q': 46, 'E': 42, 'G': 80, 'H': 68, 'I': 149, 'L': 153, 'K': 94, 'M': 142, 'F': 158, 'P': 91, 'S': 46, 'T': 65, 'W': 174, 'Y': 143, 'V': 133},
    'D': {'A': 126, 'R': 96, 'N': 23, 'D': 0, 'C': 154, 'Q': 61, 'E': 45, 'G': 94, 'H': 81, 'I': 168, 'L': 172, 'K': 101, 'M': 160, 'F': 177, 'P': 108, 'S': 65, 'T': 85, 'W': 181, 'Y': 160, 'V': 152},
    'C': {'A': 195, 'R': 180, 'N': 139, 'D': 154, 'C': 0, 'Q': 154, 'E': 170, 'G': 159, 'H': 174, 'I': 198, 'L': 198, 'K': 202, 'M': 196, 'F': 205, 'P': 169, 'S': 112, 'T': 149, 'W': 215, 'Y': 194, 'V': 192},
    'Q': {'A': 91, 'R': 43, 'N': 46, 'D': 61, 'C': 154, 'Q': 0, 'E': 29, 'G': 87, 'H': 24, 'I': 109, 'L': 113, 'K': 53, 'M': 101, 'F': 116, 'P': 76, 'S': 68, 'T': 42, 'W': 130, 'Y': 99, 'V': 96},
    'E': {'A': 107, 'R': 54, 'N': 42, 'D': 45, 'C': 170, 'Q': 29, 'E': 0, 'G': 98, 'H': 40, 'I': 134, 'L': 138, 'K': 56, 'M': 126, 'F': 140, 'P': 93, 'S': 80, 'T': 65, 'W': 152, 'Y': 122, 'V': 121},
    'G': {'A': 60, 'R': 125, 'N': 80, 'D': 94, 'C': 159, 'Q': 87, 'E': 98, 'G': 0, 'H': 98, 'I': 135, 'L': 138, 'K': 127, 'M': 127, 'F': 153, 'P': 42, 'S': 56, 'T': 59, 'W': 184, 'Y': 147, 'V': 109},
    'H': {'A': 86, 'R': 29, 'N': 68, 'D': 81, 'C': 174, 'Q': 24, 'E': 40, 'G': 98, 'H': 0, 'I': 94, 'L': 99, 'K': 32, 'M': 87, 'F': 100, 'P': 77, 'S': 89, 'T': 47, 'W': 115, 'Y': 83, 'V': 84},
    'I': {'A': 94, 'R': 97, 'N': 149, 'D': 168, 'C': 198, 'Q': 109, 'E': 134, 'G': 135, 'H': 94, 'I': 0, 'L': 5, 'K': 102, 'M': 10, 'F': 21, 'P': 95, 'S': 142, 'T': 89, 'W': 61, 'Y': 33, 'V': 29},
    'L': {'A': 96, 'R': 102, 'N': 153, 'D': 172, 'C': 198, 'Q': 113, 'E': 138, 'G': 138, 'H': 99, 'I': 5, 'L': 0, 'K': 107, 'M': 15, 'F': 22, 'P': 98, 'S': 145, 'T': 92, 'W': 61, 'Y': 36, 'V': 32},
    'K': {'A': 106, 'R': 26, 'N': 94, 'D': 101, 'C': 202, 'Q': 53, 'E': 56, 'G': 127, 'H': 32, 'I': 102, 'L': 107, 'K': 0, 'M': 95, 'F': 102, 'P': 103, 'S': 121, 'T': 78, 'W': 110, 'Y': 85, 'V': 97},
    'M': {'A': 84, 'R': 91, 'N': 142, 'D': 160, 'C': 196, 'Q': 101, 'E': 126, 'G': 127, 'H': 87, 'I': 10, 'L': 15, 'K': 95, 'M': 0, 'F': 28, 'P': 87, 'S': 135, 'T': 81, 'W': 67, 'Y': 36, 'V': 21},
    'F': {'A': 113, 'R': 97, 'N': 158, 'D': 177, 'C': 205, 'Q': 116, 'E': 140, 'G': 153, 'H': 100, 'I': 21, 'L': 22, 'K': 102, 'M': 28, 'F': 0, 'P': 114, 'S': 155, 'T': 103, 'W': 40, 'Y': 22, 'V': 50},
    'P': {'A': 27, 'R': 103, 'N': 91, 'D': 108, 'C': 169, 'Q': 76, 'E': 93, 'G': 42, 'H': 77, 'I': 95, 'L': 98, 'K': 103, 'M': 87, 'F': 114, 'P': 0, 'S': 74, 'T': 38, 'W': 147, 'Y': 110, 'V': 68},
    'S': {'A': 99, 'R': 110, 'N': 46, 'D': 65, 'C': 112, 'Q': 68, 'E': 80, 'G': 56, 'H': 89, 'I': 142, 'L': 145, 'K': 121, 'M': 135, 'F': 155, 'P': 74, 'S': 0, 'T': 58, 'W': 177, 'Y': 144, 'V': 124},
    'T': {'A': 58, 'R': 71, 'N': 65, 'D': 85, 'C': 149, 'Q': 42, 'E': 65, 'G': 59, 'H': 47, 'I': 89, 'L': 92, 'K': 78, 'M': 81, 'F': 103, 'P': 38, 'S': 58, 'T': 0, 'W': 128, 'Y': 97, 'V': 69},
    'W': {'A': 148, 'R': 101, 'N': 174, 'D': 181, 'C': 215, 'Q': 130, 'E': 152, 'G': 184, 'H': 115, 'I': 61, 'L': 61, 'K': 110, 'M': 67, 'F': 40, 'P': 147, 'S': 177, 'T': 128, 'W': 0, 'Y': 37, 'V': 88},
    'Y': {'A': 112, 'R': 77, 'N': 143, 'D': 160, 'C': 194, 'Q': 99, 'E': 122, 'G': 147, 'H': 83, 'I': 33, 'L': 36, 'K': 85, 'M': 36, 'F': 22, 'P': 110, 'S': 144, 'T': 97, 'W': 37, 'Y': 0, 'V': 50},
    'V': {'A': 64, 'R': 96, 'N': 133, 'D': 152, 'C': 192, 'Q': 96, 'E': 121, 'G': 109, 'H': 84, 'I': 29, 'L': 32, 'K': 97, 'M': 21, 'F': 50, 'P': 68, 'S': 124, 'T': 69, 'W': 88, 'Y': 50, 'V': 0},
}


def get_grantham_distance(aa1: str, aa2: str) -> int:
    """Returns the Grantham (1974) distance between two amino acids, defaulting to 100 for unknowns."""
    a1, a2 = aa1.upper(), aa2.upper()
    if a1 == a2:
        return 0
    if a1 in GRANTHAM_MATRIX and a2 in GRANTHAM_MATRIX[a1]:
        return GRANTHAM_MATRIX[a1][a2]
    return 100


def annotate_bystander_pathogenicity(
    gene_symbol: str,
    original_aa: str,
    edited_aa: str,
    classification: str,
) -> dict[str, Any]:
    """
    Evaluates clinical pathogenicity risk for a predicted bystander amino acid alteration.
    Combines the authentic Grantham (1974) distance matrix with clinical locus exception rules
    (e.g., HbS vs. HbG-Makassar) for de novo variants that lack pre-existing ClinVar records.
    """
    cache_key = f"{gene_symbol}:{original_aa}->{edited_aa}"
    cached = bio_cache.get_clinvar(cache_key)
    if cached:
        return cached

    orig = original_aa.upper()
    edit = edited_aa.upper()

    if orig == edit or classification == "Silent (Synonymous)":
        res = {
            "riskLevel": "Benign / Tolerated",
            "clinvarTag": "Likely Benign (Synonymous Codon)",
            "granthamDistance": 0,
            "biochemicalImpact": "No change to primary protein sequence.",
        }
    elif classification == "Nonsense (Premature Stop)" or edit == "*":
        res = {
            "riskLevel": "High Pathogenic Risk",
            "clinvarTag": "Pathogenic (Premature Truncation / NMD)",
            "granthamDistance": 200,
            "biochemicalImpact": "Loss of downstream protein domains via nonsense-mediated decay.",
        }
    else:
        # Calculate genuine Grantham distance
        g_dist = get_grantham_distance(orig, edit)

        # Standard Li / Grantham evolutionary divergence tiers:
        # <= 60: Conservative; 61-100: Moderately Conservative; 101-150: Moderately Radical; > 150: Radical
        if g_dist <= 60:
            severity = f"Conservative Missense (Grantham {g_dist} <= 60; Similar Physicochemical Properties)"
            default_risk = "Low Risk / Conservative Missense"
            default_tag = "VUS - Likely Tolerated (Conservative Grantham Score)"
        elif g_dist <= 100:
            severity = f"Moderately Conservative (Grantham {g_dist}; Moderate Physicochemical Shift)"
            default_risk = "Moderate Risk (Bystander Missense)"
            default_tag = "VUS (Variant of Uncertain Significance - ClinVar Watchlist)"
        elif g_dist <= 150:
            severity = f"Moderately Radical (Grantham {g_dist}; Notable Polarity/Volume Alteration)"
            default_risk = "Elevated Risk (Radical Missense)"
            default_tag = "VUS - High Impact (Radical Physicochemical Shift)"
        else:
            severity = f"Radical Alteration (Grantham {g_dist} > 150; Extreme Polarity/Charge Inversion)"
            default_risk = "High Pathogenic Risk"
            default_tag = "Likely Pathogenic (Severe Grantham Inversion)"

        # Clinical locus-specific overrides (e.g., HBB known sickle cell biology)
        is_known_hb_s = (gene_symbol == "HBB" and orig == "E" and edit == "V")
        is_makassar = (gene_symbol == "HBB" and orig == "V" and edit == "A") or (
            gene_symbol == "HBB" and orig == "E" and edit == "G"
        )

        if is_known_hb_s:
            clin_tag = "Pathogenic (HbS Sickle Mutation rs334)"
            risk = "High Pathogenic Risk"
        elif is_makassar:
            clin_tag = "Benign / Protective (HbG-Makassar Non-sickling Variant)"
            risk = "Low Risk / Therapeutic Goal"
        else:
            clin_tag = default_tag
            risk = default_risk

        res = {
            "riskLevel": risk,
            "clinvarTag": clin_tag,
            "granthamDistance": g_dist,
            "biochemicalImpact": severity,
        }

    bio_cache.set_clinvar(cache_key, res)
    return res

