// src/engines/types.ts
// Domain Types and Contracts for NanoCRISPER-3D

/**
 * Base-editor options modeled by the local guide scanner. These labels are
 * intentionally human-readable because they are also shown in the workbench
 * UI and exported reports.
 */
export type BaseEditorType =
  | 'ABE8e (A→G)'
  | 'ABE9 (A→G; window 5–6)'
  | 'BE4max (C→T)';

export interface BaseEditorDefinition {
  targetBase: 'A' | 'C';
  replacementBase: 'G' | 'T';
  editingWindow: readonly [start: number, end: number];
  peakPositions: readonly number[];
}

/**
 * PAM-recognition variants represented by the guide scanner. SpRY is modeled
 * as near-PAMless (NNN), ranked by its NRN/NYN preference.
 */
export type PamVariant = 'SpCas9' | 'SpCas9-NG' | 'SpRY';

export interface PamVariantDefinition {
  label: string;
  recognition: string;
  preferredPamLabel: string;
}

export const BASE_EDITOR_DEFINITIONS: Record<BaseEditorType, BaseEditorDefinition> = {
  'ABE8e (A→G)': {
    targetBase: 'A',
    replacementBase: 'G',
    editingWindow: [4, 8],
    peakPositions: [5, 6, 7],
  },
  'ABE9 (A→G; window 5–6)': {
    targetBase: 'A',
    replacementBase: 'G',
    editingWindow: [5, 6],
    peakPositions: [5, 6],
  },
  'BE4max (C→T)': {
    targetBase: 'C',
    replacementBase: 'T',
    editingWindow: [4, 8],
    peakPositions: [5, 6, 7],
  },
};

export const PAM_VARIANT_DEFINITIONS: Record<PamVariant, PamVariantDefinition> = {
  SpCas9: {
    label: 'SpCas9',
    recognition: 'NGG (preferred), NAG (relaxed)',
    preferredPamLabel: 'NGG only',
  },
  'SpCas9-NG': {
    label: 'SpCas9-NG',
    recognition: 'NGN',
    preferredPamLabel: 'NGG only (preferred)',
  },
  SpRY: {
    label: 'SpRY',
    recognition: 'NNN (NRN preferred; NYN relaxed)',
    preferredPamLabel: 'NRN only (preferred)',
  },
};

export interface GenePreset {
  id: string;
  symbol: string;
  name: string;
  disease: string;
  targetOrgan: 'Liver' | 'Bone Marrow (HSPC)' | 'Lung';
  editorType: BaseEditorType;
  /** Defaults to wild-type SpCas9 when omitted, preserving existing presets. */
  pamVariant?: PamVariant;
  sequence: string; // Coding sequence (CDS) snippet aligned to reading frame (0-indexed)
  mutationIndex: number; // 0-based nucleotide index of pathogenic mutation
  sasSnpIndex: number; // Common South Asian (IndiGen/1000G SAS) polymorphism index
  sasSnpId: string;
  sasAlleleFreq: number;
  clinicalNote: string;
}

export interface BystanderEdit {
  guidePos: number; // 1-20
  genomicIndex: number;
  originalCodon: string;
  editedCodon: string;
  originalAA: string;
  editedAA: string;
  classification: 'Target Edit' | 'Silent (Synonymous)' | 'Missense (Pathogenic Risk)' | 'Nonsense (Premature Stop)';
}

export interface GuideCandidate {
  id: string;
  spacer: string;
  pam: string;
  strand: '+' | '-';
  startIndex: number;
  gcContent: number;
  targetInWindow: boolean;
  bystanders: BystanderEdit[];
  hasSasSnpCollision: boolean;
  CompositeScore: number;
  verdict: 'Optimal Clinical Guide' | 'Safe (Silent Bystander)' | 'High Risk (Bystander/SNP)' | 'Low Efficiency';
}

export interface CloningOligos {
  forwardOligo: string; // 5'-CACC-[G?]-spacer-3'
  reverseOligo: string; // 5'-AAAC-[spacerRC]-[C?]-3'
  overhangSystem: string;
}

export interface LnpFormulation {
  ionizableLipid: number; // e.g., 50.0 mol%
  dspcHelper: number;     // e.g., 10.0 mol%
  cholesterol: number;    // e.g., 38.5 mol%
  pegLipid: number;       // e.g., 1.5 mol%
  lipidPka: number;       // Optimal: 6.2 - 6.5
  npRatio: number;        // Amine-to-Phosphate ratio (Optimal: 6)
}

export interface LnpBiophysicsResult {
  diameterNm: number;
  pdi: number;
  zetaPotentialMv: number;
  endosomalProtonationPct: number; // at pH 5.5
  bloodProtonationPct: number;     // at pH 7.4
  endosomalEscapeEfficiency: number;
  cellularUptakeScore: number;     // Models the "PEG Dilemma"
  deGennesRfOverD?: number;        // Flory radius / grafting distance (>1.0 = Dense Brush)
  criticalPackingParam?: number;   // Israelachvili CPP at pH 5.5 (>1.45 = H_II hexagonal phase)
  saxsBraggSpacingNm?: number;     // Core RNA-lipid lamellar/H_II repeat distance (~5.8-6.4 nm)
  organTropism: {
    liver: number;
    spleen: number;
    lungs: number;
  };
  stabilityStatus: 'Optimal Clinical LNP' | 'PEG Stealth Dilemma (Low Uptake)' | 'Aggregation Risk (Too Large)' | 'Poor Endosomal Escape';
}

export interface BatchMassCalculation {
  targetVolumeMl: number;
  mrnaConcMgMl: number;
  totalMrnaMassMg: number;
  totalLipidMassMg: number;
  components: {
    name: string;
    role: string;
    molarPct: number;
    mw: number;
    massMg: number;
    molarConcMm: number;
  }[];
}

export interface EpitopeHotspot {
  peptide: string;
  residueRange: string;
  domain: string;
  hlaAllele: string;
  /** Machine-readable HLA alleles used for patient-specific filtering. */
  hlaAlleles: string[];
  bindingScore: number; // IC50 proxy (0-100 risk)
  stealthMutation: string;
  catalyticSafe: boolean;
}

/**
 * Universal Bio-Engine Service Contract (Port in Hexagonal Architecture).
 * Enables drop-in replacement with a Python/FastAPI or WebAssembly service in Year 2.
 */
export interface IBioEngineService {
  scanGuides(preset: GenePreset): GuideCandidate[];
  generateCloningOligos(spacer: string): CloningOligos;
  simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult;
  calculateBatchMasses(form: LnpFormulation, targetVolumeMl?: number, mrnaConcMgMl?: number): BatchMassCalculation;
  translateSequence(seq: string): string;
  reverseComplement(seq: string): string;
  getEpitopeHotspots(): EpitopeHotspot[];
}
