# backend/thermodynamics.py
"""
NanoCRISPR-3D & ImmunoShield-DRA - thermodynamic and secondary-structure estimates

What each part is, so results are quoted for what they are:

1. RNA:DNA hybrid energy: nearest-neighbor sums with the Sugimoto et al. (1995) parameters.
   Standard method. The parameters were measured in 1 M NaCl; the code applies a simple salt
   correction for 150 mM, which is an approximation.
2. DNA:DNA duplex energy: nearest-neighbor sums with the SantaLucia (1998) unified parameters,
   with the same simple salt correction. Initiation terms assume G:C-terminated ends.
3. Spacer hairpin folding: a SIMPLIFIED Nussinov-style dynamic program that uses Turner-derived
   stack and loop numbers. It is not Zuker/Turner 2004 MFE and it is not ViennaRNA or mfold: it has
   no multiloop terms, no dangling-end or terminal-mismatch terms, no special hairpin bonuses, only
   some stack steps are tabulated (the rest default to -1.8 kcal/mol), the interior-loop cost is a
   linear guess, and the traceback only follows stacked helices. Use it to compare spacers with each
   other, not to quote a folding energy.
4. Homodimer and seed/distal partitioning: the same nearest-neighbor sums applied to sub-sequences.
   "R-loop net dG" subtracts two separate duplex energies; it is not a model of Cas9 R-loop
   propagation (no PAM, protein or supercoiling terms).

Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import math
from typing import Literal
from pydantic import BaseModel, Field

# ============================================================================
# 1. NEAREST-NEIGHBOR THERMODYNAMIC PARAMETER MATRICES
# ============================================================================

# Sugimoto et al. (Biochemistry 1995, 34, 11211-11216)
# RNA:DNA heteroduplex parameters: dH in kcal/mol, dS in cal/(mol*K), measured in 1 M NaCl.
# Key "XY" = RNA 5'-rXrY-3' paired with DNA 3'-dX'dY'-5' (T stands for U).
#
# These 16 rows were re-entered. The table that was here before differed from the published one in
# eight rows (AC, AG, CA, CT, TA, TC, TG and TT had other values), so the energies it produced were
# not Sugimoto's. The values below are checked for internal consistency (dG37 = dH - 310.15 * dS / 1000
# against the published dG37 column) by backend/checks/check_science.py, but could not be compared
# with the paper itself from the environment this was written in: check Table 3 of the paper before
# quoting a number from this module.
RNA_DNA_NN_PARAMS: dict[str, tuple[float, float]] = {
    "AA": (-7.8, -21.9), "AC": (-5.9, -12.3), "AG": (-9.1, -23.5), "AT": (-8.3, -23.9),
    "CA": (-9.0, -26.1), "CC": (-9.3, -23.2), "CG": (-16.3, -47.1), "CT": (-7.0, -19.7),
    "GA": (-5.5, -13.5), "GC": (-8.0, -17.1), "GG": (-12.8, -31.9), "GT": (-7.8, -21.6),
    "TA": (-7.8, -23.2), "TC": (-8.6, -22.9), "TG": (-10.4, -28.4), "TT": (-11.5, -36.4),
}

# SantaLucia (Proc. Natl. Acad. Sci. USA 1998, 95, 1460–1465)
# Unified DNA:DNA duplex parameters: dH in kcal/mol, dS in cal/(mol*K)
DNA_DNA_NN_PARAMS: dict[str, tuple[float, float]] = {
    "AA": (-7.9, -22.2), "TT": (-7.9, -22.2),
    "AT": (-7.2, -20.4), "TA": (-7.2, -21.3),
    "CA": (-8.5, -22.7), "TG": (-8.5, -22.7),
    "GT": (-8.4, -22.4), "AC": (-8.4, -22.4),
    "CT": (-7.8, -21.0), "AG": (-7.8, -21.0),
    "GA": (-8.2, -22.2), "TC": (-8.2, -22.2),
    "CG": (-10.6, -27.2), "GC": (-9.8, -24.4),
    "GG": (-8.0, -19.9), "CC": (-8.0, -19.9),
}

# RNA:RNA stacking free energies (dG_37, kcal/mol) in the style of the Turner (2004) nearest-neighbor
# set. This is a partial, rounded table: it has not been checked entry by entry against the published
# values, GU steps are approximate, and any step missing here falls back to -1.8 in the folding code.
# Format: ((5'-rA rB-3'), (3'-rA' rB'-5'))
RNA_RNA_STACKING_DG37: dict[tuple[str, str], float] = {
    ("GC", "CG"): -3.3, ("CG", "GC"): -2.4, ("GG", "CC"): -3.3, ("CC", "GG"): -3.3,
    ("AU", "UA"): -1.1, ("UA", "AU"): -1.3, ("AA", "UU"): -0.9, ("UU", "AA"): -0.9,
    ("GA", "CU"): -2.1, ("AG", "UC"): -2.1, ("GU", "UG"): -1.4, ("UG", "GU"): -1.0,
    ("AC", "UG"): -2.2, ("CA", "GU"): -1.9, ("CU", "GA"): -2.1, ("UC", "AG"): -1.4,
    ("AU", "UG"): -0.8, ("UA", "GU"): -1.0, ("GU", "UA"): -0.6, ("UG", "AU"): -0.7,
}

RNA_CANONICAL_PAIRS: set[tuple[str, str]] = {
    ("A", "U"), ("U", "A"),
    ("G", "C"), ("C", "G"),
    ("G", "U"), ("U", "G"), # Wobble pair
}

# ============================================================================
# 2. PYDANTIC DOMAIN SCHEMAS
# ============================================================================

class HairpinDescriptor(BaseModel):
    stemStart: int
    stemEnd: int
    stemLength: int
    loopLength: int
    stemSequence: str
    loopSequence: str
    dgHairpin: float


class ThermodynamicProfile(BaseModel):
    spacer: str
    rnaDnaDg37: float = Field(..., description="Sugimoto RNA:DNA hybrid free energy at 37°C in kcal/mol")
    rnaDnaDh: float = Field(..., description="Hybrid formation enthalpy in kcal/mol")
    rnaDnaDs: float = Field(..., description="Hybrid formation entropy in cal/(mol*K)")
    rnaDnaTm: float = Field(..., description="Melting temperature (°C) under physiological salt")
    dnaDnaDg37: float = Field(..., description="Target genomic DNA:DNA duplex stability (kcal/mol)")
    rLoopNetDg: float = Field(..., description="Net R-loop formation driving energy: dG(hybrid) - dG(target DNA)")
    isRLoopThermodynamicallyFavored: bool = Field(..., description="True if net R-loop formation is spontaneous (dG_net < 0)")
    hairpinDg: float = Field(..., description="Energy of the best fold found by the simplified folding routine, in kcal/mol (not a full MFE; see module docstring)")
    hairpinStructure: str = Field(..., description="Dot-bracket notation of the spacer secondary structure")
    hairpinStemLength: int = Field(..., description="Longest base-paired stem length in spacer")
    hairpinLoopSize: int = Field(..., description="Loop size of the primary hairpin")
    hairpinRisk: Literal["Low / Unstructured", "Moderate Hairpin", "Severe Hairpin Lock"]
    seedDg: float = Field(..., description="PAM-proximal seed region (positions 11-20) hybrid free energy (kcal/mol)")
    distalDg: float = Field(..., description="PAM-distal region (positions 1-10) hybrid free energy (kcal/mol)")
    seedAsymmetryDdg: float = Field(..., description="Thermodynamic asymmetry: seedDg - distalDg")
    hasGcClamp: bool = Field(..., description="True if positions 19 and 20 contain G or C")
    selfDimerDg: float = Field(..., description="Homodimerization duplex MFE (kcal/mol)")
    selfDimerRisk: Literal["Negligible", "Mild Dimer", "Inhibitory Homodimer"]
    thermodynamicVerdict: Literal[
        "Optimal Thermodynamic Profile",
        "Hairpin Prone (Steric Barrier)",
        "Weak R-Loop Driving Force",
        "Excessive Seed Binding (Off-Target Risk)",
    ]
    thermodynamicEfficiencyBonus: float = Field(..., description="Additive/penalty score (-15 to +10) applied to guide candidate")


class SecondaryStructureResult(BaseModel):
    sequence: str
    rnaSequence: str
    mfe: float
    dotBracket: str
    basePairs: list[list[int]]
    stemLength: int
    loopSize: int
    hairpins: list[HairpinDescriptor]
    hairpinRisk: Literal["Low / Unstructured", "Moderate Hairpin", "Severe Hairpin Lock"]
    biophysicalInterpretation: str


class HomodimerResult(BaseModel):
    sequence: str
    dimerDg: float
    dimerStructureTop: str
    dimerStructureBottom: str
    dimerRisk: Literal["Negligible", "Mild Dimer", "Inhibitory Homodimer"]
    biophysicalInterpretation: str


# ============================================================================
# 3. CORE COMPUTATIONAL ALGORITHMS
# ============================================================================

def calc_rna_dna_thermodynamics(
    spacer: str,
    na_conc_molar: float = 0.15,
    oligo_conc_molar: float = 2.5e-7,
) -> tuple[float, float, float, float]:
    """
    Sugimoto nearest-neighbor sum for the RNA:DNA hybrid: enthalpy, entropy, dG at 37 C and Tm.

    Parameters are from 1 M NaCl; the monovalent-salt term used here is a simple approximation
    (0.368 * (N - 1) * ln[Na+] added to the entropy). Treat the numbers as estimates.
    """
    clean_spacer = spacer.upper().replace("U", "T")
    # Initiation constants for RNA:DNA hybrid
    dh = 1.9
    ds = -3.9

    for i in range(len(clean_spacer) - 1):
        dinuc = clean_spacer[i : i + 2]
        step_h, step_s = RNA_DNA_NN_PARAMS.get(dinuc, (-7.5, -19.5))
        dh += step_h
        ds += step_s

    # SantaLucia monovalent salt correction for entropy
    n_nt = len(clean_spacer)
    ds_salt = ds + 0.368 * (n_nt - 1) * math.log(max(0.01, na_conc_molar))

    # Free energy at 37°C (310.15 K)
    dg37 = dh - 310.15 * (ds_salt / 1000.0)

    # Melting temperature Tm (°C) for non-self-complementary heteroduplex:
    # Tm = dH * 1000 / (dS_salt + R * ln(Ct / 4)) - 273.15
    gas_constant_r = 1.9872  # cal/(mol*K)
    denom = ds_salt + gas_constant_r * math.log(max(1e-12, oligo_conc_molar / 4.0))
    tm = (dh * 1000.0) / denom - 273.15 if denom != 0 else 0.0

    return round(dh, 1), round(ds_salt, 1), round(dg37, 2), round(tm, 1)


def calc_dna_dna_duplex(
    dna_seq: str,
    na_conc_molar: float = 0.15,
) -> float:
    """
    Computes SantaLucia (1998) unified genomic DNA:DNA target duplex stability dG_37 (kcal/mol).
    Used to calculate the thermodynamic cost of unwinding the target duplex during Cas9 R-loop invasion.
    """
    clean_seq = dna_seq.upper().replace("U", "T")
    dh = 0.2
    ds = -5.7

    for i in range(len(clean_seq) - 1):
        dinuc = clean_seq[i : i + 2]
        step_h, step_s = DNA_DNA_NN_PARAMS.get(dinuc, (-8.0, -22.0))
        dh += step_h
        ds += step_s

    n_nt = len(clean_seq)
    ds_salt = ds + 0.368 * (n_nt - 1) * math.log(max(0.01, na_conc_molar))
    dg37 = dh - 310.15 * (ds_salt / 1000.0)
    return round(dg37, 2)


def hairpin_loop_penalty(size: int) -> float:
    """Hairpin loop initiation penalty (kcal/mol), Turner-style: tabulated for 3-6 nt, log extrapolation above."""
    if size < 3:
        return float("inf")  # Steric impossibility
    penalties = {3: 5.4, 4: 5.6, 5: 5.7, 6: 5.8}
    if size in penalties:
        return penalties[size]
    # Jacobson-Stockmayer log extrapolation for loops > 6 nt
    return 5.8 + 1.08 * math.log(size / 6.0)


def predict_rna_secondary_structure(sequence: str) -> SecondaryStructureResult:
    """
    Simplified minimum-free-energy fold of a short RNA spacer (Nussinov-style dynamic program with
    Turner-derived stack and hairpin terms). Not Zuker/Turner 2004 and not ViennaRNA: see the module
    docstring for what is missing. Good for ranking spacers against each other, not for quoting an MFE.
    """
    rna_seq = sequence.upper().replace("T", "U")
    n = len(rna_seq)

    if n < 4:
        return SecondaryStructureResult(
            sequence=sequence,
            rnaSequence=rna_seq,
            mfe=0.0,
            dotBracket="." * n,
            basePairs=[],
            stemLength=0,
            loopSize=0,
            hairpins=[],
            hairpinRisk="Low / Unstructured",
            biophysicalInterpretation="Spacer too short for secondary structure folding.",
        )

    # W[i][j]: overall MFE of substring i..j
    W = [[0.0] * n for _ in range(n)]
    # V[i][j]: MFE of substring i..j assuming base i is paired with base j
    V = [[float("inf")] * n for _ in range(n)]

    # Dynamic programming filling by subsequence length l from 4 to n
    for l in range(4, n + 1):
        for i in range(0, n - l + 1):
            j = i + l - 1
            pair = (rna_seq[i], rna_seq[j])

            if pair in RNA_CANONICAL_PAIRS:
                loop_len = j - i - 1
                min_v = hairpin_loop_penalty(loop_len)

                # Bonus for G-C closing pair
                if pair in (("G", "C"), ("C", "G")):
                    min_v -= 0.6

                # Interior loop / bulge search
                if loop_len >= 5:
                    for k in range(i + 1, j - 4):
                        for m in range(k + 4, j):
                            inner_pair = (rna_seq[k], rna_seq[m])
                            if inner_pair in RNA_CANONICAL_PAIRS and V[k][m] < float("inf"):
                                interior_loop_cost = 1.6 + 0.35 * ((k - i - 1) + (j - m - 1))
                                min_v = min(min_v, V[k][m] + interior_loop_cost)

                # Helix extension stacking
                if i + 1 < j - 1:
                    inner_pair = (rna_seq[i + 1], rna_seq[j - 1])
                    if inner_pair in RNA_CANONICAL_PAIRS and V[i + 1][j - 1] < float("inf"):
                        step = (rna_seq[i] + rna_seq[i + 1], rna_seq[j - 1] + rna_seq[j])
                        stack_e = RNA_RNA_STACKING_DG37.get(step, -1.8)
                        min_v = min(min_v, V[i + 1][j - 1] + stack_e)

                V[i][j] = min_v

            # Overall minimum free energy of substring i..j
            min_w = min(W[i + 1][j], W[i][j - 1])
            if V[i][j] < float("inf"):
                min_w = min(min_w, V[i][j])
            for k in range(i + 1, j):
                min_w = min(min_w, W[i][k] + W[k + 1][j])
            W[i][j] = min_w

    # Backtracking to reconstruct dot-bracket notation
    dot_bracket = ["."] * n
    base_pairs: list[list[int]] = []

    def backtrack(i: int, j: int):
        if i >= j:
            return
        if math.isclose(W[i][j], W[i + 1][j], abs_tol=1e-5):
            backtrack(i + 1, j)
            return
        if math.isclose(W[i][j], W[i][j - 1], abs_tol=1e-5):
            backtrack(i, j - 1)
            return
        if math.isclose(W[i][j], V[i][j], abs_tol=1e-5) and V[i][j] < 0:
            dot_bracket[i] = "("
            dot_bracket[j] = ")"
            base_pairs.append([i, j])
            if i + 1 < j - 1:
                inner_pair = (rna_seq[i + 1], rna_seq[j - 1])
                if inner_pair in RNA_CANONICAL_PAIRS:
                    step = (rna_seq[i] + rna_seq[i + 1], rna_seq[j - 1] + rna_seq[j])
                    stack_e = RNA_RNA_STACKING_DG37.get(step, -1.8)
                    if math.isclose(V[i][j], V[i + 1][j - 1] + stack_e, abs_tol=1e-5):
                        backtrack(i + 1, j - 1)
                        return
            return
        for k in range(i + 1, j):
            if math.isclose(W[i][j], W[i][k] + W[k + 1][j], abs_tol=1e-5):
                backtrack(i, k)
                backtrack(k + 1, j)
                return

    mfe = min(0.0, W[0][n - 1])
    if mfe < -0.15:
        backtrack(0, n - 1)

    # Analyze identified stems and loops
    base_pairs.sort(key=lambda bp: bp[0])
    stem_length = len(base_pairs)
    loop_size = 0
    hairpins: list[HairpinDescriptor] = []

    if base_pairs:
        # Determine primary hairpin bounds
        first_bp = base_pairs[0]
        innermost_bp = base_pairs[-1]
        loop_size = max(0, innermost_bp[1] - innermost_bp[0] - 1)
        stem_seq = "".join(rna_seq[bp[0]] for bp in base_pairs)
        loop_seq = rna_seq[innermost_bp[0] + 1 : innermost_bp[1]]
        hairpins.append(
            HairpinDescriptor(
                stemStart=first_bp[0] + 1,
                stemEnd=first_bp[1] + 1,
                stemLength=stem_length,
                loopLength=loop_size,
                stemSequence=stem_seq,
                loopSequence=loop_seq,
                dgHairpin=round(mfe, 2),
            )
        )

    # Risk categorization
    if mfe <= -3.5:
        hairpin_risk = "Severe Hairpin Lock"
        interpretation = (
            f"Strong internal hairpin (ΔG = {mfe:.2f} kcal/mol). Stable stem-loop sterically "
            "hinders Cas9 R-loop initiation; higher kinetic barrier to target DNA unwinding."
        )
    elif mfe <= -1.8:
        hairpin_risk = "Moderate Hairpin"
        interpretation = (
            f"Mild hairpin tendency (ΔG = {mfe:.2f} kcal/mol). Weak stem can transiently compete "
            "with PAM-distal R-loop propagation, but generally permissive for editing."
        )
    else:
        hairpin_risk = "Low / Unstructured"
        interpretation = (
            f"Unstructured single-stranded spacer (ΔG = {mfe:.2f} kcal/mol). Completely accessible "
            "for rapid Cas9 ribonucleoprotein loading and R-loop nucleation."
        )

    return SecondaryStructureResult(
        sequence=sequence,
        rnaSequence=rna_seq,
        mfe=round(mfe, 2),
        dotBracket="".join(dot_bracket),
        basePairs=base_pairs,
        stemLength=stem_length,
        loopSize=loop_size,
        hairpins=hairpins,
        hairpinRisk=hairpin_risk,
        biophysicalInterpretation=interpretation,
    )


def predict_homodimer_stability(spacer: str) -> HomodimerResult:
    """
    Evaluates intermolecular self-dimerization of identical spacer molecules aligning
    in antiparallel orientation (5'->3' against 3'<-5').
    """
    seq = spacer.upper().replace("T", "U")
    rev = seq[::-1]
    n = len(seq)

    # Best alignment score matrix
    dp = [[0.0] * (n + 1) for _ in range(n + 1)]
    min_energy = 0.0
    best_i, best_j = 0, 0

    for i in range(1, n + 1):
        for j in range(1, n + 1):
            pair = (seq[i - 1], rev[j - 1])
            if pair in RNA_CANONICAL_PAIRS:
                base_energy = -3.0 if pair in (("G", "C"), ("C", "G")) else -1.2
                dp[i][j] = dp[i - 1][j - 1] + base_energy
                if dp[i][j] < min_energy:
                    min_energy = dp[i][j]
                    best_i, best_j = i, j
            else:
                dp[i][j] = 0.0

    dimer_dg = round(min_energy, 2)
    top_bracket = ["."] * n
    bot_bracket = ["."] * n

    if min_energy < -2.0 and best_i > 0 and best_j > 0:
        curr_i, curr_j = best_i, best_j
        while curr_i > 0 and curr_j > 0 and dp[curr_i][curr_j] < 0:
            top_bracket[curr_i - 1] = "|"
            bot_bracket[curr_j - 1] = "|"
            curr_i -= 1
            curr_j -= 1

    if dimer_dg <= -6.0:
        dimer_risk = "Inhibitory Homodimer"
        interp = f"Significant self-dimerization propensity (ΔG = {dimer_dg} kcal/mol). Risk of sgRNA duplexing in formulation."
    elif dimer_dg <= -3.0:
        dimer_risk = "Mild Dimer"
        interp = f"Low-to-moderate dimerization (ΔG = {dimer_dg} kcal/mol). Transient pairing in high-concentration stock."
    else:
        dimer_risk = "Negligible"
        interp = f"No significant self-dimerization detected (ΔG = {dimer_dg} kcal/mol). Monomeric in physiological solution."

    return HomodimerResult(
        sequence=spacer,
        dimerDg=dimer_dg,
        dimerStructureTop="".join(top_bracket),
        dimerStructureBottom="".join(bot_bracket),
        dimerRisk=dimer_risk,
        biophysicalInterpretation=interp,
    )


def compute_full_thermodynamic_profile(
    spacer: str,
    target_dna_seq: str | None = None,
) -> ThermodynamicProfile:
    """
    Computes complete nearest-neighbor thermodynamic profiling, RNA secondary structure
    hairpin folding, and biophysical scoring modifiers for any 20-nt CRISPR guide spacer.
    """
    clean_spacer = spacer.upper()
    target_dna = target_dna_seq.upper() if target_dna_seq else clean_spacer

    # 1. Sugimoto RNA:DNA heteroduplex metrics
    dh, ds, hybrid_dg, tm = calc_rna_dna_thermodynamics(clean_spacer)

    # 2. SantaLucia target genomic DNA:DNA duplex stability
    dna_dg = calc_dna_dna_duplex(target_dna)

    # 3. Net R-loop driving energy: dG_net = dG(hybrid) - dG(target DNA)
    r_loop_net = round(hybrid_dg - dna_dg, 2)
    is_r_loop_favored = r_loop_net < 0.0

    # 4. RNA secondary structure / hairpin energy (simplified Turner-style DP)
    sec_struct = predict_rna_secondary_structure(clean_spacer)

    # 5. Segmented Seed vs. Distal partitioning (Seed: positions 11-20, Distal: positions 1-10)
    distal_sub = clean_spacer[:10]
    seed_sub = clean_spacer[10:]
    _, _, distal_dg, _ = calc_rna_dna_thermodynamics(distal_sub)
    _, _, seed_dg, _ = calc_rna_dna_thermodynamics(seed_sub)
    seed_asymmetry = round(seed_dg - distal_dg, 2)

    # 6. GC clamp (positions 19 and 20)
    has_gc_clamp = len(clean_spacer) >= 20 and clean_spacer[18] in ("G", "C") and clean_spacer[19] in ("G", "C")

    # 7. Homodimer self-hybridization
    homodimer = predict_homodimer_stability(clean_spacer)

    # 8. Integrated Biophysical Efficiency Bonus / Penalty for Guide Ranking
    bonus = 0.0

    # Hairpin penalties
    if sec_struct.hairpinRisk == "Severe Hairpin Lock":
        bonus -= 12.0
    elif sec_struct.hairpinRisk == "Moderate Hairpin":
        bonus -= 5.0
    else:
        bonus += 4.0

    # R-loop net energy bonus
    if r_loop_net <= -5.0:
        bonus += 6.0
    elif r_loop_net <= -2.0:
        bonus += 3.0
    elif r_loop_net >= 0.0:
        bonus -= 8.0

    # Seed stability & asymmetry
    if -16.0 <= seed_dg <= -11.0:
        bonus += 3.0
    elif seed_dg < -17.5:
        bonus -= 4.0  # Excessively tight binding can slow deamination kinetics and elevate off-target risk

    # GC clamp
    if has_gc_clamp:
        bonus += 2.0

    # Dimerization penalty
    if homodimer.dimerRisk == "Inhibitory Homodimer":
        bonus -= 6.0

    # Overall thermodynamic verdict
    if sec_struct.hairpinRisk == "Severe Hairpin Lock":
        verdict = "Hairpin Prone (Steric Barrier)"
    elif not is_r_loop_favored or r_loop_net > -1.0:
        verdict = "Weak R-Loop Driving Force"
    elif seed_dg < -17.5:
        verdict = "Excessive Seed Binding (Off-Target Risk)"
    else:
        verdict = "Optimal Thermodynamic Profile"

    return ThermodynamicProfile(
        spacer=clean_spacer,
        rnaDnaDg37=hybrid_dg,
        rnaDnaDh=dh,
        rnaDnaDs=ds,
        rnaDnaTm=tm,
        dnaDnaDg37=dna_dg,
        rLoopNetDg=r_loop_net,
        isRLoopThermodynamicallyFavored=is_r_loop_favored,
        hairpinDg=sec_struct.mfe,
        hairpinStructure=sec_struct.dotBracket,
        hairpinStemLength=sec_struct.stemLength,
        hairpinLoopSize=sec_struct.loopSize,
        hairpinRisk=sec_struct.hairpinRisk,
        seedDg=seed_dg,
        distalDg=distal_dg,
        seedAsymmetryDdg=seed_asymmetry,
        hasGcClamp=has_gc_clamp,
        selfDimerDg=homodimer.dimerDg,
        selfDimerRisk=homodimer.dimerRisk,
        thermodynamicVerdict=verdict,
        thermodynamicEfficiencyBonus=round(bonus, 1),
    )
