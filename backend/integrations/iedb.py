# backend/integrations/iedb.py
"""
Anchor-motif heuristic for 9-mer peptide / HLA class I binding.

This is NOT the IEDB service and NOT a trained predictor (NetMHCpan, MHCflurry and the IEDB tools
are). It scores a peptide from two things only: how well residues 2 and 9 match a small hand-written
anchor table for five alleles, and a little credit for hydrophobic residues. The 0-100 score is a
ranking aid for the demo. The "IC50" is a straight-line rescaling of that score. Neither is a
measured or predicted binding affinity, and neither should be quoted as one.

An allele that is not in HLA_MOTIFS is scored with the HLA-A*02:01 table. The result says so in
`alleleModelled` and `alleleSupported`.

Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
from typing import Any
from backend.integrations.cache import bio_cache

# Hand-written P2 and P9 anchor preferences for five HLA class I alleles (weights 0-1).
# These are approximations written for this demo, not values exported from IEDB or a trained model.
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


METHOD_NOTE = "anchor-motif heuristic (P2/P9 table + hydrophobicity); not IEDB, not NetMHCpan"
IC50_NOTE = "linear rescaling of the heuristic score; not a predicted or measured IC50"


def _with_method(result: dict[str, Any], requested_allele: str) -> dict[str, Any]:
    """Adds the fields that say what the score is. Applied on cache hits too, so old rows get them."""
    supported = requested_allele in HLA_MOTIFS
    return {
        **result,
        "method": METHOD_NOTE,
        "ic50Note": IC50_NOTE,
        "alleleSupported": supported,
        "alleleModelled": requested_allele if supported else "HLA-A*02:01",
    }


def score_peptide_hla_binding(peptide: str, allele: str) -> dict[str, Any]:
    """
    Heuristic 0-100 anchor-fit score and a rescaled IC50 figure (nM) for a 9-mer against one HLA allele.
    See the module docstring for what this is and is not.
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
        }

    cached = bio_cache.get_epitope(pep, all_clean)
    if cached:
        return _with_method(cached, all_clean)

    motif = HLA_MOTIFS.get(all_clean, HLA_MOTIFS["HLA-A*02:01"])
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

    # Rescale the score to an IC50-like number in nM (lower = tighter), using the usual 50 / 500 nM
    # strong / weak cut-offs as anchors. This is a display convention, not a prediction.
    if normalized_score >= 80:
        ic50_nm = round(50.0 * (1.0 - (normalized_score - 80) / 20.0), 1)
        classification = "Strong Binder (High Immunogenicity Risk)"
    elif normalized_score >= 60:
        ic50_nm = round(50.0 + 450.0 * (1.0 - (normalized_score - 60) / 20.0), 1)
        classification = "Weak Binder (Potential Epitope)"
    else:
        ic50_nm = round(500.0 + (100 - normalized_score) * 50.0, 1)
        classification = "Non-Binder (Immune Tolerant)"

    result = {
        "peptide": pep,
        "allele": all_clean,
        "score": normalized_score,
        "ic50Nm": ic50_nm,
        "classification": classification,
        "p2Anchor": p2_char,
        "p9Anchor": p9_char,
    }

    bio_cache.set_epitope(pep, all_clean, result)
    return _with_method(result, all_clean)


def scan_protein_for_epitopes(
    sequence: str, allele: str, min_score: int = 70
) -> list[dict[str, Any]]:
    """
    Slides a 9-mer window along a protein and returns every window whose heuristic score is at least
    `min_score`, best first. Same caveats as score_peptide_hla_binding().
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
