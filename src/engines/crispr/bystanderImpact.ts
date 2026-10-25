// src/engines/crispr/bystanderImpact.ts
//
// What the bystander table can honestly say about an unintended amino-acid change.
//
// It is a rule, not a database lookup. The rule combines:
//   - the consequence the scanner already worked out (target edit, silent, missense, nonsense),
//   - the Grantham distance between the two residues (computed, see grantham.ts), and
//   - two curated notes for the HBB sickle-cell site, each marked as curated.
//
// Nothing here queries ClinVar, so no label here may claim a ClinVar classification. A real ClinVar
// annotation needs the variant's genomic coordinates, which a bystander edit inside a spacer does not
// carry through this app.

import type { BystanderEdit } from '../types';
import { granthamClass, granthamDistance } from './grantham';

export type ImpactTone = 'ok' | 'review' | 'flag';

export interface BystanderImpact {
  /** Short label for the table cell. */
  tag: string;
  /** One line that says how the label was reached. */
  detail: string;
  tone: ImpactTone;
  /** null when the measure is not defined (stop codons) */
  granthamDistance: number | null;
  /** 'rule' = computed from the consequence and Grantham distance, 'curated' = hand-written note */
  basis: 'rule' | 'curated';
}

const STANDARD_AA = /^[ACDEFGHIKLMNPQRSTVWY]$/;

function residuePair(b: BystanderEdit): string {
  return `${b.originalAA}→${b.editedAA}`;
}

export function describeBystanderImpact(geneId: string, b: BystanderEdit): BystanderImpact {
  const distance =
    STANDARD_AA.test(b.originalAA) && STANDARD_AA.test(b.editedAA)
      ? granthamDistance(b.originalAA, b.editedAA)
      : null;

  if (b.classification === 'Silent (Synonymous)' || b.originalAA === b.editedAA) {
    return {
      tag: 'Silent',
      detail: 'Same amino acid; the protein sequence does not change.',
      tone: 'ok',
      granthamDistance: 0,
      basis: 'rule',
    };
  }

  if (b.classification === 'Nonsense (Premature Stop)') {
    return {
      tag: 'Premature stop codon',
      detail: 'Truncates the protein. Usually removed by nonsense-mediated decay.',
      tone: 'flag',
      granthamDistance: null,
      basis: 'rule',
    };
  }

  if (b.classification === 'Target Edit') {
    const makassar = geneId === 'HBB' && b.originalAA === 'V' && b.editedAA === 'A';
    return makassar
      ? {
          tag: `Intended edit ${residuePair(b)}`,
          detail:
            'Val→Ala at this site gives Hb G-Makassar, reported as non-sickling (Newby et al. 2021). Curated note.',
          tone: 'ok',
          granthamDistance: distance,
          basis: 'curated',
        }
      : {
          tag: `Intended edit ${residuePair(b)}`,
          detail:
            distance === null
              ? 'Planned change at the target base.'
              : `Planned change at the target base. Grantham ${distance} (${granthamClass(distance)}).`,
          tone: 'ok',
          granthamDistance: distance,
          basis: 'rule',
        };
  }

  // Unintended missense
  if (geneId === 'HBB' && b.originalAA === 'E' && b.editedAA === 'V') {
    return {
      tag: 'Glu→Val: the HbS sickle change',
      detail: 'This is the sickle-cell substitution (rs334). Curated note.',
      tone: 'flag',
      granthamDistance: distance,
      basis: 'curated',
    };
  }

  if (distance === null) {
    return {
      tag: `Missense ${residuePair(b)}`,
      detail: 'Grantham distance is not defined for this residue.',
      tone: 'review',
      granthamDistance: null,
      basis: 'rule',
    };
  }

  const cls = granthamClass(distance);
  return {
    tag: `Missense ${residuePair(b)}, Grantham ${distance}`,
    detail: `${cls[0].toUpperCase()}${cls.slice(1)} chemical change. Needs review; chemistry alone does not say if it is harmful.`,
    tone: distance > 100 ? 'flag' : 'review',
    granthamDistance: distance,
    basis: 'rule',
  };
}
