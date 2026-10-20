// src/engines/crispr/guideScanner.ts
import type { GenePreset, GuideCandidate, BystanderEdit } from '../types';

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

function scoreGuideCandidate(
  isCanonicalPam: boolean,
  gcContent: number,
  targetInWindow: boolean,
  targetAtPeakCenter: boolean,
  hasPolIIITerminator: boolean,
  edits: BystanderEdit[],
  hasSasSnpCollision: boolean
): { score: number; verdict: GuideCandidate['verdict'] } {
  let score = isCanonicalPam ? 65 : 48;

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
 * Scans both sense (+) and antisense (-) strands for 20nt protospacers with 3' NGG/NAG PAMs,
 * simulates processive co-editing across the 4-8 deaminase window, audits codon consequences,
 * and flags South Asian (SAS) polymorphism collisions across the full 23-nt target + PAM span.
 */
export function scanForGuides(preset: GenePreset): GuideCandidate[] {
  const seq = preset.sequence.toUpperCase();
  const candidates: GuideCandidate[] = [];
  const targetBase = preset.editorType.startsWith('ABE') ? 'A' : 'C';
  const replacementBase = preset.editorType.startsWith('ABE') ? 'G' : 'T';

  // 1. Scan Sense (+) Strand (5'-[20nt spacer]-[3nt PAM]-3' covering sense indices i .. i+22)
  for (let i = 0; i <= seq.length - 23; i++) {
    const spacer = seq.slice(i, i + 20);
    const pam = seq.slice(i + 20, i + 23);

    const isCanonicalPam = pam[1] === 'G' && pam[2] === 'G';
    const isRelaxedPam = pam[1] === 'G' && pam[2] === 'A';
    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Pre-compute processive co-editing across window positions 4..8 on the sense strand
    const editedSeqChars = seq.split('');
    for (let pos = 4; pos <= 8; pos++) {
      const gIdx = i + (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && seq[gIdx] === targetBase) {
        editedSeqChars[gIdx] = replacementBase;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = 4; pos <= 8; pos++) {
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
          if (pos >= 5 && pos <= 7) targetAtPeakCenter = true;
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
      isCanonicalPam,
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
    });
  }

  // 2. Scan Antisense (-) Strand
  // Spacer spans sense indices i .. i+19 (5' at i+19 running toward 3' at i).
  // The 3' downstream antisense PAM strictly sits at sense indices i-3 .. i-1.
  for (let i = 3; i <= seq.length - 20; i++) {
    const spacer = reverseComplement(seq.slice(i, i + 20));
    const pam = reverseComplement(seq.slice(i - 3, i));

    const isCanonicalPam = pam[1] === 'G' && pam[2] === 'G';
    const isRelaxedPam = pam[1] === 'G' && pam[2] === 'A';
    if (!isCanonicalPam && !isRelaxedPam) continue;

    const gcCount = (spacer.match(/[GC]/g) || []).length;
    const gcContent = Math.round((gcCount / 20) * 100);
    const hasPolIIITerminator = spacer.includes('TTTT');

    // Antisense A->G produces sense T->C; Antisense C->T produces sense G->A
    const senseReplacement = targetBase === 'A' ? 'C' : 'A';
    const editedSeqChars = seq.split('');
    for (let pos = 4; pos <= 8; pos++) {
      const gIdx = (i + 19) - (pos - 1);
      if (gIdx >= 0 && gIdx < seq.length && reverseComplement(seq[gIdx]) === targetBase) {
        editedSeqChars[gIdx] = senseReplacement;
      }
    }
    const coEditedSeq = editedSeqChars.join('');

    const edits: BystanderEdit[] = [];
    let targetInWindow = false;
    let targetAtPeakCenter = false;

    for (let pos = 4; pos <= 8; pos++) {
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
          if (pos >= 5 && pos <= 7) targetAtPeakCenter = true;
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
      isCanonicalPam,
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
    });
  }

  return candidates.sort((a, b) => b.CompositeScore - a.CompositeScore).slice(0, 10);
}
