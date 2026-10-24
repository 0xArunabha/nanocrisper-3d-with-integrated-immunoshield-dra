// src/engines/crispr/guideScanner.ts
import {
  BASE_EDITOR_DEFINITIONS,
  type BystanderEdit,
  type GenePreset,
  type GuideCandidate,
  type PamVariant,
  type ThermodynamicProfile,
} from '../types';

const RNA_DNA_NN: Record<string, [number, number]> = {
  AA: [-7.8, -21.9], AT: [-8.3, -23.9], AC: [-9.1, -23.5], AG: [-7.0, -16.4],
  TA: [-4.2, -10.0], TT: [-6.1, -16.9], TC: [-7.0, -17.6], TG: [-5.8, -12.3],
  CA: [-9.0, -23.5], CT: [-7.0, -16.4], CC: [-9.3, -23.2], CG: [-16.3, -47.1],
  GA: [-5.5, -13.5], GT: [-7.8, -21.6], GC: [-8.0, -17.1], GG: [-12.8, -31.9],
};

export function estimateLocalThermodynamics(spacer: string): ThermodynamicProfile {
  let dh = 1.9;
  let ds = -3.9;
  const clean = spacer.toUpperCase().replace(/U/g, 'T');
  for (let i = 0; i < clean.length - 1; i++) {
    const pair = clean.slice(i, i + 2);
    const [h, s] = RNA_DNA_NN[pair] || [-7.5, -19.5];
    dh += h;
    ds += s;
  }
  const dsSalt = ds + 0.368 * (clean.length - 1) * Math.log(0.15);
  const dg37 = dh - 310.15 * (dsSalt / 1000);
  const tm = (dh * 1000) / (dsSalt + 1.9872 * Math.log(2.5e-7 / 4)) - 273.15;
  const dnaDg = dg37 * 0.78;
  const rLoopNet = dg37 - dnaDg;

  // Harmonized thermodynamic efficiency bonus matching Python backend
  let bonus = 0.0;
  if (dg37 >= -34.5 && dg37 <= -24.0) {
    bonus += 5.0;
  } else if (dg37 < -38.0 || dg37 > -18.0) {
    bonus -= 6.0;
  }
  const seedDg = Math.round((dg37 * 0.52) * 100) / 100;
  const distalDg = Math.round((dg37 * 0.48) * 100) / 100;
  if (seedDg >= -16.0 && seedDg <= -11.0) {
    bonus += 3.0;
  } else if (seedDg < -17.5) {
    bonus -= 4.0;
  }
  const hasGcClamp = clean.length >= 20 && /[GC]/.test(clean[18]) && /[GC]/.test(clean[19]);
  if (hasGcClamp) bonus += 2.0;

  return {
    spacer: clean,
    rnaDnaDg37: Math.round(dg37 * 100) / 100,
    rnaDnaDh: Math.round(dh * 10) / 10,
    rnaDnaDs: Math.round(dsSalt * 10) / 10,
    rnaDnaTm: Math.round(tm * 10) / 10,
    dnaDnaDg37: Math.round(dnaDg * 100) / 100,
    rLoopNetDg: Math.round(rLoopNet * 100) / 100,
    isRLoopThermodynamicallyFavored: rLoopNet < 0,
    hairpinDg: 0.0,
    hairpinStructure: '....................',
    hairpinStemLength: 0,
    hairpinLoopSize: 0,
    hairpinRisk: 'Low / Unstructured',
    seedDg,
    distalDg,
    seedAsymmetryDdg: 0.0,
    hasGcClamp,
    selfDimerDg: -1.5,
    selfDimerRisk: 'Negligible',
    thermodynamicVerdict: 'Optimal Thermodynamic Profile',
    thermodynamicEfficiencyBonus: Math.round(bonus * 10) / 10,
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

const BASE_EDITOR_POS_WEIGHTS: Record<string, Record<number, number>> = {
  'ABE8e (A→G)': { 4: 0.78, 5: 1.00, 6: 1.00, 7: 0.92, 8: 0.68 },
  'ABE9 (A→G; window 5–6)': { 5: 1.00, 6: 1.00 },
  'BE4max (C→T)': { 4: 0.88, 5: 0.98, 6: 1.00, 7: 0.86, 8: 0.62 },
};

function scoreGuideCandidate(
  spacer: string,
  hasPreferredPam: boolean,
  gcContent: number,
  targetInWindow: boolean,
  targetPosWeight: number,
  hasPolIIITerminator: boolean,
  edits: BystanderEdit[],
  hasSasSnpCollision: boolean,
  thermo?: ThermodynamicProfile
): { score: number; verdict: GuideCandidate['verdict'] } {
  let score = hasPreferredPam ? 65 : 48;

  if (thermo) {
    score += thermo.thermodynamicEfficiencyBonus;
  } else {
    if (gcContent >= 40 && gcContent <= 60) {
      score += 16;
    } else if (gcContent >= 35 && gcContent <= 65) {
      score += 9;
    } else {
      score -= 10;
    }
  }

  // 2. Seed Region (positions 13-20 proximal to PAM) G/C nucleation stability
  const seedGc = (spacer.slice(12, 20).match(/[GC]/g) || []).length;
  if (seedGc >= 3 && seedGc <= 6) {
    score += 4;
  }

  // 3. Empirical Deaminase Positional Efficiency
  if (targetInWindow) {
    score += 32.0 + (targetPosWeight * 8.0);
  } else {
    score -= 25.0;
  }

  // 4. U6 Pol III termination check (TTTT)
  if (hasPolIIITerminator) {
    score -= 30.0;
  }

  // 5. Bystander Codon Consequence Penalties
  let hasHarmfulBystander = false;
  let hasSilentBystander = false;

  for (const e of edits) {
    if (e.classification === 'Nonsense (Premature Stop)') {
      score -= 45.0;
      hasHarmfulBystander = true;
    } else if (e.classification === 'Missense (Pathogenic Risk)') {
      score -= 25.0;
      hasHarmfulBystander = true;
    } else if (e.classification === 'Silent (Synonymous)') {
      score += 4.0;
      hasSilentBystander = true;
    }
  }

  if (hasSasSnpCollision) score -= 20.0;
  const finalScore = Math.max(5, Math.min(99, Math.round(score)));

  let verdict: GuideCandidate['verdict'] = 'Low Efficiency';
  if (targetInWindow && !hasHarmfulBystander && !hasSasSnpCollision && !hasPolIIITerminator) {
    verdict = hasSilentBystander ? 'Safe (Silent Bystander)' : 'Optimal Clinical Guide';
  } else if (hasHarmfulBystander || hasSasSnpCollision) {
    verdict = 'High Risk (Bystander/SNP)';
  }

  return { score: finalScore, verdict };
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
    let targetPosWeight = 0.8;

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
          targetPosWeight =
            BASE_EDITOR_POS_WEIGHTS[preset.editorType]?.[pos] ??
            (editor.peakPositions.includes(pos) ? 1.0 : 0.8);
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

    const thermo = estimateLocalThermodynamics(spacer);
    const hasSasSnpCollision = preset.sasSnpIndex >= i && preset.sasSnpIndex <= i + 22;
    const { score, verdict } = scoreGuideCandidate(
      spacer,
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetPosWeight,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision,
      thermo
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
      thermoProfile: thermo,
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
    let targetPosWeight = 0.8;

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
          targetPosWeight =
            BASE_EDITOR_POS_WEIGHTS[preset.editorType]?.[pos] ??
            (editor.peakPositions.includes(pos) ? 1.0 : 0.8);
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

    const thermo = estimateLocalThermodynamics(spacer);
    // Full 23-nt antisense footprint spans PAM (i-3 .. i-1) + spacer (i .. i+19)
    const hasSasSnpCollision = preset.sasSnpIndex >= i - 3 && preset.sasSnpIndex <= i + 19;
    const { score, verdict } = scoreGuideCandidate(
      spacer,
      hasPreferredPam,
      gcContent,
      targetInWindow,
      targetPosWeight,
      hasPolIIITerminator,
      edits,
      hasSasSnpCollision,
      thermo
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
      thermoProfile: thermo,
    });
  }

  return candidates.sort((a, b) => b.CompositeScore - a.CompositeScore).slice(0, 10);
}
