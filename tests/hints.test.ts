// tests/hints.test.ts
import { test, expect } from 'vitest';

import {
  evaluateHints,
  checkTargetCoverageHint,
  checkBackendOfflineHint,
  checkHlaAllelesHint,
  checkLnpTargetRangeHint,
  checkRadicalBystanderHint,
  checkBatchDossierHint,
  type HintEvaluationContext,
} from '../src/engines/hints';
import type {
  GenePreset,
  GuideCandidate,
  LnpBiophysicsResult,
  LnpFormulation,
  BatchMassCalculation,
} from '../src/engines/types';

const mockPreset: GenePreset = {
  id: 'HBB',
  symbol: 'HBB',
  name: 'Hemoglobin Subunit Beta',
  disease: 'Sickle Cell Disease',
  targetOrgan: 'Bone Marrow (HSPC)',
  editorType: 'ABE8e (A→G)',
  pamVariant: 'SpCas9',
  sequence: 'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
  mutationIndex: 18,
  sasSnpIndex: 40,
  sasSnpId: 'rs334',
  sasAlleleFreq: 0.05,
  clinicalNote: 'Sickle cell pathogenic mutation testing.',
};

const mockFormulation: LnpFormulation = {
  ionizableLipid: 50.0,
  dspcHelper: 10.0,
  cholesterol: 38.5,
  pegLipid: 1.5,
  lipidPka: 6.35,
  npRatio: 6.0,
};

const mockOptimalBiophysics: LnpBiophysicsResult = {
  diameterNm: 75,
  pdi: 0.08,
  zetaPotentialMv: -1.2,
  endosomalProtonationPct: 88,
  bloodProtonationPct: 8,
  endosomalEscapeEfficiency: 72,
  cellularUptakeScore: 95,
  deGennesRfOverD: 1.35,
  criticalPackingParam: 1.59,
  saxsBraggSpacingNm: 6.2,
  organTropism: { liver: 78, spleen: 15, lungs: 7 },
  stabilityStatus: 'Optimal Clinical LNP',
};

const mockBatchCalculation: BatchMassCalculation = {
  targetVolumeMl: 10,
  mrnaConcMgMl: 1.0,
  totalMrnaMassMg: 10,
  totalLipidMassMg: 85.4,
  components: [],
};

const makeBaseContext = (overrides?: Partial<HintEvaluationContext>): HintEvaluationContext => ({
  preset: mockPreset,
  editor: 'ABE8e (A→G)',
  pam: 'SpCas9',
  allGuides: [
    {
      id: 'sgRNA-f1',
      spacer: 'ACGTACGTACGTACGTACGT',
      pam: 'AGG',
      strand: '+',
      startIndex: 0,
      gcContent: 50,
      targetInWindow: true,
      bystanders: [],
      hasSasSnpCollision: false,
      CompositeScore: 88,
      verdict: 'Optimal Clinical Guide',
    },
  ],
  selectedGuide: null,
  activeTab: 'overview',
  isTourOpen: false,
  isBackendOnline: true,
  hasBackendOnlyValueOnScreen: false,
  backendDismissedThisSession: false,
  selectedHlaAlleles: ['HLA-A*02:01'],
  formulation: mockFormulation,
  biophysics: mockOptimalBiophysics,
  batchCalculation: mockBatchCalculation,
  batchDossierDismissedForPreset: false,
  ...overrides,
});

test('Rule 5: No hints show during the Clinical Tour', () => {
  const ctx = makeBaseContext({
    isTourOpen: true,
    allGuides: [], // Would normally trigger Hint #1
  });
  const hints = evaluateHints(ctx);
  expect(hints.length).toBe(0);
});

test('Hint #1: Target coverage hint fires when no guide covers target base', () => {
  const ctx = makeBaseContext({
    allGuides: [
      {
        id: 'sgRNA-f1',
        spacer: 'ACGTACGTACGTACGTACGT',
        pam: 'AGG',
        strand: '+',
        startIndex: 0,
        gcContent: 50,
        targetInWindow: false,
        bystanders: [],
        hasSasSnpCollision: false,
        CompositeScore: 80,
        verdict: 'Safe (Silent Bystander)',
      },
    ],
  });

  const hint = checkTargetCoverageHint(ctx);
  expect(hint).not.toBeNull();
  expect(hint!.priority).toBe(1);
  expect(hint!.message).toMatch(/No candidate guide covers the target base/);
  expect(hint!.action).toBeDefined();
  expect(hint!.conditionKey.startsWith('cov:HBB:')).toBe(true);

  let applied = false;
  ctx.onApplyEditorPam = () => { applied = true; };
  hint!.action?.run();
  expect(applied).toBe(true);
});

test('Hint #1: Target coverage hint does NOT fire when on-target guide exists', () => {
  const ctx = makeBaseContext();
  const hint = checkTargetCoverageHint(ctx);
  expect(hint).toBeNull();
});

test('Hint #2: Backend offline hint fires when backend is off and backend value is on screen', () => {
  const ctx = makeBaseContext({
    isBackendOnline: false,
    hasBackendOnlyValueOnScreen: true,
    backendDismissedThisSession: false,
  });

  const hint = checkBackendOfflineHint(ctx);
  expect(hint).not.toBeNull();
  expect(hint!.priority).toBe(2);
  expect(hint!.message).toMatch(/Backend is disconnected/);
  expect(hint!.action).toBeUndefined(); // Quiet, no action

  // Does not fire if dismissed for the session
  const dismissedCtx = makeBaseContext({
    isBackendOnline: false,
    hasBackendOnlyValueOnScreen: true,
    backendDismissedThisSession: true,
  });
  expect(checkBackendOfflineHint(dismissedCtx)).toBeNull();

  // Does not fire if backend is online
  const onlineCtx = makeBaseContext({
    isBackendOnline: true,
    hasBackendOnlyValueOnScreen: true,
  });
  expect(checkBackendOfflineHint(onlineCtx)).toBeNull();
});

test('Hint #3: HLA hint fires on immunology or batch tab when no alleles selected', () => {
  const ctxImmunology = makeBaseContext({
    activeTab: 'immunology',
    selectedHlaAlleles: [],
  });
  const hintImm = checkHlaAllelesHint(ctxImmunology);
  expect(hintImm).not.toBeNull();
  expect(hintImm!.priority).toBe(3);
  expect(hintImm!.message).toMatch(/No HLA alleles selected/);
  expect(hintImm!.action?.label).toBe('Select South Asian panel');

  let hlaSelected = false;
  ctxImmunology.onSelectHlaPanel = () => { hlaSelected = true; };
  hintImm!.action?.run();
  expect(hlaSelected).toBe(true);

  const ctxBatch = makeBaseContext({
    activeTab: 'batch',
    selectedHlaAlleles: [],
  });
  expect(checkHlaAllelesHint(ctxBatch)).not.toBeNull();

  // Does NOT fire on overview, crispr, or lnp tabs
  expect(checkHlaAllelesHint(makeBaseContext({ activeTab: 'overview', selectedHlaAlleles: [] }))).toBeNull();
  expect(checkHlaAllelesHint(makeBaseContext({ activeTab: 'crispr', selectedHlaAlleles: [] }))).toBeNull();
  expect(checkHlaAllelesHint(makeBaseContext({ activeTab: 'lnp', selectedHlaAlleles: [] }))).toBeNull();

  // Does NOT fire when alleles are selected
  expect(checkHlaAllelesHint(makeBaseContext({ activeTab: 'immunology', selectedHlaAlleles: ['HLA-A*02:01'] }))).toBeNull();
});

test('Hint #4: LNP outside model target range fires only on LNP tab when stabilityStatus is not Optimal', () => {
  const highPegBiophysics: LnpBiophysicsResult = {
    ...mockOptimalBiophysics,
    stabilityStatus: 'PEG Stealth Dilemma (Low Uptake)',
  };

  const ctxLnp = makeBaseContext({
    activeTab: 'lnp',
    formulation: { ...mockFormulation, pegLipid: 3.5 },
    biophysics: highPegBiophysics,
  });

  const hint = checkLnpTargetRangeHint(ctxLnp);
  expect(hint).not.toBeNull();
  expect(hint!.priority).toBe(4);
  expect(hint!.message).toMatch(/model target: 1\.0–3\.0 mol%/);
  expect(hint!.action?.label).toBe('Set PEG to 1.5 mol%');

  let paramAdjusted = '';
  ctxLnp.onAdjustLnpParam = (param) => { paramAdjusted = param; };
  hint!.action?.run();
  expect(paramAdjusted).toBe('pegLipid');

  // Does NOT fire on overview or crispr tabs
  expect(checkLnpTargetRangeHint(makeBaseContext({ activeTab: 'overview', biophysics: highPegBiophysics }))).toBeNull();
  expect(checkLnpTargetRangeHint(makeBaseContext({ activeTab: 'crispr', biophysics: highPegBiophysics }))).toBeNull();

  // Does NOT fire when stabilityStatus is Optimal
  expect(checkLnpTargetRangeHint(makeBaseContext({ activeTab: 'lnp', biophysics: mockOptimalBiophysics }))).toBeNull();
});

test('Hint #5: Radical bystander hint fires when selected guide has radical edit and safer guide exists', () => {
  const riskyGuide: GuideCandidate = {
    id: 'sgRNA-f1',
    spacer: 'ACGTACGTACGTACGTACGT',
    pam: 'AGG',
    strand: '+',
    startIndex: 0,
    gcContent: 50,
    targetInWindow: true,
    bystanders: [
      {
        guidePos: 5,
        genomicIndex: 20,
        originalCodon: 'TGT',
        editedCodon: 'CGT',
        originalAA: 'C',
        editedAA: 'R', // Grantham = 180 (radical > 150)
        classification: 'Missense (Pathogenic Risk)',
        granthamDistance: 180,
        granthamClass: 'radical',
      },
    ],
    hasSasSnpCollision: false,
    CompositeScore: 75,
    verdict: 'High Risk (Bystander/SNP)',
  };

  const saferGuide: GuideCandidate = {
    id: 'sgRNA-f2',
    spacer: 'TGCATGCATGCATGCATGCA',
    pam: 'CGG',
    strand: '+',
    startIndex: 3,
    gcContent: 50,
    targetInWindow: true,
    bystanders: [],
    hasSasSnpCollision: false,
    CompositeScore: 82,
    verdict: 'Optimal Clinical Guide',
  };

  const ctx = makeBaseContext({
    allGuides: [riskyGuide, saferGuide],
    selectedGuide: riskyGuide,
  });

  const hint = checkRadicalBystanderHint(ctx);
  expect(hint).not.toBeNull();
  expect(hint!.priority).toBe(5);
  expect(hint!.message).toMatch(/Selected guide sgRNA-f1 has a radical bystander edit; sgRNA-f2 covers target without radical edit\./);
  expect(hint!.action?.label).toBe('Select sgRNA-f2');

  let selectedId = '';
  ctx.onSelectGuide = (id) => { selectedId = id; };
  hint!.action?.run();
  expect(selectedId).toBe('sgRNA-f2');

  // Does NOT fire if safer guide is already selected
  const ctxSaferSelected = makeBaseContext({
    allGuides: [riskyGuide, saferGuide],
    selectedGuide: saferGuide,
  });
  expect(checkRadicalBystanderHint(ctxSaferSelected)).toBeNull();
});

test('Hint #6: Batch dossier hint fires on batch tab and values are set', () => {
  const ctx = makeBaseContext({
    activeTab: 'batch',
    batchCalculation: mockBatchCalculation,
    batchDossierDismissedForPreset: false,
  });

  const hint = checkBatchDossierHint(ctx);
  expect(hint).not.toBeNull();
  expect(hint!.priority).toBe(6);
  expect(hint!.message).toMatch(/Batch formulation calculated: 85\.4 mg total lipid\./);
  expect(hint!.action?.label).toBe('Open Pre-IND dossier');

  let dossierOpened = false;
  ctx.onOpenDossier = () => { dossierOpened = true; };
  hint!.action?.run();
  expect(dossierOpened).toBe(true);

  // Does NOT fire if dismissed for this preset
  expect(checkBatchDossierHint(makeBaseContext({
    activeTab: 'batch',
    batchDossierDismissedForPreset: true,
  }))).toBeNull();

  // Does NOT fire on overview or crispr tabs
  expect(checkBatchDossierHint(makeBaseContext({ activeTab: 'overview' }))).toBeNull();
});

test('evaluateHints prioritizes hints strictly by priority #1 to #6', () => {
  // Setup a scenario where Hint 1 (no coverage), Hint 3 (no HLA on batch tab), and Hint 6 (batch dossier) could fire
  const ctx = makeBaseContext({
    activeTab: 'batch',
    allGuides: [], // Hint #1
    selectedHlaAlleles: [], // Hint #3
    batchCalculation: mockBatchCalculation, // Hint #6
  });

  const hints = evaluateHints(ctx);
  expect(hints.length).toBe(3);
  expect(hints[0].priority).toBe(1);
  expect(hints[1].priority).toBe(3);
  expect(hints[2].priority).toBe(6);
});
