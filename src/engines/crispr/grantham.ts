// src/engines/crispr/grantham.ts
//
// Grantham (1974) amino-acid substitution distance, computed rather than looked up:
//
//   D = 50.723 * sqrt( 1.833 * dc^2 + 0.1018 * dp^2 + 0.000399 * dv^2 )
//
// c = composition, p = polarity, v = molecular volume (Grantham, Science 185:862, 1974).
// Classes follow Li, Wu and Luo (1984). The measure says how chemically different two residues are.
// It does not say whether a change is pathogenic.
//
// Python twin: backend/integrations/grantham.py. backend/checks/check_science.py holds the known
// matrix entries both must reproduce.

type Residue = readonly [composition: number, polarity: number, volume: number];

const PROPERTIES: Readonly<Record<string, Residue>> = {
  A: [0.0, 8.1, 31.0],
  R: [0.65, 10.5, 124.0],
  N: [1.33, 11.6, 56.0],
  D: [1.38, 13.0, 54.0],
  C: [2.75, 5.5, 55.0],
  Q: [0.89, 10.5, 85.0],
  E: [0.92, 12.3, 83.0],
  G: [0.74, 9.0, 3.0],
  H: [0.58, 10.4, 96.0],
  I: [0.0, 5.2, 111.0],
  L: [0.0, 4.9, 111.0],
  K: [0.33, 11.3, 119.0],
  M: [0.0, 5.7, 105.0],
  F: [0.0, 5.2, 132.0],
  P: [0.39, 8.0, 32.5],
  S: [1.42, 9.2, 32.0],
  T: [0.71, 8.6, 61.0],
  W: [0.13, 5.4, 170.0],
  Y: [0.2, 6.2, 136.0],
  V: [0.0, 5.9, 84.0],
};

export type GranthamClass =
  | 'conservative'
  | 'moderately conservative'
  | 'moderately radical'
  | 'radical';

/** Grantham distance between two one-letter residues, or null when either is not one of the 20
 *  standard amino acids (for example a stop codon, '*'). */
export function granthamDistance(fromAa: string, toAa: string): number | null {
  const a = PROPERTIES[fromAa.trim().toUpperCase()];
  const b = PROPERTIES[toAa.trim().toUpperCase()];
  if (!a || !b) return null;
  const d =
    50.723 *
    Math.sqrt(
      1.833 * (a[0] - b[0]) ** 2 + 0.1018 * (a[1] - b[1]) ** 2 + 0.000399 * (a[2] - b[2]) ** 2
    );
  return Math.round(d);
}

export function granthamClass(distance: number): GranthamClass {
  if (distance <= 50) return 'conservative';
  if (distance <= 100) return 'moderately conservative';
  if (distance <= 150) return 'moderately radical';
  return 'radical';
}
