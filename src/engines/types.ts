// src/engines/types.ts
// Domain Types and Contracts for NanoCRISPR-3D

export interface GenePreset {
  id: string;
  symbol: string;
  name: string;
  disease: string;
  targetOrgan: 'Liver' | 'Bone Marrow (HSPC)' | 'Lung';
  editorType: 'ABE8e (A→G)' | 'BE4max (C→T)';
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
