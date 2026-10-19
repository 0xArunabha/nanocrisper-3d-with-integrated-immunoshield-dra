// src/engines/bioEngines.ts

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

export const GENE_PRESETS: GenePreset[] = [
  {
    id: 'HBB',
    symbol: 'HBB (Exon 1)',
    name: 'Hemoglobin Subunit Beta',
    disease: 'Beta-Thalassemia / Sickle Cell Disease (HbS E6V)',
    targetOrgan: 'Bone Marrow (HSPC)',
    editorType: 'ABE8e (A→G)',
    // Codon-aligned sequence around HBB Glu6Val (GTG -> GAG via antisense or Makassar GCG)
    sequence: 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAG',
    mutationIndex: 19,
    sasSnpIndex: 32,
    sasSnpId: 'rs10768683 (SAS Variant)',
    sasAlleleFreq: 0.142,
    clinicalNote: 'High prevalence in West Bengal & Eastern India. Converts pathogenic HbS (GTG) to benign HbG-Makassar (GCG) via Adenine Base Editing.'
  },
  {
    id: 'PCSK9',
    symbol: 'PCSK9 (Exon 1 Splice Donor)',
    name: 'Proprotein Convertase Subtilisin/Kexin Type 9',
    disease: 'Familial Hypercholesterolemia (VERVE-101 Benchmark)',
    targetOrgan: 'Liver',
    editorType: 'ABE8e (A→G)',
    sequence: 'ATGGGCACCGTCAGCTCCAGGCAGTCCTGGTGGCCGGGGCCACTGCTGCTGCTGCTGCTGCTGCTCCTGGGTCCCGCGGGCGCCCGTGCGC',
    mutationIndex: 22,
    sasSnpIndex: 45,
    sasSnpId: 'rs505151 (SAS G670E proxy)',
    sasAlleleFreq: 0.089,
    clinicalNote: 'Disrupts PCSK9 hepatic expression via LNP-delivered mRNA base editor to permanently lower LDL cholesterol.'
  },
  {
    id: 'TTR',
    symbol: 'TTR (Exon 2)',
    name: 'Transthyretin (V30M)',
    disease: 'Hereditary ATTR Amyloidosis (NTLA-2001 Benchmark)',
    targetOrgan: 'Liver',
    editorType: 'BE4max (C→T)',
    sequence: 'ATGGCTTCTCATCGTCTGCTCCTCCTCTGCCTTGCTGGACTGGTATTTGTGTCTGAGGCTGGCCCTACGGGCACCGGTGAATCCAAGTGTCCT',
    mutationIndex: 43,
    sasSnpIndex: 52,
    sasSnpId: 'rs76992529 (SAS TTR Variant)',
    sasAlleleFreq: 0.054,
    clinicalNote: 'Hepatic LNP delivery silences misfolded transthyretin protein production in serum.'
  }
];

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W', CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

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

export function translateSequence(seq: string): string {
  let protein = '';
  for (let i = 0; i <= seq.length - 3; i += 3) {
    const codon = seq.slice(i, i + 3);
    protein += CODON_TABLE[codon] || '?';
  }
  return protein;
}

export function reverseComplement(seq: string): string {
  const map: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C', N: 'N' };
  return seq
    .toUpperCase()
    .split('')
    .reverse()
    .map((c) => map[c] || c)
    .join('');
}

// 1. DUAL-STRAND CODON-AWARE CRISPR & BASE EDITOR ENGINE
export function scanForGuides(preset: GenePreset): GuideCandidate[] {
  const seq = preset.sequence.toUpperCase();
  const candidates: GuideCandidate[] = [];
  const targetBase = preset.editorType.startsWith('ABE') ? 'A' : 'C';
  const replacementBase = preset.editorType.startsWith('ABE') ? 'G' : 'T';

  // 1. Scan Sense (+) Strand
  for (let i = 0; i <= seq.length - 23; i++) {
    const spacer = seq.slice(i, i + 20);
    const pam = seq.slice(i + 20, i + 23);

    const isCanonicalPam = pam[1] === 'G' && pam[2] === 'G';
    const isRelaxedPam = pam[1] === 'G';
    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;

    // Base editor deaminase window is positions 4 to 8 (1-indexed from 5' end of spacer)
    for (let pos = 4; pos <= 8; pos++) {
      const genomicIdx = i + (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const currentBaseOnStrand = seq[genomicIdx];
      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const offsetInCodon = genomicIdx - codonStart;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon =
          originalCodon.slice(0, offsetInCodon) +
          replacementBase +
          originalCodon.slice(offsetInCodon + 1);

        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) targetInWindow = true;

        let classification: BystanderEdit['classification'] = 'Missense (Pathogenic Risk)';
        if (isTarget) {
          classification = 'Target Edit';
        } else if (editAA === '*') {
          classification = 'Nonsense (Premature Stop)';
        } else if (origAA === editAA) {
          classification = 'Silent (Synonymous)';
        }

        edits.push({
          guidePos: pos,
          genomicIndex: genomicIdx,
          originalCodon,
          editedCodon,
          originalAA: origAA,
          editedAA: editAA,
          classification,
        });
      }
    }

    const hasSasSnpCollision = preset.sasSnpIndex >= i && preset.sasSnpIndex <= i + 22;

    let score = isCanonicalPam ? 65 : 48;
    if (gcContent >= 40 && gcContent <= 60) score += 15;

    // Prioritize guides that actually cover the pathogenic target (+35 boost / -25 miss penalty)
    if (targetInWindow) {
      score += 35;
    } else {
      score -= 25;
    }

    let hasHarmfulBystander = false;
    let hasSilentBystander = false;

    for (const e of edits) {
      if (e.classification === 'Nonsense (Premature Stop)') {
        score -= 45;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Missense (Pathogenic Risk)') {
        score -= 25;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Silent (Synonymous)') {
        score += 4;
        hasSilentBystander = true;
      }
    }

    if (hasSasSnpCollision) score -= 20;
    score = Math.max(5, Math.min(99, score));

    let verdict: GuideCandidate['verdict'] = 'Low Efficiency';
    if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision) {
      verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
    } else if (hasHarmfulBystander || hasSasSnpCollision) {
      verdict = 'High Risk (Bystander/SNP)';
    }

    candidates.push({
      id: `sgRNA-f${i + 1}`,
      spacer,
      pam,
      strand: '+',
      startIndex: i,
      gcContent,
      targetInWindow,
      bystanders: edits,
      hasSasSnpCollision,
      CompositeScore: score,
      verdict,
    });
  }

  // 2. Scan Antisense (-) Strand (Spanning sense indices i to i + 19, 5' at i + 19 counting backwards toward i)
  for (let i = 0; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));

    // Determine PAM: check 3' on antisense (sense i-3..i) or downstream sense (i+20..i+23)
    let pam = '';
    let isCanonicalPam = false;
    let isRelaxedPam = false;

    if (i >= 3) {
      const p1 = reverseComplement(seq.slice(i - 3, i));
      if (p1[1] === 'G') {
        pam = p1;
        isCanonicalPam = p1[1] === 'G' && p1[2] === 'G';
        isRelaxedPam = true;
      }
    }

    if (!pam && i <= seq.length - 23) {
      const p2 = reverseComplement(seq.slice(i + 20, i + 23));
      if (p2[1] === 'G') {
        pam = p2;
        isCanonicalPam = p2[1] === 'G' && p2[2] === 'G';
        isRelaxedPam = true;
      }
    }

    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;

    // Antisense deaminase window positions 4 to 8:
    // Positions 4..8 from 5' end correspond to sense indices (i + 19) - 3 down to (i + 19) - 7
    for (let pos = 4; pos <= 8; pos++) {
      const genomicIdx = (i + 19) - (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const senseBase = seq[genomicIdx];
      const currentBaseOnStrand = reverseComplement(senseBase);

      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const offsetInCodon = genomicIdx - codonStart;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        // Antisense A->G produces sense T->C; Antisense C->T produces sense G->A
        const senseReplacement = targetBase === 'A' ? 'C' : 'A';
        const editedCodon =
          originalCodon.slice(0, offsetInCodon) +
          senseReplacement +
          originalCodon.slice(offsetInCodon + 1);

        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) targetInWindow = true;

        let classification: BystanderEdit['classification'] = 'Missense (Pathogenic Risk)';
        if (isTarget) {
          classification = 'Target Edit';
        } else if (editAA === '*') {
          classification = 'Nonsense (Premature Stop)';
        } else if (origAA === editAA) {
          classification = 'Silent (Synonymous)';
        }

        edits.push({
          guidePos: pos,
          genomicIndex: genomicIdx,
          originalCodon,
          editedCodon,
          originalAA: origAA,
          editedAA: editAA,
          classification,
        });
      }
    }

    const hasSasSnpCollision = preset.sasSnpIndex >= i && preset.sasSnpIndex < i + 19;

    let score = isCanonicalPam ? 65 : 48;
    if (gcContent >= 40 && gcContent <= 60) score += 15;

    // Prioritize guides that actually cover the pathogenic target (+35 boost / -25 miss penalty)
    if (targetInWindow) {
      score += 35;
    } else {
      score -= 25;
    }

    let hasHarmfulBystander = false;
    let hasSilentBystander = false;

    for (const e of edits) {
      if (e.classification === 'Nonsense (Premature Stop)') {
        score -= 45;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Missense (Pathogenic Risk)') {
        score -= 25;
        hasHarmfulBystander = true;
      } else if (e.classification === 'Silent (Synonymous)') {
        score += 4;
        hasSilentBystander = true;
      }
    }

    if (hasSasSnpCollision) score -= 20;
    score = Math.max(5, Math.min(99, score));

    let verdict: GuideCandidate['verdict'] = 'Low Efficiency';
    if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision) {
      verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
    } else if (hasHarmfulBystander || hasSasSnpCollision) {
      verdict = 'High Risk (Bystander/SNP)';
    }

    candidates.push({
      id: `sgRNA-r${i + 1}`,
      spacer,
      pam,
      strand: '-',
      startIndex: i,
      gcContent,
      targetInWindow,
      bystanders: edits,
      hasSasSnpCollision,
      CompositeScore: score,
      verdict,
    });
  }

  return candidates.sort((a, b) => b.CompositeScore - a.CompositeScore).slice(0, 10);
}

// Oligo synthesis order generator for BsmBI / BpiI Golden Gate cloning
export interface CloningOligos {
  forwardOligo: string; // 5'-CACC-[G?]-spacer-3'
  reverseOligo: string; // 5'-AAAC-[spacerRC]-[C?]-3'
  overhangSystem: string;
}

export function generateCloningOligos(spacer: string): CloningOligos {
  // If spacer doesn't start with G, add G for U6 transcription initiation
  const needsG = spacer[0] !== 'G';
  const fwdCore = (needsG ? 'G' : '') + spacer;
  const forwardOligo = `CACC${fwdCore}`;
  const reverseOligo = `AAAC${reverseComplement(fwdCore)}`;

  return {
    forwardOligo: `5'-${forwardOligo}-3'`,
    reverseOligo: `5'-${reverseOligo}-3'`,
    overhangSystem: 'BsmBI / BpiI (Esp3I)'
  };
}

// 2. NANOTECH LNP BIOPHYSICAL & CMC ENGINE
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

export function simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
  const total = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid;
  const normPeg = (form.pegLipid / total) * 100;
  const normChol = (form.cholesterol / total) * 100;

  // 1. Hydrodynamic diameter (Dh in nm): Higher PEG-lipid increases surface curvature -> smaller particle
  const rawDiameter = 135 - 24 * Math.log(Math.max(0.3, normPeg * 2.2)) + (6 - form.npRatio) * 3.5;
  const diameterNm = Math.round(Math.max(42, Math.min(210, rawDiameter)));

  // 2. Polydispersity Index (PDI)
  const pdi = Number((0.06 + Math.abs(normChol - 38.5) * 0.004 + (normPeg < 1.0 ? 0.12 : 0)).toFixed(2));

  // 3. Henderson-Hasselbalch Ionization: % = 100 / (1 + 10^(pH - pKa))
  const endosomalProtonationPct = Math.round(100 / (1 + Math.pow(10, 5.5 - form.lipidPka)));
  const bloodProtonationPct = Math.round(100 / (1 + Math.pow(10, 7.4 - form.lipidPka)));

  // 4. Zeta Potential at physiological pH 7.4 (mV)
  const zetaPotentialMv = Number(((bloodProtonationPct * 0.35) - (normPeg * 2.1)).toFixed(1));

  // 5. The "PEG Dilemma" & Cellular Uptake
  const pegPenalty = normPeg > 2.2 ? Math.max(10, 100 - Math.pow(normPeg - 2.0, 1.8) * 18) : 95;
  const cellularUptakeScore = Math.round(Math.min(98, Math.max(8, pegPenalty)));

  // 6. Endosomal Escape combines protonation at pH 5.5 + neutral charge at pH 7.4 + low PEG barrier
  const pkaSweetSpotBonus = Math.max(0, 100 - Math.abs(form.lipidPka - 6.35) * 55);
  const endosomalEscapeEfficiency = Math.round(
    (endosomalProtonationPct * 0.4 + pkaSweetSpotBonus * 0.35 + cellularUptakeScore * 0.25)
  );

  // 7. Organ Tropism (SORT - Selective Organ Targeting model)
  let liver = 78;
  let spleen = 15;
  let lungs = 7;

  if (form.lipidPka > 6.7 || zetaPotentialMv > 8) {
    lungs = Math.min(68, Math.round(15 + (form.lipidPka - 6.5) * 45));
    liver = Math.max(20, 90 - lungs - 12);
    spleen = 100 - liver - lungs;
  } else if (form.lipidPka < 6.0 || zetaPotentialMv < -5) {
    spleen = Math.min(62, Math.round(20 + (6.2 - form.lipidPka) * 50));
    liver = Math.max(25, 90 - spleen - 8);
    lungs = 100 - liver - spleen;
  }

  let stabilityStatus: LnpBiophysicsResult['stabilityStatus'] = 'Optimal Clinical LNP';
  if (normPeg > 3.2) {
    stabilityStatus = 'PEG Stealth Dilemma (Low Uptake)';
  } else if (diameterNm > 140 || normPeg < 0.8) {
    stabilityStatus = 'Aggregation Risk (Too Large)';
  } else if (endosomalEscapeEfficiency < 58) {
    stabilityStatus = 'Poor Endosomal Escape';
  }

  // De Gennes PEG2000 Brush Ratio: R_F (3.43 nm) / D (sqrt(0.65 / X_peg))
  const pegMolFraction = Math.max(0.002, normPeg / 100);
  const graftingDist = Math.sqrt(0.65 / pegMolFraction);
  const deGennesRfOverD = Number((3.43 / graftingDist).toFixed(2));

  // Israelachvili Critical Packing Parameter (CPP) in late endosome (pH 5.5)
  const criticalPackingParam = Number((1.08 + (endosomalProtonationPct / 100) * 0.58).toFixed(2));

  // SAXS q_1 Bragg Peak Repeat Spacing (nm)
  const saxsBraggSpacingNm = Number((6.45 - (form.npRatio - 3) * 0.08).toFixed(2));

  return {
    diameterNm,
    pdi,
    zetaPotentialMv,
    endosomalProtonationPct,
    bloodProtonationPct,
    endosomalEscapeEfficiency,
    cellularUptakeScore,
    deGennesRfOverD,
    criticalPackingParam,
    saxsBraggSpacingNm,
    organTropism: { liver, spleen, lungs },
    stabilityStatus
  };
}

// Wet-lab mass & batch preparation calculator
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

export function calculateBatchMasses(
  form: LnpFormulation,
  targetVolumeMl: number = 10,
  mrnaConcMgMl: number = 1.0
): BatchMassCalculation {
  const totalMrnaMassMg = Number((targetVolumeMl * mrnaConcMgMl).toFixed(2));
  // Moles of phosphate (avg nucleotide MW in mRNA is ~330 g/mol)
  const mmolesPhosphate = totalMrnaMassMg / 330;
  // Required moles of ionizable nitrogen based on N/P ratio
  const mmolesIonizable = mmolesPhosphate * form.npRatio;
  const totalLipidMmoles = mmolesIonizable / (form.ionizableLipid / 100);

  const MW_IONIZABLE = 710.2;
  const MW_DSPC = 790.15;
  const MW_CHOL = 386.65;
  const MW_PEG = 2509.2; // DMG-PEG2000

  const mmolesDspc = totalLipidMmoles * (form.dspcHelper / 100);
  const mmolesChol = totalLipidMmoles * (form.cholesterol / 100);
  const mmolesPeg = totalLipidMmoles * (form.pegLipid / 100);

  const massIonizable = Number((mmolesIonizable * MW_IONIZABLE).toFixed(2));
  const massDspc = Number((mmolesDspc * MW_DSPC).toFixed(2));
  const massChol = Number((mmolesChol * MW_CHOL).toFixed(2));
  const massPeg = Number((mmolesPeg * MW_PEG).toFixed(2));
  const totalLipidMassMg = Number((massIonizable + massDspc + massChol + massPeg).toFixed(2));

  const volLiters = targetVolumeMl / 1000;

  return {
    targetVolumeMl,
    mrnaConcMgMl,
    totalMrnaMassMg,
    totalLipidMassMg,
    components: [
      {
        name: 'Ionizable Lipid (SM-102 proxy)',
        role: 'mRNA complexation & endosomal escape',
        molarPct: form.ionizableLipid,
        mw: MW_IONIZABLE,
        massMg: massIonizable,
        molarConcMm: Number((mmolesIonizable / volLiters).toFixed(2))
      },
      {
        name: 'DSPC (Helper Lipid)',
        role: 'Bilayer structural support',
        molarPct: form.dspcHelper,
        mw: MW_DSPC,
        massMg: massDspc,
        molarConcMm: Number((mmolesDspc / volLiters).toFixed(2))
      },
      {
        name: 'Cholesterol',
        role: 'Membrane fluidity & particle rigidity',
        molarPct: form.cholesterol,
        mw: MW_CHOL,
        massMg: massChol,
        molarConcMm: Number((mmolesChol / volLiters).toFixed(2))
      },
      {
        name: 'DMG-PEG2000 (Stealth Lipid)',
        role: 'Colloidal stability & steric hindrance',
        molarPct: form.pegLipid,
        mw: MW_PEG,
        massMg: massPeg,
        molarConcMm: Number((mmolesPeg / volLiters).toFixed(2))
      }
    ]
  };
}

// 3. IMMUNOSHIELD MHC-I (SOUTH ASIAN HLA PANEL)
export interface EpitopeHotspot {
  peptide: string;
  residueRange: string;
  domain: string;
  hlaAllele: string;
  bindingScore: number; // IC50 proxy (0-100 risk)
  stealthMutation: string;
  catalyticSafe: boolean;
}

export const CAS9_EPITOPE_HOTSPOTS: EpitopeHotspot[] = [
  {
    peptide: 'NLIALSLGL',
    residueRange: 'aa 236–244',
    domain: 'REC2 Domain',
    hlaAllele: 'HLA-A*02:01 / HLA-A*24:02 (Common Indian)',
    bindingScore: 92,
    stealthMutation: 'L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'KTYAHLFDD',
    residueRange: 'aa 836–844',
    domain: 'HNH Catalytic Core (Contains H840)',
    hlaAllele: 'HLA-A*11:01 (High South Asian Frequency ~21%)',
    bindingScore: 84,
    stealthMutation: 'K836R (Preserves H840 active-site histidine required for strand nicking)',
    catalyticSafe: true
  },
  {
    peptide: 'IYLAAANRL',
    residueRange: 'aa 1012–1020',
    domain: 'RuvC-III Domain',
    hlaAllele: 'HLA-A*24:02 (South Asian Frequency ~18%)',
    bindingScore: 88,
    stealthMutation: 'L1020G (Eliminates C-terminal anchor binding to HLA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'FEDFLKNRM',
    residueRange: 'aa 418–426',
    domain: 'Bridge Helix (Structural Stability)',
    hlaAllele: 'HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)',
    bindingScore: 81,
    stealthMutation: 'F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)',
    catalyticSafe: true
  },
  {
    peptide: 'TLYETRRDL',
    residueRange: 'aa 674–682',
    domain: 'REC3 Domain (Target RNA Alignment)',
    hlaAllele: 'HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)',
    bindingScore: 78,
    stealthMutation: 'L675S (Ablates C-terminal peptide binding to MHC cleft)',
    catalyticSafe: true
  }
];
