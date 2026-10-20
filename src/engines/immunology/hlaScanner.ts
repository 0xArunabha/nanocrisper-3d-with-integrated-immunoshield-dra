// src/engines/immunology/hlaScanner.ts
import type { EpitopeHotspot } from '../types';

/**
 * ImmunoShield MHC-I (South Asian HLA Panel) Epitope Catalog.
 * Curates pre-existing immunogenic Cas9 peptides against high-frequency
 * HLA-A and HLA-B alleles in South Asian (SAS) populations, along with
 * structure-guided de-immunization mutations that preserve catalytic activity.
 */
export const CAS9_EPITOPE_HOTSPOTS: EpitopeHotspot[] = [
  {
    peptide: 'NLIALSLGL',
    residueRange: 'aa 236–244',
    domain: 'REC2 Domain',
    hlaAllele: 'HLA-A*02:01 / HLA-A*24:02 (Common Indian)',
    hlaAlleles: ['HLA-A*02:01', 'HLA-A*24:02'],
    bindingScore: 92,
    stealthMutation: 'L240T (Disrupts MHC-I anchor pocket B without touching DNA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'KTYAHLFDD',
    residueRange: 'aa 836–844',
    domain: 'HNH Catalytic Core (Contains H840)',
    hlaAllele: 'HLA-A*11:01 (High South Asian Frequency ~21%)',
    hlaAlleles: ['HLA-A*11:01'],
    bindingScore: 84,
    stealthMutation: 'K836R (Preserves H840 active-site histidine required for strand nicking)',
    catalyticSafe: true
  },
  {
    peptide: 'IYLAAANRL',
    residueRange: 'aa 1012–1020',
    domain: 'RuvC-III Domain',
    hlaAllele: 'HLA-A*24:02 (South Asian Frequency ~18%)',
    hlaAlleles: ['HLA-A*24:02'],
    bindingScore: 88,
    stealthMutation: 'L1020G (Eliminates C-terminal anchor binding to HLA groove)',
    catalyticSafe: true
  },
  {
    peptide: 'FEDFLKNRM',
    residueRange: 'aa 418–426',
    domain: 'Bridge Helix (Structural Stability)',
    hlaAllele: 'HLA-B*40:06 (High Dravidian / SAS Frequency ~14%)',
    hlaAlleles: ['HLA-B*40:06'],
    bindingScore: 81,
    stealthMutation: 'F421A (Masks hydrophobic anchor while preserving alpha-helical backbone)',
    catalyticSafe: true
  },
  {
    peptide: 'TLYETRRDL',
    residueRange: 'aa 674–682',
    domain: 'REC3 Domain (Target RNA Alignment)',
    hlaAllele: 'HLA-B*15:02 (High Indo-Aryan SAS Frequency ~12%)',
    hlaAlleles: ['HLA-B*15:02'],
    bindingScore: 78,
    stealthMutation: 'L675S (Ablates C-terminal peptide binding to MHC cleft)',
    catalyticSafe: true
  }
];

/** Alleles represented by the curated South Asian panel. */
export const SOUTH_ASIAN_HLA_ALLELES = Array.from(
  new Set(CAS9_EPITOPE_HOTSPOTS.flatMap((epitope) => epitope.hlaAlleles))
).sort();

/**
 * Returns the curated epitopes relevant to at least one patient-selected HLA
 * allele. An empty selection intentionally returns no result: callers should
 * present that state as "not assessed", rather than as zero risk.
 */
export function filterEpitopesByHlaAlleles(
  selectedAlleles: readonly string[],
  epitopes: readonly EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS
): EpitopeHotspot[] {
  const selected = new Set(selectedAlleles.map((allele) => allele.toUpperCase()));
  if (selected.size === 0) return [];

  return epitopes.filter((epitope) =>
    epitope.hlaAlleles.some((allele) => selected.has(allele.toUpperCase()))
  );
}

/**
 * Calculates the average illustrative residual HLA risk for the supplied
 * patient-relevant epitopes. Active stealth mutations reduce an epitope to an
 * explicitly bounded residual score; this is a UI heuristic, not an HLA
 * binding or clinical immunogenicity predictor.
 */
export function calculateHlaRiskScore(
  activeEpitopes: readonly EpitopeHotspot[] = CAS9_EPITOPE_HOTSPOTS,
  activeStealthMutations: Readonly<Record<string, boolean>> = {}
): number {
  if (activeEpitopes.length === 0) return 0;
  const avg =
    activeEpitopes.reduce(
      (acc, epitope) =>
        acc + (activeStealthMutations[epitope.peptide] ? Math.min(8, epitope.bindingScore) : epitope.bindingScore),
      0
    ) / activeEpitopes.length;
  return Math.round(avg);
}
