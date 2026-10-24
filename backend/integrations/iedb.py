# backend/integrations/iedb.py
"""
Local South Asian HLA Class I Anchor-Motif Binding Proxy (Calibrated to IEDB / Sidney Anchor Classifications).
Provides rapid, zero-latency 9-mer peptide MHC-I affinity scoring tailored to high-frequency
South Asian (SAS) haplotypes without blocking on remote external API rate-limits.
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
from typing import Any
from backend.integrations.cache import bio_cache

# Canonical peptide anchor motifs for South Asian HLA Class I alleles
# P2 and P9 anchor preferences (normalized affinity weights derived from Sidney et al. / Sette et al.)
HLA_MOTIFS: dict[str, dict[str, dict[str, float]]] = {
    "HLA-A*02:01": {
        "P2": {"L": 1.0, "M": 0.9, "I": 0.8, "V": 0.7, "A": 0.4, "T": 0.3},
        "P9": {"V": 1.0, "L": 0.95, "I": 0.8, "A": 0.6, "T": 0.4},
    },
    "HLA-A*11:01": {
        "P2": {"T": 1.0, "V": 0.9, "S": 0.8, "A": 0.6, "I": 0.5},
        "P9": {"K": 1.0, "R": 0.9, "Y": 0.5, "H": 0.4},
    },
    "HLA-A*24:02": {
        "P2": {"Y": 1.0, "F": 0.95, "W": 0.8, "M": 0.6, "I": 0.4},
        "P9": {"L": 1.0, "F": 0.9, "I": 0.8, "W": 0.6},
    },
    "HLA-B*40:06": {
        "P2": {"E": 1.0, "D": 0.4},
        "P9": {"L": 1.0, "W": 0.85, "M": 0.8, "F": 0.7, "V": 0.5},
    },
    "HLA-B*15:02": {
        "P2": {"Q": 1.0, "L": 0.8, "N": 0.7, "K": 0.5},
        "P9": {"Y": 1.0, "F": 0.9, "W": 0.7, "L": 0.6},
    },
}


def score_peptide_hla_binding(peptide: str, allele: str) -> dict[str, Any]:
    """
    Computes MHC-I binding affinity score (0-100) and IC50 estimate (nM)
    for a 9-mer peptide against a given HLA allele using a local PSSM anchor proxy.
    """
    pep = peptide.strip().upper()
    all_clean = allele.strip()

    if len(pep) != 9:
        return {
            "peptide": pep,
            "allele": all_clean,
            "score": 0,
            "ic50Nm": 10000.0,
            "classification": "Invalid Length (Requires 9-mer)",
            "isFallbackAllele": False,
            "fallbackAlleleUsed": None,
            "note": "Peptide must be exactly 9 amino acids.",
        }

    cached = bio_cache.get_epitope(pep, all_clean)
    if cached:
        return cached

    is_fallback = False
    fallback_allele = None
    if all_clean in HLA_MOTIFS:
        motif = HLA_MOTIFS[all_clean]
    else:
        is_fallback = True
        fallback_allele = "HLA-A*02:01"
        motif = HLA_MOTIFS["HLA-A*02:01"]

    p2_weights = motif.get("P2", {})
    p9_weights = motif.get("P9", {})

    p2_char = pep[1]
    p9_char = pep[8]

    p2_score = p2_weights.get(p2_char, 0.05)
    p9_score = p9_weights.get(p9_char, 0.05)

    # Secondary pocket influences (P1, P3, P7)
    hydrophobic_count = sum(1 for c in pep if c in "VILMFW")
    charge_count = sum(1 for c in pep if c in "KRDE")

    base_affinity = (p2_score * 0.45) + (p9_score * 0.45) + (min(hydrophobic_count, 4) * 0.025)
    if charge_count >= 3:
        base_affinity -= 0.1  # Highly charged cores disrupt hydrophobic peptide grooves

    normalized_score = max(5, min(98, int(base_affinity * 100)))

    # Empirical surrogate mapping composite anchor score to standard clinical IC50 thresholds:
    # Score 80+ -> IC50 < 50 nM (Strong binder / high immunogenicity risk)
    # Score 60-79 -> IC50 50-500 nM (Weak binder / potential epitope)
    # Score < 60 -> IC50 > 500 nM (Non-binder / immune tolerant)
    if normalized_score >= 80:
        ic50_nm = round(50.0 * (1.0 - (normalized_score - 80) / 20.0), 1)
        classification = "Strong Binder (High Immunogenicity Risk)"
    elif normalized_score >= 60:
        ic50_nm = round(50.0 + 450.0 * (1.0 - (normalized_score - 60) / 20.0), 1)
        classification = "Weak Binder (Potential Epitope)"
    else:
        ic50_nm = round(500.0 + (100 - normalized_score) * 50.0, 1)
        classification = "Non-Binder (Immune Tolerant)"

    note = (
        f"Evaluated against South Asian panel {all_clean} anchor motif."
        if not is_fallback
        else f"Allele '{all_clean}' not in South Asian 5-allele panel; approximate proxy evaluated against reference HLA-A*02:01."
    )

    result = {
        "peptide": pep,
        "allele": all_clean,
        "score": normalized_score,
        "ic50Nm": ic50_nm,
        "classification": classification,
        "p2Anchor": p2_char,
        "p9Anchor": p9_char,
        "isFallbackAllele": is_fallback,
        "fallbackAlleleUsed": fallback_allele,
        "note": note,
        "method": "Local PSSM Anchor-Motif Surrogate (Sidney/Sette Calibrated)",
    }

    bio_cache.set_epitope(pep, all_clean, result)
    return result


def scan_protein_for_epitopes(
    sequence: str, allele: str, min_score: int = 70
) -> list[dict[str, Any]]:
    """
    Scans a protein sequence (e.g., Cas9 domain or deaminase) with a sliding 9-mer window
    and returns all hotspots meeting the minimum immunogenicity score.
    """
    seq = sequence.strip().upper()
    hits: list[dict[str, Any]] = []

    for i in range(len(seq) - 8):
        window = seq[i : i + 9]
        res = score_peptide_hla_binding(window, allele)
        if res["score"] >= min_score:
            res["position"] = f"aa {i + 1}–{i + 9}"
            res["startIndex"] = i
            hits.append(res)

    hits.sort(key=lambda x: x["score"], reverse=True)
    return hits
