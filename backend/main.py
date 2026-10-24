# backend/main.py
"""
NanoCRISPR-3D & ImmunoShield-DRA — Python Computational Biology Backend
Author: Arunabha Ghosh (MAKAUT)
License: Apache-2.0
"""

from __future__ import annotations
import math
from typing import Literal
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from backend.thermodynamics import (
        ThermodynamicProfile,
        SecondaryStructureResult,
        HomodimerResult,
        compute_full_thermodynamic_profile,
        predict_rna_secondary_structure,
        predict_homodimer_stability,
    )
    from backend.integrations import (
        lookup_ensembl_gene,
        lookup_variant_details,
        annotate_bystander_pathogenicity,
        score_peptide_hla_binding,
        scan_protein_for_epitopes,
        calculate_melting_temp,
        biopython_translate,
    )
except ImportError:
    from thermodynamics import (
        ThermodynamicProfile,
        SecondaryStructureResult,
        HomodimerResult,
        compute_full_thermodynamic_profile,
        predict_rna_secondary_structure,
        predict_homodimer_stability,
    )
    from integrations import (
        lookup_ensembl_gene,
        lookup_variant_details,
        annotate_bystander_pathogenicity,
        score_peptide_hla_binding,
        scan_protein_for_epitopes,
        calculate_melting_temp,
        biopython_translate,
    )

app = FastAPI(
    title="NanoCRISPR-3D Bio-Engine API",
    version="1.0.0",
    description="Thermodynamic CRISPR base editing, LNP biophysics, and South Asian HLA de-immunization engine.",
)

# Enable CORS for Vite local dev server (ports 5173 / 4173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 1. DOMAIN SCHEMAS (Strictly aligned with src/engines/types.ts)
# ============================================================================


class GenePreset(BaseModel):
    id: str
    symbol: str
    name: str
    disease: str
    targetOrgan: Literal["Liver", "Bone Marrow (HSPC)", "Lung"]
    editorType: Literal["ABE8e (A→G)", "ABE9 (A→G; window 5–6)", "BE4max (C→T)"]
    pamVariant: Literal["SpCas9", "SpCas9-NG", "SpRY"] = "SpCas9"
    sequence: str
    mutationIndex: int
    sasSnpIndex: int
    sasSnpId: str = "Unmapped"
    sasAlleleFreq: float = 0.05
    clinicalNote: str = ""
    _source: str = "curated_preset"
    isExploratoryPrototype: bool = False

    model_config = {"extra": "ignore"}


class BystanderEdit(BaseModel):
    guidePos: int
    genomicIndex: int
    originalCodon: str
    editedCodon: str
    originalAA: str
    editedAA: str
    classification: Literal[
        "Target Edit",
        "Silent (Synonymous)",
        "Missense (Pathogenic Risk)",
        "Nonsense (Premature Stop)",
    ]


class GuideCandidate(BaseModel):
    id: str
    spacer: str
    pam: str
    strand: Literal["+", "-"]
    startIndex: int
    gcContent: int
    targetInWindow: bool
    bystanders: list[BystanderEdit]
    hasSasSnpCollision: bool
    CompositeScore: int
    verdict: Literal[
        "Optimal Clinical Guide",
        "Safe (Silent Bystander)",
        "High Risk (Bystander/SNP)",
        "Low Efficiency",
    ]
    thermoProfile: ThermodynamicProfile | None = None


class LnpFormulation(BaseModel):
    ionizableLipid: float
    dspcHelper: float
    cholesterol: float
    pegLipid: float
    lipidPka: float
    npRatio: float


class OrganTropism(BaseModel):
    liver: int
    spleen: int
    lungs: int


class LnpBiophysicsResult(BaseModel):
    diameterNm: int
    pdi: float
    zetaPotentialMv: float
    endosomalProtonationPct: int
    bloodProtonationPct: int
    endosomalEscapeEfficiency: int
    cellularUptakeScore: int
    deGennesRfOverD: float
    criticalPackingParam: float
    saxsBraggSpacingNm: float
    organTropism: OrganTropism
    stabilityStatus: Literal[
        "Optimal Clinical LNP",
        "PEG Stealth Dilemma (Low Uptake)",
        "Aggregation Risk (Too Large)",
        "Poor Endosomal Escape",
    ]


class ComponentMass(BaseModel):
    name: str
    role: str
    molarPct: float
    mw: float
    massMg: float
    molarConcMm: float


class BatchMassCalculation(BaseModel):
    targetVolumeMl: float
    mrnaConcMgMl: float
    totalMrnaMassMg: float
    totalLipidMassMg: float
    components: list[ComponentMass]


class BatchMassRequest(BaseModel):
    form: LnpFormulation
    targetVolumeMl: float = 10.0
    mrnaConcMgMl: float = 1.0


class EpitopeHotspot(BaseModel):
    peptide: str
    residueRange: str
    domain: str
    hlaAllele: str
    hlaAlleles: list[str]
    bindingScore: int
    stealthMutation: str
    catalyticSafe: bool


class HlaAssessmentRequest(BaseModel):
    selectedAlleles: list[str] = []
    activeStealthMutations: dict[str, bool] = {}

    model_config = {"extra": "ignore"}


class HlaAssessmentResult(BaseModel):
    patientRelevantEpitopes: list[EpitopeHotspot]
    residualRiskScore: int


class ThermodynamicRequest(BaseModel):
    spacer: str


class SecondaryStructureRequest(BaseModel):
    sequence: str


class HomodimerRequest(BaseModel):
    spacer: str


class BystanderAnnotationRequest(BaseModel):
    geneSymbol: str
    bystanders: list[BystanderEdit]


class EpitopeScanRequest(BaseModel):
    sequence: str
    allele: str
    minScore: int = 70


class EpitopeScoreRequest(BaseModel):
    peptide: str
    allele: str



# ============================================================================
# 2. BIOCHEMICAL CONSTANTS & THERMODYNAMIC TABLES
# ============================================================================

CODON_TABLE: dict[str, str] = {
    "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L", "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
    "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M", "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
    "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S", "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
    "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T", "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
    "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*", "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
    "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K", "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
    "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W", "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
    "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R", "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
}

# Sugimoto et al. (1995) RNA:DNA hybrid nearest-neighbor free energy parameters (dG_37 in kcal/mol)
RNA_DNA_DG37: dict[str, float] = {
    "AA": -1.0, "AT": -0.9, "AC": -2.1, "AG": -1.8,
    "TA": -0.9, "TT": -0.2, "TC": -1.5, "TG": -1.6,
    "CA": -1.7, "CT": -0.9, "CC": -2.1, "CG": -2.7,
    "GA": -1.5, "GT": -1.1, "GC": -2.7, "GG": -2.9,
}

# Empirical positional activity weights used by the local guide-ranking model.
ABE8E_POS_WEIGHTS: dict[int, float] = {4: 0.78, 5: 1.00, 6: 1.00, 7: 0.92, 8: 0.68}
ABE9_POS_WEIGHTS: dict[int, float] = {5: 1.00, 6: 1.00}
BE4MAX_POS_WEIGHTS: dict[int, float] = {4: 0.88, 5: 0.98, 6: 1.00, 7: 0.86, 8: 0.62}

BASE_EDITOR_CONFIGS: dict[str, dict[str, object]] = {
    "ABE8e (A→G)": {
        "target_base": "A",
        "replacement_base": "G",
        "window": (4, 8),
        "weights": ABE8E_POS_WEIGHTS,
    },
    "ABE9 (A→G; window 5–6)": {
        "target_base": "A",
        "replacement_base": "G",
        "window": (5, 6),
        "weights": ABE9_POS_WEIGHTS,
    },
    "BE4max (C→T)": {
        "target_base": "C",
        "replacement_base": "T",
        "window": (4, 8),
        "weights": BE4MAX_POS_WEIGHTS,
    },
}

CAS9_EPITOPE_HOTSPOTS: list[EpitopeHotspot] = [
    EpitopeHotspot(
        peptide="NLIALSLGL",
        residueRange="aa 236–244",
        domain="REC2 Domain",
        hlaAllele="HLA-A*02:01 / HLA-A*24:02 (Common Indian)",
        hlaAlleles=["HLA-A*02:01", "HLA-A*24:02"],
        bindingScore=92,
        stealthMutation="L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="KTYAHLFDD",
        residueRange="aa 836–844",
        domain="HNH Catalytic Core (Contains H840)",
        hlaAllele="HLA-A*11:01 (High South Asian Frequency ~21%)",
        hlaAlleles=["HLA-A*11:01"],
        bindingScore=84,
        stealthMutation="K836R (Preserves H840 active-site histidine required for strand nicking)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="IYLAAANRL",
        residueRange="aa 1012–1020",
        domain="RuvC-III Domain",
        hlaAllele="HLA-A*24:02 (South Asian Frequency ~18%)",
        hlaAlleles=["HLA-A*24:02"],
        bindingScore=88,
        stealthMutation="L1020G (Eliminates C-terminal anchor binding to HLA groove)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="FEDFLKNRM",
        residueRange="aa 418–426",
        domain="Bridge Helix (Structural Stability)",
        hlaAllele="HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)",
        hlaAlleles=["HLA-B*40:06"],
        bindingScore=81,
        stealthMutation="F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)",
        catalyticSafe=True,
    ),
    EpitopeHotspot(
        peptide="TLYETRRDL",
        residueRange="aa 674–682",
        domain="REC3 Domain (Target RNA Alignment)",
        hlaAllele="HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)",
        hlaAlleles=["HLA-B*15:02"],
        bindingScore=78,
        stealthMutation="L675S (Ablates C-terminal peptide binding to MHC cleft)",
        catalyticSafe=True,
    ),
]


def reverse_complement(seq: str) -> str:
    comp = {"A": "T", "T": "A", "C": "G", "G": "C", "N": "N"}
    return "".join(comp.get(b, b) for b in reversed(seq.upper()))


def classify_pam(
    pam: str, pam_variant: Literal["SpCas9", "SpCas9-NG", "SpRY"]
) -> Literal["preferred", "relaxed"] | None:
    """Classify a concrete 3-nt PAM using the same rules as the web engine."""
    normalized = pam.upper()
    if len(normalized) != 3 or any(base not in "ACGT" for base in normalized):
        return None

    second_base, third_base = normalized[1], normalized[2]
    if pam_variant == "SpCas9":
        if second_base == "G" and third_base == "G":
            return "preferred"
        # NAG is 5'-N-A-G-3', not NGA.
        if second_base == "A" and third_base == "G":
            return "relaxed"
        return None
    if pam_variant == "SpCas9-NG":
        if second_base != "G":
            return None
        return "preferred" if third_base == "G" else "relaxed"

    # SpRY is modeled as NNN, with NRN preferred over NYN for ranking.
    return "preferred" if second_base in ("A", "G") else "relaxed"


def calc_rna_dna_dg37(spacer: str) -> float:
    """Computes nearest-neighbor RNA:DNA hybrid stability (kcal/mol at 37°C)."""
    dg = 1.9  # Helix initiation penalty
    for k in range(len(spacer) - 1):
        dinuc = spacer[k : k + 2]
        dg += RNA_DNA_DG37.get(dinuc, -1.4)
    return round(dg, 2)


def score_candidate_thermodynamic(
    spacer: str,
    has_preferred_pam: bool,
    gc_content: int,
    target_in_window: bool,
    target_pos_weight: float,
    edits: list[BystanderEdit],
    has_sas_snp: bool,
    thermo: ThermodynamicProfile | None = None,
) -> tuple[int, Literal["Optimal Clinical Guide", "Safe (Silent Bystander)", "High Risk (Bystander/SNP)", "Low Efficiency"]]:
    score = 65.0 if has_preferred_pam else 48.0

    if thermo is not None:
        # Deep thermodynamic nearest-neighbor, secondary structure, and R-loop energy modifiers
        score += thermo.thermodynamicEfficiencyBonus
    else:
        # Fallback to basic nearest-neighbor
        dg37 = calc_rna_dna_dg37(spacer)
        if -34.5 <= dg37 <= -24.0 and 40 <= gc_content <= 60:
            score += 16.0
        elif 35 <= gc_content <= 65:
            score += 9.0
        else:
            score -= 10.0

    # 2. Seed Region (positions 13-20 proximal to PAM) G/C nucleation stability
    seed_gc = sum(1 for b in spacer[12:20] if b in ("G", "C"))
    if 3 <= seed_gc <= 6:
        score += 4.0

    # 3. Empirical Deaminase Positional Efficiency
    if target_in_window:
        score += 32.0 + (target_pos_weight * 8.0)
    else:
        score -= 25.0

    # 4. U6 Pol III termination check (TTTT)
    has_pol_iii_stop = "TTTT" in spacer
    if has_pol_iii_stop:
        score -= 30.0

    # 5. Bystander Codon Consequence Penalties
    has_harmful_bystander = False
    has_silent_bystander = False
    for e in edits:
        if e.classification == "Nonsense (Premature Stop)":
            score -= 45.0
            has_harmful_bystander = True
        elif e.classification == "Missense (Pathogenic Risk)":
            score -= 25.0
            has_harmful_bystander = True
        elif e.classification == "Silent (Synonymous)":
            score += 4.0
            has_silent_bystander = True

    if has_sas_snp:
        score -= 20.0

    final_score = max(5, min(99, round(score)))

    verdict: Literal[
        "Optimal Clinical Guide",
        "Safe (Silent Bystander)",
        "High Risk (Bystander/SNP)",
        "Low Efficiency",
    ] = "Low Efficiency"

    has_severe_hairpin = thermo is not None and thermo.hairpinRisk == "Severe Hairpin Lock"

    if target_in_window and not has_harmful_bystander and not has_sas_snp and not has_pol_iii_stop and not has_severe_hairpin:
        verdict = "Safe (Silent Bystander)" if has_silent_bystander else "Optimal Clinical Guide"
    elif has_harmful_bystander or has_sas_snp or has_severe_hairpin:
        verdict = "High Risk (Bystander/SNP)"

    return final_score, verdict


# ============================================================================
# 3. API ENDPOINTS
# ============================================================================


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "online",
        "engine": "NanoCRISPR-3D Python FastAPI Bio-Engine",
        "modules": [
            "Sugimoto (1995) RNA:DNA Nearest-Neighbor Thermodynamics (Genuine Published Matrix)",
            "SantaLucia (1998) Unified Target DNA Duplex & Net R-Loop Driving Energy",
            "Simplified Turner (2004) Nearest-Neighbor Dynamic Programming (20-nt Protospacer Hairpin Filter)",
            "Spacer-Spacer Homodimerization & PAM-Proximal Seed Asymmetry Engine",
            "ABE8e/BE4max Empirical Positional Activity Weights",
            "Empirical Surrogate LNP Biophysics (Calibrated to Israelachvili CPP & De Gennes Brush Scaling)",
            "Local South Asian MHC-I Anchor-Motif Proxy (Sidney / Sette Calibrated)",
            "Authentic Grantham (1974) Amino Acid Difference Matrix & Ensembl-ClinVar Syndication",
        ],
    }


@app.post("/api/v1/crispr/scan", response_model=list[GuideCandidate])
def scan_guides(preset: GenePreset) -> list[GuideCandidate]:
    seq = preset.sequence.upper()
    editor_config = BASE_EDITOR_CONFIGS[preset.editorType]
    target_base = str(editor_config["target_base"])
    replacement_base = str(editor_config["replacement_base"])
    window_start, window_end = editor_config["window"]
    pos_weights = editor_config["weights"]

    candidates: list[GuideCandidate] = []

    # 1. Sense (+) Strand Scan
    for i in range(0, len(seq) - 22):
        spacer = seq[i : i + 20]
        pam = seq[i + 20 : i + 23]
        pam_classification = classify_pam(pam, preset.pamVariant)
        if pam_classification is None:
            continue

        gc_count = sum(1 for b in spacer if b in ("G", "C"))
        gc_content = round((gc_count / 20) * 100)

        # Co-editing across the selected editor's activity window.
        co_edited = list(seq)
        for pos in range(window_start, window_end + 1):
            g_idx = i + (pos - 1)
            if 0 <= g_idx < len(seq) and seq[g_idx] == target_base:
                co_edited[g_idx] = replacement_base
        co_edited_seq = "".join(co_edited)

        edits: list[BystanderEdit] = []
        target_in_window = False
        target_pos_weight = 0.0

        for pos in range(window_start, window_end + 1):
            g_idx = i + (pos - 1)
            if g_idx < 0 or g_idx >= len(seq):
                continue
            if seq[g_idx] == target_base:
                codon_start = (g_idx // 3) * 3
                orig_codon = seq[codon_start : codon_start + 3]
                if len(orig_codon) < 3:
                    continue
                edit_codon = co_edited_seq[codon_start : codon_start + 3]
                orig_aa = CODON_TABLE.get(orig_codon, "?")
                edit_aa = CODON_TABLE.get(edit_codon, "?")

                is_target = g_idx == preset.mutationIndex
                if is_target:
                    target_in_window = True
                    target_pos_weight = pos_weights.get(pos, 0.8)

                classification: BystanderEdit.__annotations__["classification"] = (
                    "Missense (Pathogenic Risk)"
                )
                if is_target:
                    classification = "Target Edit"
                elif edit_aa == "*":
                    classification = "Nonsense (Premature Stop)"
                elif orig_aa == edit_aa:
                    classification = "Silent (Synonymous)"

                edits.append(
                    BystanderEdit(
                        guidePos=pos,
                        genomicIndex=g_idx,
                        originalCodon=orig_codon,
                        editedCodon=edit_codon,
                        originalAA=orig_aa,
                        editedAA=edit_aa,
                        classification=classification,
                    )
                )

        has_sas_snp = i <= preset.sasSnpIndex <= (i + 22)
        thermo = compute_full_thermodynamic_profile(spacer)
        score, verdict = score_candidate_thermodynamic(
            spacer,
            pam_classification == "preferred",
            gc_content,
            target_in_window,
            target_pos_weight,
            edits,
            has_sas_snp,
            thermo=thermo,
        )

        candidates.append(
            GuideCandidate(
                id=f"sgRNA-f{i + 1}",
                spacer=spacer,
                pam=pam,
                strand="+",
                startIndex=i,
                gcContent=gc_content,
                targetInWindow=target_in_window,
                bystanders=edits,
                hasSasSnpCollision=has_sas_snp,
                CompositeScore=score,
                verdict=verdict,
                thermoProfile=thermo,
            )
        )

    # 2. Antisense (-) Strand Scan (3' PAM at sense indices i-3 .. i-1)
    sense_replacement = "C" if target_base == "A" else "A"
    for i in range(3, len(seq) - 19):
        spacer = reverse_complement(seq[i : i + 20])
        pam = reverse_complement(seq[i - 3 : i])
        pam_classification = classify_pam(pam, preset.pamVariant)
        if pam_classification is None:
            continue

        gc_count = sum(1 for b in spacer if b in ("G", "C"))
        gc_content = round((gc_count / 20) * 100)

        co_edited = list(seq)
        for pos in range(window_start, window_end + 1):
            g_idx = (i + 19) - (pos - 1)
            if 0 <= g_idx < len(seq) and reverse_complement(seq[g_idx]) == target_base:
                co_edited[g_idx] = sense_replacement
        co_edited_seq = "".join(co_edited)

        edits = []
        target_in_window = False
        target_pos_weight = 0.0

        for pos in range(window_start, window_end + 1):
            g_idx = (i + 19) - (pos - 1)
            if g_idx < 0 or g_idx >= len(seq):
                continue
            if reverse_complement(seq[g_idx]) == target_base:
                codon_start = (g_idx // 3) * 3
                orig_codon = seq[codon_start : codon_start + 3]
                if len(orig_codon) < 3:
                    continue
                edit_codon = co_edited_seq[codon_start : codon_start + 3]
                orig_aa = CODON_TABLE.get(orig_codon, "?")
                edit_aa = CODON_TABLE.get(edit_codon, "?")

                is_target = g_idx == preset.mutationIndex
                if is_target:
                    target_in_window = True
                    target_pos_weight = pos_weights.get(pos, 0.8)

                classification = "Missense (Pathogenic Risk)"
                if is_target:
                    classification = "Target Edit"
                elif edit_aa == "*":
                    classification = "Nonsense (Premature Stop)"
                elif orig_aa == edit_aa:
                    classification = "Silent (Synonymous)"

                edits.append(
                    BystanderEdit(
                        guidePos=pos,
                        genomicIndex=g_idx,
                        originalCodon=orig_codon,
                        editedCodon=edit_codon,
                        originalAA=orig_aa,
                        editedAA=edit_aa,
                        classification=classification,
                    )
                )

        has_sas_snp = (i - 3) <= preset.sasSnpIndex <= (i + 19)
        thermo = compute_full_thermodynamic_profile(spacer)
        score, verdict = score_candidate_thermodynamic(
            spacer,
            pam_classification == "preferred",
            gc_content,
            target_in_window,
            target_pos_weight,
            edits,
            has_sas_snp,
            thermo=thermo,
        )

        candidates.append(
            GuideCandidate(
                id=f"sgRNA-r{i + 1}",
                spacer=spacer,
                pam=pam,
                strand="-",
                startIndex=i,
                gcContent=gc_content,
                targetInWindow=target_in_window,
                bystanders=edits,
                hasSasSnpCollision=has_sas_snp,
                CompositeScore=score,
                verdict=verdict,
                thermoProfile=thermo,
            )
        )

    candidates.sort(key=lambda c: c.CompositeScore, reverse=True)
    return candidates[:10]


@app.post("/api/v1/crispr/thermodynamics", response_model=ThermodynamicProfile)
def get_thermodynamics(req: ThermodynamicRequest) -> ThermodynamicProfile:
    """
    Computes Sugimoto (1995) RNA:DNA heteroduplex, SantaLucia (1998) target DNA duplex unwinding,
    net R-loop driving energy (dG_net), Turner (2004) hairpin MFE, and seed asymmetry.
    """
    return compute_full_thermodynamic_profile(req.spacer)


@app.post("/api/v1/crispr/secondary-structure", response_model=SecondaryStructureResult)
def get_secondary_structure(req: SecondaryStructureRequest) -> SecondaryStructureResult:
    """
    Computes Turner (2004) nearest-neighbor dynamic programming minimum free energy (MFE)
    secondary structure prediction with dot-bracket notation and hairpin loop descriptors.
    """
    return predict_rna_secondary_structure(req.sequence)


@app.post("/api/v1/crispr/homodimer", response_model=HomodimerResult)
def get_homodimer(req: HomodimerRequest) -> HomodimerResult:
    """
    Predicts spacer-spacer antiparallel self-dimerization hybridization stability (dG).
    """
    return predict_homodimer_stability(req.spacer)


@app.post("/api/v1/nanotech/simulate", response_model=LnpBiophysicsResult)
def simulate_lnp(form: LnpFormulation) -> LnpBiophysicsResult:
    raw_total = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid
    total = raw_total if raw_total > 0 else 100.0

    norm_ion = (form.ionizableLipid / total) * 100.0
    norm_dspc = (form.dspcHelper / total) * 100.0
    norm_chol = (form.cholesterol / total) * 100.0
    norm_peg = max(0.1, (form.pegLipid / total) * 100.0)

    # 1. Hydrodynamic diameter (Dh in nm) via surface curvature & N/P compaction
    raw_dh = (
        135.0
        - 24.0 * math.log(max(0.3, norm_peg * 2.2))
        + (6.0 - form.npRatio) * 3.5
        + (norm_dspc - 10.0) * 0.45
    )
    diameter_nm = round(max(42.0, min(210.0, raw_dh)))

    # 2. Polydispersity Index (PDI)
    chol_dev = abs(norm_chol - 38.5) * 0.004
    dspc_dev = abs(norm_dspc - 10.0) * 0.0025
    low_peg_pen = 0.12 if norm_peg < 1.0 else 0.0
    pdi = round(min(0.45, 0.06 + chol_dev + dspc_dev + low_peg_pen), 2)

    # 3. Henderson-Hasselbalch Ionization
    endosomal_prot = round(100.0 / (1.0 + math.pow(10.0, 5.5 - form.lipidPka)))
    blood_prot = round(100.0 / (1.0 + math.pow(10.0, 7.4 - form.lipidPka)))

    # 4. Zeta potential at pH 7.4 (mV)
    zeta_mv = round((blood_prot * 0.35) - (norm_peg * 2.1), 1)

    # 5. De Gennes Polymer Brush Scaling & ApoE Opsonization
    peg_mol_frac = max(0.002, norm_peg / 100.0)
    grafting_dist_d = math.sqrt(0.65 / peg_mol_frac)
    rf_over_d = round(3.43 / grafting_dist_d, 2)

    peg_penalty = (
        max(10.0, 100.0 - math.pow(norm_peg - 2.0, 1.8) * 18.0)
        if norm_peg > 2.2
        else 95.0
    )
    cellular_uptake = round(min(98.0, max(8.0, peg_penalty)))

    # 6. Israelachvili Critical Packing Parameter: CPP = v / (a_0(pH) * l_c)
    # Branched ionizable tail volume v ~ 1.18 nm^3, l_c ~ 1.65 nm; ion-pairing shrinks a_0 at pH 5.5
    cpp_ph55 = round(
        1.08 + (endosomal_prot / 100.0) * 0.58 + (norm_ion - 50.0) * 0.002,
        2,
    )

    # 7. Endosomal Escape Efficiency
    pka_sweet_spot = max(0.0, 100.0 - abs(form.lipidPka - 6.35) * 55.0)
    escape_eff = round(
        min(
            99.0,
            max(
                5.0,
                endosomal_prot * 0.4 + pka_sweet_spot * 0.35 + cellular_uptake * 0.25,
            ),
        )
    )

    # 8. Bounded SORT Organ Tropism (Liver + Spleen + Lungs == 100%)
    liver, spleen, lungs = 78, 15, 7
    if form.lipidPka > 6.7 or zeta_mv > 8.0:
        pka_shift = max(0.0, (form.lipidPka - 6.5) * 45.0)
        zeta_shift = max(0.0, (zeta_mv - 5.0) * 2.2)
        lungs = min(68, max(12, round(15.0 + pka_shift + zeta_shift)))
        liver = max(20, 78 - lungs)
        spleen = max(4, 100 - liver - lungs)
        liver = 100 - lungs - spleen
    elif form.lipidPka < 6.0 or zeta_mv < -5.0:
        pka_shift = max(0.0, (6.2 - form.lipidPka) * 50.0)
        anionic_shift = max(0.0, (-4.0 - zeta_mv) * 3.5)
        spleen = min(62, max(18, round(20.0 + pka_shift + anionic_shift)))
        liver = max(25, 82 - spleen)
        lungs = max(4, 100 - liver - spleen)
        liver = 100 - spleen - lungs

    stability: LnpBiophysicsResult.__annotations__["stabilityStatus"] = (
        "Optimal Clinical LNP"
    )
    if norm_peg > 3.2:
        stability = "PEG Stealth Dilemma (Low Uptake)"
    elif diameter_nm > 140 or norm_peg < 0.8:
        stability = "Aggregation Risk (Too Large)"
    elif escape_eff < 58:
        stability = "Poor Endosomal Escape"

    saxs_spacing = round(6.45 - (form.npRatio - 3.0) * 0.08, 2)

    return LnpBiophysicsResult(
        diameterNm=diameter_nm,
        pdi=pdi,
        zetaPotentialMv=zeta_mv,
        endosomalProtonationPct=endosomal_prot,
        bloodProtonationPct=blood_prot,
        endosomalEscapeEfficiency=escape_eff,
        cellularUptakeScore=cellular_uptake,
        deGennesRfOverD=rf_over_d,
        criticalPackingParam=cpp_ph55,
        saxsBraggSpacingNm=saxs_spacing,
        organTropism=OrganTropism(liver=liver, spleen=spleen, lungs=lungs),
        stabilityStatus=stability,
    )


@app.post("/api/v1/nanotech/batch", response_model=BatchMassCalculation)
def calculate_batch_masses_endpoint(req: BatchMassRequest) -> BatchMassCalculation:
    safe_vol = max(0.1, req.targetVolumeMl)
    safe_mrna_conc = max(0.01, req.mrnaConcMgMl)
    safe_ionizable = max(1.0, req.form.ionizableLipid)

    total_mrna_mass_mg = round(safe_vol * safe_mrna_conc, 2)
    mmoles_phosphate = total_mrna_mass_mg / 330.0
    mmoles_ionizable = mmoles_phosphate * req.form.npRatio
    total_lipid_mmoles = mmoles_ionizable / (safe_ionizable / 100.0)

    mw_ionizable = 710.2
    mw_dspc = 790.15
    mw_chol = 386.65
    mw_peg = 2509.2

    mmoles_dspc = total_lipid_mmoles * (req.form.dspcHelper / 100.0)
    mmoles_chol = total_lipid_mmoles * (req.form.cholesterol / 100.0)
    mmoles_peg = total_lipid_mmoles * (req.form.pegLipid / 100.0)

    mass_ionizable = round(mmoles_ionizable * mw_ionizable, 2)
    mass_dspc = round(mmoles_dspc * mw_dspc, 2)
    mass_chol = round(mmoles_chol * mw_chol, 2)
    mass_peg = round(mmoles_peg * mw_peg, 2)
    total_lipid_mass_mg = round(mass_ionizable + mass_dspc + mass_chol + mass_peg, 2)

    vol_liters = safe_vol / 1000.0

    return BatchMassCalculation(
        targetVolumeMl=safe_vol,
        mrnaConcMgMl=safe_mrna_conc,
        totalMrnaMassMg=total_mrna_mass_mg,
        totalLipidMassMg=total_lipid_mass_mg,
        components=[
            ComponentMass(
                name="Ionizable Lipid (SM-102 proxy)",
                role="mRNA complexation & endosomal escape",
                molarPct=req.form.ionizableLipid,
                mw=mw_ionizable,
                massMg=mass_ionizable,
                molarConcMm=round(mmoles_ionizable / vol_liters, 2),
            ),
            ComponentMass(
                name="DSPC (Helper Lipid)",
                role="Bilayer structural support",
                molarPct=req.form.dspcHelper,
                mw=mw_dspc,
                massMg=mass_dspc,
                molarConcMm=round(mmoles_dspc / vol_liters, 2),
            ),
            ComponentMass(
                name="Cholesterol",
                role="Membrane fluidity & particle rigidity",
                molarPct=req.form.cholesterol,
                mw=mw_chol,
                massMg=mass_chol,
                molarConcMm=round(mmoles_chol / vol_liters, 2),
            ),
            ComponentMass(
                name="DMG-PEG2000 (Stealth Lipid)",
                role="Colloidal stability & steric hindrance",
                molarPct=req.form.pegLipid,
                mw=mw_peg,
                massMg=mass_peg,
                molarConcMm=round(mmoles_peg / vol_liters, 2),
            ),
        ],
    )


@app.get("/api/v1/immunology/epitopes", response_model=list[EpitopeHotspot])
def get_epitopes() -> list[EpitopeHotspot]:
    return CAS9_EPITOPE_HOTSPOTS


SOUTH_ASIAN_HLA_ALLELES: list[str] = sorted(
    list({allele for ep in CAS9_EPITOPE_HOTSPOTS for allele in ep.hlaAlleles})
)


def filter_epitopes_by_hla_alleles(
    selected_alleles: list[str],
    epitopes: list[EpitopeHotspot] = CAS9_EPITOPE_HOTSPOTS,
) -> list[EpitopeHotspot]:
    selected = {allele.upper() for allele in selected_alleles}
    if not selected:
        return []
    return [
        ep for ep in epitopes
        if any(allele.upper() in selected for allele in ep.hlaAlleles)
    ]


def calculate_hla_risk_score(
    active_epitopes: list[EpitopeHotspot] = CAS9_EPITOPE_HOTSPOTS,
    active_stealth_mutations: dict[str, bool] | None = None,
) -> int:
    if not active_epitopes:
        return 0
    if active_stealth_mutations is None:
        active_stealth_mutations = {}
    total = sum(
        min(8, ep.bindingScore) if active_stealth_mutations.get(ep.peptide, False) else ep.bindingScore
        for ep in active_epitopes
    )
    return round(total / len(active_epitopes))


@app.get("/api/v1/immunology/alleles", response_model=list[str])
def get_hla_alleles() -> list[str]:
    return SOUTH_ASIAN_HLA_ALLELES


@app.post("/api/v1/immunology/assess", response_model=HlaAssessmentResult)
def assess_hla(req: HlaAssessmentRequest) -> HlaAssessmentResult:
    relevant = filter_epitopes_by_hla_alleles(req.selectedAlleles, CAS9_EPITOPE_HOTSPOTS)
    risk = calculate_hla_risk_score(relevant, req.activeStealthMutations)
    return HlaAssessmentResult(patientRelevantEpitopes=relevant, residualRiskScore=risk)


@app.get("/api/v1/dossier/pdf")
def get_preind_dossier_pdf():
    """Generates and streams the publication-grade Pre-IND Regulatory Dossier PDF."""
    try:
        from scripts.generate_dossier_pdf import generate_pdf, DEFAULT_PDF_PATH
        pdf_path = generate_pdf()
    except Exception:
        from pathlib import Path
        pdf_path = Path(__file__).resolve().parent.parent / "exports" / "Pre_IND_Regulatory_Technical_Dossier_HBB_MAKAUT.pdf"
        if not pdf_path.exists():
            raise
    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename="Pre_IND_Regulatory_Technical_Dossier_HBB_MAKAUT.pdf",
    )


# ============================================================================
# 8. EXTERNAL BIOINFORMATICS & CLINICAL ENRICHMENT APIS (TIER 2)
# ============================================================================


@app.get("/api/v1/external/gene/{symbol}")
async def get_external_gene(symbol: str):
    """
    Dynamically fetches human gene metadata, canonical transcript ID,
    and coding sequence (CDS) from Ensembl REST API (GRCh38) with SQLite caching.
    """
    return await lookup_ensembl_gene(symbol)


@app.get("/api/v1/external/variant/{rsid}")
async def get_external_variant(rsid: str):
    """
    Fetches variant clinical significance, consequence, and 1000 Genomes
    South Asian (SAS) population allele frequencies from Ensembl / dbSNP.
    """
    return await lookup_variant_details(rsid)


@app.post("/api/v1/external/clinvar/annotate")
def annotate_bystanders(req: BystanderAnnotationRequest):
    """
    Annotates bystander missense mutations with clinical pathogenicity,
    ClinVar risk classifications, and Grantham amino acid distance scores.
    """
    annotated = []
    for b in req.bystanders:
        clin = annotate_bystander_pathogenicity(
            gene_symbol=req.geneSymbol,
            original_aa=b.originalAA,
            edited_aa=b.editedAA,
            classification=b.classification,
        )
        item = b.model_dump()
        item.update(clin)
        annotated.append(item)
    return annotated


@app.post("/api/v1/external/immunology/predict")
def predict_protein_epitopes(req: EpitopeScanRequest):
    """
    Scans a Cas protein or base editor sequence for South Asian HLA Class I
    immunogenic epitope hotspots using canonical anchor pocket matrices.
    """
    return scan_protein_for_epitopes(
        sequence=req.sequence,
        allele=req.allele,
        min_score=req.minScore,
    )


@app.post("/api/v1/external/immunology/score-peptide")
def score_peptide_epitope(req: EpitopeScoreRequest):
    """
    Computes MHC-I binding affinity and IC50 for an individual 9-mer peptide.
    """
    return score_peptide_hla_binding(
        peptide=req.peptide,
        allele=req.allele,
    )


