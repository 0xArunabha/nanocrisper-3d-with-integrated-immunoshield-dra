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

/**
 * Dual-Strand Codon-Aware CRISPR & Base Editor Discovery Engine.
 * Scans both sense (+) and antisense (-) strands for 20nt protospacers with NGG/NAG PAMs,
 * maps deamination activity inside the 4-8 window, assesses bystander codon consequences,
 * and prioritizes guides covering the pathogenic target mutation.
 */
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
