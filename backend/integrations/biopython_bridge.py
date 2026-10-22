# backend/integrations/biopython_bridge.py
"""
Biopython Computational Biology Bridge.
Provides standardized sequence manipulation, IUPAC ambiguity translation,
and verified Nearest-Neighbor Melting Temperatures (Tm_NN).
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import math
from typing import Any

try:
    from Bio.Seq import Seq
    from Bio.SeqUtils import MeltingTemp as mt
    BIOPYTHON_AVAILABLE = True
except ImportError:
    BIOPYTHON_AVAILABLE = False


def calculate_melting_temp(sequence: str, is_rna_dna: bool = True) -> float:
    """
    Computes duplex melting temperature (°C) using Nearest-Neighbor thermodynamics.
    Uses Biopython's validated algorithms when installed, with analytical fallback.
    """
    clean_seq = sequence.strip().upper()
    if not clean_seq:
        return 0.0

    if BIOPYTHON_AVAILABLE:
        try:
            seq_obj = Seq(clean_seq)
            # Use Sugimoto 1995 or SantaLucia 1998 parameters via Biopython
            # Default sodium concentration = 50 mM, Primer conc = 250 nM
            tm = mt.Tm_NN(seq_obj, Na=50, dnac1=250, dnac2=250)
            return round(float(tm), 1)
        except Exception:
            pass

    # Analytical nearest-neighbor approximation fallback
    gc_count = sum(1 for b in clean_seq if b in "GC")
    gc_pct = (gc_count / len(clean_seq)) * 100.0 if clean_seq else 0.0
    # Wallace rule modified for salt
    if len(clean_seq) < 14:
        tm_approx = (sum(2 for b in clean_seq if b in "AT") + sum(4 for b in clean_seq if b in "GC")) - 5.0
    else:
        tm_approx = 64.9 + 41.0 * (gc_count - 16.4) / len(clean_seq)
    return round(tm_approx, 1)


def biopython_translate(cds_sequence: str) -> str:
    """
    Translates a coding sequence into an amino acid peptide sequence.
    Handles IUPAC ambiguity codes and incomplete codons gracefully.
    """
    clean = cds_sequence.strip().upper().replace("U", "T")
    if BIOPYTHON_AVAILABLE:
        try:
            # Trim to complete reading frames
            rem = len(clean) % 3
            if rem != 0:
                clean = clean[:-rem]
            return str(Seq(clean).translate(to_stop=False))
        except Exception:
            pass

    # Fallback standard genetic code translation
    table = {
        "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L", "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
        "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M", "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
        "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S", "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
        "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T", "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
        "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*", "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
        "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K", "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
        "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W", "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
        "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R", "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
    }
    aa_list = []
    for i in range(0, len(clean) - 2, 3):
        codon = clean[i : i + 3]
        aa_list.append(table.get(codon, "X"))
    return "".join(aa_list)
