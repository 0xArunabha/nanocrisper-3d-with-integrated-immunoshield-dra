// src/engines/nanotech/benchmarks.ts
import type { LnpFormulation } from '../types';

/** A reference formulation: a marketed product, a clinical candidate or a published research composition. */
export interface LnpBenchmark {
  id: string;
  name: string;
  /** Ionizable (or cationic) lipid, as the source names it. */
  lipid: string;
  /** Where it accumulates and how much, as listed for this reference. */
  target: string;
  /** What that tropism is used for. */
  organ: string;
  formulation: LnpFormulation;
}

/** Picking one replaces every formulation control. Every value sits on its slider's grid (see LNP_LIMITS). */
export const LNP_BENCHMARKS: readonly LnpBenchmark[] = [
  {
    id: 'Onpattro',
    name: 'Onpattro®',
    lipid: 'DLin-MC3-DMA',
    target: 'Liver (78%)',
    organ: 'Hepatic',
    formulation: { ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.44, npRatio: 6.0 },
  },
  {
    id: 'Moderna',
    name: 'Spikevax®',
    lipid: 'SM-102',
    target: 'Liver / Muscle',
    organ: 'Systemic',
    formulation: { ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.68, npRatio: 6.0 },
  },
  {
    id: 'Comirnaty',
    name: 'Comirnaty®',
    lipid: 'ALC-0315',
    target: 'Liver / Spleen',
    organ: 'Lymphoid',
    formulation: { ionizableLipid: 46.3, dspcHelper: 9.4, cholesterol: 42.7, pegLipid: 1.6, lipidPka: 6.09, npRatio: 6.0 },
  },
  {
    id: 'NTLA2001',
    name: 'NTLA-2001',
    lipid: 'LP-01 (CRISPR)',
    target: 'Liver (82%)',
    organ: 'In vivo Cas9',
    formulation: { ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.5, npRatio: 6.0 },
  },
  {
    id: 'LungSORT',
    name: 'Lung-SORT',
    lipid: '50% DOTAP',
    target: 'Lungs (65%)',
    organ: 'Endothelial',
    formulation: { ionizableLipid: 55.0, dspcHelper: 12.0, cholesterol: 31.5, pegLipid: 1.5, lipidPka: 7.1, npRatio: 8.0 },
  },
  {
    id: 'SpleenSORT',
    name: 'Spleen-SORT',
    lipid: '18PA (Anionic)',
    target: 'Spleen (60%)',
    organ: 'Splenic B/T',
    formulation: { ionizableLipid: 48.0, dspcHelper: 10.0, cholesterol: 40.5, pegLipid: 1.5, lipidPka: 5.85, npRatio: 5.0 },
  },
];

/** What "Reset" restores. */
export const DEFAULT_LNP_BENCHMARK: LnpBenchmark = LNP_BENCHMARKS[0];

/**
 * The benchmark the controls currently equal, if any. All five values sit on their slider's grid, so
 * "matches" means identical; the tolerance only absorbs float noise.
 */
export function matchLnpBenchmark(form: LnpFormulation): LnpBenchmark | undefined {
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  return LNP_BENCHMARKS.find(
    (b) =>
      same(b.formulation.ionizableLipid, form.ionizableLipid) &&
      same(b.formulation.dspcHelper, form.dspcHelper) &&
      same(b.formulation.pegLipid, form.pegLipid) &&
      same(b.formulation.lipidPka, form.lipidPka) &&
      same(b.formulation.npRatio, form.npRatio)
  );
}
