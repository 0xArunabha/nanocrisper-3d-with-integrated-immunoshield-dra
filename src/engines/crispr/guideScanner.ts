// src/engines/crispr/guideScanner.ts
import {
  BASE_EDITOR_DEFINITIONS,
  type BystanderEdit,
  type GenePreset,
  type GuideCandidate,
  type PamVariant,
  type ThermodynamicProfile,
} from '../types';

// Sugimoto et al. (1995) RNA:DNA nearest-neighbor parameters [dH kcal/mol, dS cal/(mol K)]. Key "XY" is
// the RNA 5'-XY-3' step (T stands for U). Same 16 rows as RNA_DNA_NN_PARAMS in backend/thermodynamics.py;
// backend/checks/check_science.py checks them against the published dG37 column, and a parity test
// compares this file's results with the Python ones. An earlier copy of this table had 8 wrong rows.
const RNA_DNA_NN: Record<string, [number, number]> = {
  AA: [-7.8, -21.9], AC: [-5.9, -12.3], AG: [-9.1, -23.5], AT: [-8.3, -23.9],
  CA: [-9.0, -26.1], CC: [-9.3, -23.2], CG: [-16.3, -47.1], CT: [-7.0, -19.7],
  GA: [-5.5, -13.5], GC: [-8.0, -17.1], GG: [-12.8, -31.9], GT: [-7.8, -21.6],
  TA: [-7.8, -23.2], TC: [-8.6, -22.9], TG: [-10.4, -28.4], TT: [-11.5, -36.4],
};

// SantaLucia (1998) unified DNA:DNA parameters [dH kcal/mol, dS cal/(mol K)]
const DNA_DNA_NN: Record<string, [number, number]> = {
  AA: [-7.9, -22.2], TT: [-7.9, -22.2], AT: [-7.2, -20.4], TA: [-7.2, -21.3],
  CA: [-8.5, -22.7], TG: [-8.5, -22.7], GT: [-8.4, -22.4], AC: [-8.4, -22.4],
  CT: [-7.8, -21.0], AG: [-7.8, -21.0], GA: [-8.2, -22.2], TC: [-8.2, -22.2],
  CG: [-10.6, -27.2], GC: [-9.8, -24.4], GG: [-8.0, -19.9], CC: [-8.0, -19.9],
};

const round1 = (x: number): number => Math.round(x * 10) / 10;
const round2 = (x: number): number => Math.round(x * 100) / 100;

/** RNA:DNA hybrid nearest-neighbor sum at 150 mM Na+ and 250 nM strand (same equations as the backend). */
function rnaDnaHybrid(spacer: string): { dh: number; ds: number; dg37: number; tm: number } {
  const clean = spacer.toUpperCase().replace(/U/g, 'T');
  let dh = 1.9;
  let ds = -3.9;
  for (let i = 0; i < clean.length - 1; i++) {
    const [h, s] = RNA_DNA_NN[clean.slice(i, i + 2)] ?? [-7.5, -19.5];
    dh += h;
    ds += s;
  }
  const dsSalt = ds + 0.368 * (clean.length - 1) * Math.log(0.15);
  const dg37 = dh - 310.15 * (dsSalt / 1000);
  const denom = dsSalt + 1.9872 * Math.log(2.5e-7 / 4);
  const tm = denom !== 0 ? (dh * 1000) / denom - 273.15 : 0;
  return { dh: round1(dh), ds: round1(dsSalt), dg37: round2(dg37), tm: round1(tm) };
}

/** DNA:DNA duplex dG at 37 C, 150 mM Na+ (SantaLucia 1998, G:C-terminated initiation). */
function dnaDnaDg37(seq: string): number {
  const clean = seq.toUpperCase().replace(/U/g, 'T');
  let dh = 0.2;
  let ds = -5.7;
  for (let i = 0; i < clean.length - 1; i++) {
    const [h, s] = DNA_DNA_NN[clean.slice(i, i + 2)] ?? [-8.0, -22.0];
    dh += h;
    ds += s;
  }
  const dsSalt = ds + 0.368 * (clean.length - 1) * Math.log(0.15);
  return round2(dh - 310.15 * (dsSalt / 1000));
}

/**
 * In-browser thermodynamic estimate for a spacer (offline path). Computed here, with the same equations
 * as backend/thermodynamics.py: the RNA:DNA hybrid, the DNA:DNA duplex, their difference (net R-loop dG),
 * the seed (11-20) and distal (1-10) hybrid energies, and the GC clamp.
 *
 * NOT computed here: the hairpin fold, the homodimer, the verdict and the efficiency bonus. Those fields
 * hold neutral placeholders and `source` is 'browser'; show them as "needs backend". The backend answer
 * (source 'backend') replaces this one when it is reachable.
 */
export function estimateLocalThermodynamics(spacer: string): ThermodynamicProfile {
  const clean = spacer.toUpperCase().replace(/U/g, 'T');
  const hybrid = rnaDnaHybrid(clean);
  const dnaDg = dnaDnaDg37(clean);
  const rLoopNet = round2(hybrid.dg37 - dnaDg);
  const distalDg = rnaDnaHybrid(clean.slice(0, 10)).dg37;
  const seedDg = rnaDnaHybrid(clean.slice(10)).dg37;

  return {
    source: 'browser',
    spacer: clean,
    rnaDnaDg37: hybrid.dg37,
    rnaDnaDh: hybrid.dh,
    rnaDnaDs: hybrid.ds,
    rnaDnaTm: hybrid.tm,
    dnaDnaDg37: dnaDg,
    rLoopNetDg: rLoopNet,
    isRLoopThermodynamicallyFavored: rLoopNet < 0,
    // placeholders: the browser has no folding code
    hairpinDg: 0.0,
    hairpinStructure: '.'.repeat(clean.length),
    hairpinStemLength: 0,
    hairpinLoopSize: 0,
    hairpinRisk: 'Low / Unstructured',
    seedDg,
    distalDg,
    seedAsymmetryDdg: round2(seedDg - distalDg),
    hasGcClamp: clean.length >= 20 && /[GC]/.test(clean[18]) && /[GC]/.test(clean[19]),
    // placeholders
    selfDimerDg: 0.0,
    selfDimerRisk: 'Negligible',
    thermodynamicVerdict: 'Optimal Thermodynamic Profile',
    thermodynamicEfficiencyBonus: 0.0,
  };
}

export const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W', CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

export function translateSequence(seq: string): string {
  const clean = seq.toUpperCase();
  let protein = '';
  for (let i = 0; i <= clean.length - 3; i += 3) {
    const codon = clean.slice(i, i + 3);
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

export type PamClassification = 'preferred' | 'relaxed';

/**
 * Classifies a concrete three-base PAM for the selected Cas9 variant.
 * Standard SpCas9 accepts NGG preferentially and NAG as a relaxed motif;
 * SpCas9-NG expands recognition to NGN; SpRY is modeled as NNN with an
 * NRN-over-NYN preference for ranking.
 */
export function classifyPam(
  pam: string,
  pamVariant: PamVariant = 'SpCas9'
): PamClassification | null {
  const normalizedPam = pam.toUpperCase();
  if (!/^[ACGT]{3}$/.test(normalizedPam)) return null;

  const [, secondBase, thirdBase] = normalizedPam;

  switch (pamVariant) {
    case 'SpCas9':
      if (secondBase === 'G' && thirdBase === 'G') return 'preferred';
      // NAG is 5'-N-A-G-3', not NGA.
      if (secondBase === 'A' && thirdBase === 'G') return 'relaxed';
      return null;
    case 'SpCas9-NG':
      if (secondBase !== 'G') return null;
      return thirdBase === 'G' ? 'preferred' : 'relaxed';
    case 'SpRY':
      return secondBase === 'A' || secondBase === 'G' ? 'preferred' : 'relaxed';
  }
}

export function isPreferredPam(pam: string, pamVariant: PamVariant = 'SpCas9'): boolean {
  return classifyPam(pam, pamVariant) === 'preferred';
}

function scoreGuideCandidate(
  hasPreferredPam: boolean,
  gcContent: number,
  targetInWindow: boolean,
  targetAtPeakCenter: boolean,
  hasPolIIITerminator: boolean,
  edits: BystanderEdit[],
  hasSasSnpCollision: boolean
): { score: number; verdict: GuideCandidate['verdict'] } {
  let score = hasPreferredPam ? 65 : 48;

  if (gcContent >= 40 && gcContent <= 60) {
    score += 15;
  } else if (gcContent < 30 || gcContent > 75) {
    score -= 10;
  }

  if (targetInWindow) {
    score += 35;
    if (targetAtPeakCenter) score += 4;
  } else {
    score -= 25;
  }

  if (hasPolIIITerminator) {
    score -= 30;
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
  if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision && !hasPolIIITerminator) {
    verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
  } else if (hasHarmfulBystander || hasSasSnpCollision) {
    verdict = 'High Risk (Bystander/SNP)';
  }

  return { score, verdict };
}

/**
 * Dual-Strand Codon-Aware CRISPR & Base Editor Discovery Engine.
 * Scans both sense (+) and antisense (-) strands for 20nt protospacers with a
 * selected nuclease's valid 3' PAM, simulates co-editing across the selected
 * deaminase window, audits codon consequences,
 * and flags South Asian (SAS) polymorphism collisions across the full 23-nt target + PAM span.
 */
export function scanForGuides(preset: GenePreset): GuideCandidate[] {
  const seq = preset.sequence.toUpperCase();
  const candidates: GuideCandidate[] = [];
  const editor = BASE_EDITOR_DEFINITIONS[preset.editorType];
  const pamVariant = preset.pamVariant ?? 'SpCas9';
  const { targetBase, replacementBase } = editor;
  const [windowStart, windowEnd] = editor.editingWindow;

  // 1. Scan Sense (+) Strand (5'-[20nt spacer]-[3nt PAM]-3' covering sense indices i .. i+22)
  for (let i = 0; i <= seq.length - 23; i++) {
    const spacer = seq.slice(i, i + 20);
    const pam = seq.slice(i + 20, i + 23);

    const pamClassification = classifyPam(pam, pamVariant);
    if (!pamClassification) continue;
    const hasPreferredPam = pamClassification === 'preferred';

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Pre-compute co-editing across the selected editor's window on the sense strand.
    const editedSeqChars = seq.split('');
    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const gIdx = i + (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && seq[gIdx] === targetBase) {
        editedSeqChars[gIdx] = replacementBase;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const genomicIdx = i + (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      if (seq[genomicIdx] === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon = coEditedSeq.slice(codonStart, codonStart + 3);
        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) {
          targetInWindow = true;
          if (editor.peakPositions.includes(pos)) targetAtPeakCenter = true;
        }

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
    const { score, verdict } = scoreGuideCandidate(
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetAtPeakCenter,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision
    );

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
      thermoProfile: estimateLocalThermodynamics(spacer),
    });
  }

  // 2. Scan Antisense (-) Strand
  // Spacer spans sense indices i .. i+19 (5' at i+19 running toward 3' at i).
  // The 3' downstream antisense PAM strictly sits at sense indices i-3 .. i-1.
  for (let i = 3; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));
    const pam = reverseComplement(seq.slice(i - 3, i));

    const pamClassification = classifyPam(pam, pamVariant);
    if (!pamClassification) continue;
    const hasPreferredPam = pamClassification === 'preferred';

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Antisense A->G produces sense T->C; Antisense C->T produces sense G->A
    const senseReplacement = targetBase === 'A' ? 'C' : 'A';
    const editedSeqChars = seq.split('');
    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const gIdx = (i + 19) - (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && reverseComplement(seq[gIdx]) === targetBase) {
        editedSeqChars[gIdx] = senseReplacement;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = windowStart; pos <= windowEnd; pos++) {
      const genomicIdx = (i + 19) - (pos - 1);
      if (genomicIdx < 0 || genomicIdx >= seq.length) continue;

      const currentBaseOnStrand = reverseComplement(seq[genomicIdx]);
      if (currentBaseOnStrand === targetBase) {
        const codonStart = Math.floor(genomicIdx / 3) * 3;
        const originalCodon = seq.slice(codonStart, codonStart + 3);
        if (originalCodon.length < 3) continue;

        const editedCodon = coEditedSeq.slice(codonStart, codonStart + 3);
        const origAA = CODON_TABLE[originalCodon] || '?';
        const editAA = CODON_TABLE[editedCodon] || '?';

        const isTarget = genomicIdx === preset.mutationIndex;
        if (isTarget) {
          targetInWindow = true;
          if (editor.peakPositions.includes(pos)) targetAtPeakCenter = true;
        }

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

    // Full 23-nt antisense footprint spans PAM (i-3 .. i-1) + spacer (i .. i+19)
    const hasSasSnpCollision = preset.sasSnpIndex >= i - 3 && preset.sasSnpIndex <= i + 19;
    const { score, verdict } = scoreGuideCandidate(
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetAtPeakCenter,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision
    );

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
      thermoProfile: estimateLocalThermodynamics(spacer),
    });
  }

  return candidates.sort((a, b) => b.CompositeScore - a.CompositeScore).slice(0, 10);
}
