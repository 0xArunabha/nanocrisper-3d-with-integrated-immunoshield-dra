// src/engines/tourFacts.ts
//
// The numbers the clinical tour shows. Every one comes from the same engines the rest of the app uses,
// run on the settings the tour step applies, so a step's text always matches what the app displays after
// that step's action. Nothing here is typed in by hand except the case settings in TOUR_CASES.

import {
  BASE_EDITOR_DEFINITIONS,
  PAM_VARIANT_DEFINITIONS,
  type BaseEditorType,
  type BatchMassCalculation,
  type EpitopeHotspot,
  type GenePreset,
  type GuideCandidate,
  type LnpBiophysicsResult,
  type LnpFormulation,
  type PamVariant,
  type ThermodynamicProfile,
} from './types';
import { GENE_PRESETS } from './presets';
import { estimateLocalThermodynamics, scanForGuides } from './crispr/guideScanner';
import { describeBystanderImpact } from './crispr/bystanderImpact';
import { coverageOptions, type CoverageOption } from './crispr/targetCoverage';
import {
  calculateAmbientLnpTelemetry,
  simulateLnpBiophysics,
  type AmbientLnpTelemetry,
} from './nanotech/lnpSimulator';
import { calculateBatchMasses } from './nanotech/batchCalculator';
import {
  CAS9_EPITOPE_HOTSPOTS,
  calculateHlaRiskScore,
  filterEpitopesByHlaAlleles,
} from './immunology/hlaScanner';

export type TourCaseId = 'HBB' | 'TTR';

export interface TourCase {
  id: TourCaseId;
  /** Preset the tour loads */
  presetId: string;
  /** Editor the tour applies; null keeps the preset's own */
  editor: BaseEditorType | null;
  /** PAM variant the tour applies; null keeps the preset's own */
  pam: PamVariant | null;
  formulation: LnpFormulation;
  /** Must be alleles in the curated panel (SOUTH_ASIAN_HLA_ALLELES) */
  hlaAlleles: string[];
  batch: { volumeMl: number; mrnaMgPerMl: number };
}

const TOUR_FORMULATION: LnpFormulation = {
  ionizableLipid: 50.0,
  dspcHelper: 10.0,
  cholesterol: 38.5,
  pegLipid: 1.5,
  lipidPka: 6.35,
  npRatio: 6.0,
};

/**
 * What each tour case applies.
 *
 * HBB: with the preset's own settings (ABE8e, SpCas9 NGG) no candidate puts the target adenine inside
 * the editing window, so the tour switches the PAM to SpRY, which does. TTR: the preset encodes V30M
 * (G>A), which an adenine base editor reverts; its default BE4max (C>T) has no target base there, so the
 * tour applies ABE8e. Both choices are visible in the tour text and in the app's editor / PAM controls.
 */
export const TOUR_CASES: Record<TourCaseId, TourCase> = {
  HBB: {
    id: 'HBB',
    presetId: 'HBB',
    editor: null,
    pam: 'SpRY',
    formulation: TOUR_FORMULATION,
    hlaAlleles: ['HLA-A*02:01', 'HLA-A*24:02'],
    batch: { volumeMl: 10, mrnaMgPerMl: 1 },
  },
  TTR: {
    id: 'TTR',
    presetId: 'TTR',
    editor: 'ABE8e (A→G)',
    pam: null,
    formulation: TOUR_FORMULATION,
    hlaAlleles: ['HLA-A*24:02'],
    batch: { volumeMl: 20, mrnaMgPerMl: 1 },
  },
};

export interface TourFacts {
  tourCase: TourCase;
  /** The preset with the tour's editor and PAM applied */
  preset: GenePreset;
  presetDefault: { editor: BaseEditorType; pam: PamVariant };
  editingWindow: readonly [number, number];
  preferredPamLabel: string;
  guides: {
    total: number;
    onTarget: number;
    /** Best-scoring guide that covers the target base; null when none does */
    lead: GuideCandidate | null;
  };
  /** On-target guides for the preset's own (default) editor and PAM, before the tour changes anything */
  defaultOnTarget: number;
  /** On-target guide counts for every editor x PAM combination */
  coverage: CoverageOption[];
  /** Consequences of the lead guide's other editable bases */
  leadBystanders: { silent: number; missense: number; nonsense: number; flagged: number };
  /** In-browser nearest-neighbor energies for the lead guide (hairpin and dimer are not computed here) */
  thermo: ThermodynamicProfile | null;
  lnp: {
    biophysics: LnpBiophysicsResult;
    endosome: AmbientLnpTelemetry; // pH 5.5
    blood: AmbientLnpTelemetry; // pH 7.4
  };
  hla: {
    alleles: string[];
    relevant: EpitopeHotspot[];
    /** Demo score with no substitutions applied; null when no allele is selected */
    baselineRisk: number | null;
    /** Demo score with every substitution for the selected alleles applied */
    shieldedRisk: number | null;
  };
  batch: BatchMassCalculation;
  lipidToMrnaRatio: number;
}

export function presetForTourCase(tourCase: TourCase): GenePreset {
  const base = GENE_PRESETS.find((p) => p.id === tourCase.presetId) ?? GENE_PRESETS[0];
  return {
    ...base,
    editorType: tourCase.editor ?? base.editorType,
    pamVariant: tourCase.pam ?? base.pamVariant ?? 'SpCas9',
  };
}

export function computeTourFacts(caseId: TourCaseId): TourFacts {
  const tourCase = TOUR_CASES[caseId];
  const base = GENE_PRESETS.find((p) => p.id === tourCase.presetId) ?? GENE_PRESETS[0];
  const preset = presetForTourCase(tourCase);

  const guides = scanForGuides(preset);
  const onTargetGuides = guides.filter((g) => g.targetInWindow);
  const lead =
    [...onTargetGuides].sort((a, b) => b.CompositeScore - a.CompositeScore)[0] ?? null;

  const leadBystanders = { silent: 0, missense: 0, nonsense: 0, flagged: 0 };
  for (const b of lead?.bystanders ?? []) {
    if (b.classification === 'Silent (Synonymous)') leadBystanders.silent++;
    if (b.classification === 'Missense (Pathogenic Risk)') leadBystanders.missense++;
    if (b.classification === 'Nonsense (Premature Stop)') leadBystanders.nonsense++;
    if (describeBystanderImpact(preset.id, b).tone === 'flag') leadBystanders.flagged++;
  }

  const coverage = coverageOptions(base);
  const defaultEditor = base.editorType;
  const defaultPam = base.pamVariant ?? 'SpCas9';
  const defaultOnTarget =
    coverage.find((o) => o.editor === defaultEditor && o.pam === defaultPam)?.onTarget ?? 0;

  const biophysics = simulateLnpBiophysics(tourCase.formulation);
  const relevant = filterEpitopesByHlaAlleles(tourCase.hlaAlleles, CAS9_EPITOPE_HOTSPOTS);
  const allShielded = Object.fromEntries(relevant.map((e) => [e.peptide, true]));
  const batch = calculateBatchMasses(
    tourCase.formulation,
    tourCase.batch.volumeMl,
    tourCase.batch.mrnaMgPerMl
  );

  return {
    tourCase,
    preset,
    presetDefault: { editor: defaultEditor, pam: defaultPam },
    editingWindow: BASE_EDITOR_DEFINITIONS[preset.editorType].editingWindow,
    preferredPamLabel: PAM_VARIANT_DEFINITIONS[preset.pamVariant ?? 'SpCas9'].preferredPamLabel,
    guides: { total: guides.length, onTarget: onTargetGuides.length, lead },
    defaultOnTarget,
    coverage,
    leadBystanders,
    thermo: lead ? estimateLocalThermodynamics(lead.spacer) : null,
    lnp: {
      biophysics,
      endosome: calculateAmbientLnpTelemetry(tourCase.formulation, biophysics, 5.5),
      blood: calculateAmbientLnpTelemetry(tourCase.formulation, biophysics, 7.4),
    },
    hla: {
      alleles: tourCase.hlaAlleles,
      relevant,
      baselineRisk: relevant.length > 0 ? calculateHlaRiskScore(relevant, {}) : null,
      shieldedRisk: relevant.length > 0 ? calculateHlaRiskScore(relevant, allShielded) : null,
    },
    batch,
    lipidToMrnaRatio:
      batch.totalMrnaMassMg > 0 ? batch.totalLipidMassMg / batch.totalMrnaMassMg : 0,
  };
}
