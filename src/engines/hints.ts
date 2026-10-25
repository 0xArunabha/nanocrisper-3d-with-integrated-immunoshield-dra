// src/engines/hints.ts
// Pure functions for the quiet workbench hint system.
//
// Rules that keep it from being annoying:
// 1. Single line in fixed spot under the status bar.
// 2. Only one hint shows at a time (+N to see others; highest priority wins).
// 3. Settle debounce (1.5s after last user change).
// 4. Dismissing is permanent for that situation (keyed by conditionKey).
// 5. No hints during the Clinical Tour.
// 6. Hints only report what the engines compute. No "good" or "safe" wording; every range is labelled "model target".
// 7. Every hint has an action or it doesn't exist (except Hint #2 which is quiet backend notice shown once per session).

import type {
  BaseEditorType,
  DashboardTab,
  GenePreset,
  GuideCandidate,
  LnpBiophysicsResult,
  LnpFormulation,
  PamVariant,
  BatchMassCalculation,
} from './types';
import { coverageOptions, type CoverageOption } from './crispr/targetCoverage';
import { granthamClass, granthamDistance } from './crispr/grantham';

export type HintPriority = 1 | 2 | 3 | 4 | 5 | 6;

export interface HintAction {
  label: string;
  run: () => void;
}

export interface Hint {
  id: string;
  priority: HintPriority;
  message: string;
  action?: HintAction;
  /** Fingerprint of the exact underlying situation. Dismissing suppresses this hint until conditionKey changes. */
  conditionKey: string;
}

export interface HintEvaluationContext {
  preset: GenePreset;
  editor: BaseEditorType;
  pam: PamVariant;
  allGuides: GuideCandidate[];
  selectedGuide: GuideCandidate | null;
  activeTab: DashboardTab;
  isTourOpen: boolean;
  isBackendOnline: boolean;
  hasBackendOnlyValueOnScreen: boolean;
  backendDismissedThisSession?: boolean;
  selectedHlaAlleles: readonly string[];
  formulation: LnpFormulation;
  biophysics: LnpBiophysicsResult;
  batchCalculation: BatchMassCalculation;
  batchDossierDismissedForPreset?: boolean;

  // Action callbacks
  onApplyEditorPam?: (editor: BaseEditorType, pam: PamVariant) => void;
  onSelectHlaPanel?: () => void;
  onAdjustLnpParam?: (param: keyof LnpFormulation, value: number) => void;
  onSelectGuide?: (guideId: string) => void;
  onOpenDossier?: () => void;
}

const shortEditor = (editor: string): string => editor.split(' (')[0];

/** Helper: checks whether a guide candidate contains a radical bystander edit or premature stop */
export function hasRadicalBystanderEdit(guide: GuideCandidate): boolean {
  return guide.bystanders.some((b) => {
    if (b.classification === 'Nonsense (Premature Stop)') return true;
    if (b.classification === 'Silent (Synonymous)' || b.classification === 'Target Edit') return false;
    if (b.granthamClass === 'radical') return true;
    if (typeof b.granthamDistance === 'number' && b.granthamDistance > 150) return true;
    const dist = granthamDistance(b.originalAA, b.editedAA);
    if (dist === null) return false;
    return dist > 150 || granthamClass(dist) === 'radical';
  });
}

/**
 * Hint #1 (Priority 1): No guide covers the target base.
 * Action: Apply the best editor and PAM with highest on-target count.
 */
export function checkTargetCoverageHint(ctx: HintEvaluationContext): Hint | null {
  const onTargetCount = ctx.allGuides.filter((g) => g.targetInWindow).length;
  if (onTargetCount > 0) return null;

  const currentPreset: GenePreset = {
    ...ctx.preset,
    editorType: ctx.editor,
    pamVariant: ctx.pam,
  };
  const options = coverageOptions(currentPreset);
  const covering = options
    .filter((opt) => opt.onTarget > 0)
    .sort((a, b) => b.onTarget - a.onTarget);

  const bestOption: CoverageOption | undefined = covering[0];
  const conditionKey = `cov:${ctx.preset.id}:${ctx.preset.sequence}:${ctx.preset.mutationIndex}:${ctx.editor}:${ctx.pam}`;

  if (bestOption) {
    const actionLabel = `Apply ${shortEditor(bestOption.editor)} + ${bestOption.pam}`;
    return {
      id: 'hint-no-target-coverage',
      priority: 1,
      message: `No candidate guide covers the target base with ${shortEditor(ctx.editor)} and ${ctx.pam}.`,
      action: {
        label: actionLabel,
        run: () => ctx.onApplyEditorPam?.(bestOption.editor, bestOption.pam),
      },
      conditionKey,
    };
  }

  return {
    id: 'hint-no-target-coverage',
    priority: 1,
    message: `No candidate guide covers the target base with ${shortEditor(ctx.editor)} and ${ctx.pam}.`,
    conditionKey,
  };
}

/**
 * Hint #2 (Priority 2): Backend is off and a backend-only value is on screen.
 * Action: None (shown once per session, quiet).
 */
export function checkBackendOfflineHint(ctx: HintEvaluationContext): Hint | null {
  if (ctx.isBackendOnline) return null;
  if (!ctx.hasBackendOnlyValueOnScreen) return null;
  if (ctx.backendDismissedThisSession) return null;

  return {
    id: 'hint-backend-offline',
    priority: 2,
    message: 'Backend is disconnected. Thermodynamic folding and remote annotations unavailable.',
    conditionKey: 'backend_offline_session',
  };
}

/**
 * Hint #3 (Priority 3): No HLA alleles selected and on ImmunoShield or Batch tab.
 * Action: Select the South Asian panel.
 */
export function checkHlaAllelesHint(ctx: HintEvaluationContext): Hint | null {
  const isRelevantTab = ctx.activeTab === 'immunology' || ctx.activeTab === 'batch';
  if (!isRelevantTab) return null;
  if (ctx.selectedHlaAlleles.length > 0) return null;

  return {
    id: 'hint-no-hla-alleles',
    priority: 3,
    message: 'No HLA alleles selected: residual CTL risk calculation is inactive.',
    action: {
      label: 'Select South Asian panel',
      run: () => ctx.onSelectHlaPanel?.(),
    },
    conditionKey: `hla_none:${ctx.preset.id}`,
  };
}

/**
 * Hint #4 (Priority 4): LNP outside model's target range, on the LNP tab only.
 * Action: Show which slider moves it (or apply target value).
 */
export function checkLnpTargetRangeHint(ctx: HintEvaluationContext): Hint | null {
  if (ctx.activeTab !== 'lnp') return null;
  if (ctx.biophysics.stabilityStatus === 'Optimal Clinical LNP') return null;

  const rawTotal =
    ctx.formulation.ionizableLipid +
    ctx.formulation.dspcHelper +
    ctx.formulation.cholesterol +
    ctx.formulation.pegLipid;
  const total = rawTotal > 0 ? rawTotal : 100;
  const normPeg = (ctx.formulation.pegLipid / total) * 100;

  const conditionKey = `lnp_target:${ctx.biophysics.stabilityStatus}:${ctx.formulation.pegLipid.toFixed(1)}:${ctx.formulation.lipidPka.toFixed(2)}:${ctx.biophysics.diameterNm}`;

  if (normPeg > 3.2) {
    return {
      id: 'hint-lnp-outside-target',
      priority: 4,
      message: `PEG-lipid is ${ctx.formulation.pegLipid.toFixed(1)} mol% (model target: 1.0–3.0 mol%).`,
      action: {
        label: 'Set PEG to 1.5 mol%',
        run: () => ctx.onAdjustLnpParam?.('pegLipid', 1.5),
      },
      conditionKey,
    };
  }

  if (ctx.biophysics.diameterNm > 140) {
    return {
      id: 'hint-lnp-outside-target',
      priority: 4,
      message: `Predicted diameter is ${ctx.biophysics.diameterNm} nm (model target: 50–120 nm).`,
      action: {
        label: 'Set PEG to 1.5 mol%',
        run: () => ctx.onAdjustLnpParam?.('pegLipid', 1.5),
      },
      conditionKey,
    };
  }

  if (normPeg < 0.8) {
    return {
      id: 'hint-lnp-outside-target',
      priority: 4,
      message: `PEG-lipid is ${ctx.formulation.pegLipid.toFixed(1)} mol% (model target: ≥ 0.8 mol%).`,
      action: {
        label: 'Set PEG to 1.5 mol%',
        run: () => ctx.onAdjustLnpParam?.('pegLipid', 1.5),
      },
      conditionKey,
    };
  }

  if (ctx.biophysics.endosomalEscapeEfficiency < 58) {
    return {
      id: 'hint-lnp-outside-target',
      priority: 4,
      message: `Endosomal escape is ${ctx.biophysics.endosomalEscapeEfficiency}% (model target: ≥ 58%).`,
      action: {
        label: 'Set lipid pKa to 6.35',
        run: () => ctx.onAdjustLnpParam?.('lipidPka', 6.35),
      },
      conditionKey,
    };
  }

  return {
    id: 'hint-lnp-outside-target',
    priority: 4,
    message: 'Formulation outside model target ranges.',
    action: {
      label: 'Set lipid pKa to 6.35',
      run: () => ctx.onAdjustLnpParam?.('lipidPka', 6.35),
    },
    conditionKey,
  };
}

/**
 * Hint #5 (Priority 5): Selected guide has a radical bystander edit and a safer on-target guide exists.
 * Action: Select that guide.
 */
export function checkRadicalBystanderHint(ctx: HintEvaluationContext): Hint | null {
  const selected = ctx.selectedGuide;
  if (!selected || !selected.targetInWindow) return null;
  if (!hasRadicalBystanderEdit(selected)) return null;

  // Search for an on-target candidate without radical bystander edits
  const saferCandidates = ctx.allGuides.filter(
    (g) => g.id !== selected.id && g.targetInWindow && !hasRadicalBystanderEdit(g)
  );

  if (saferCandidates.length === 0) return null;

  // Pick top-ranked safer candidate
  saferCandidates.sort((a, b) => b.CompositeScore - a.CompositeScore);
  const safer = saferCandidates[0];

  return {
    id: 'hint-radical-bystander',
    priority: 5,
    message: `Selected guide ${selected.id} has a radical bystander edit; ${safer.id} covers target without radical edit.`,
    action: {
      label: `Select ${safer.id}`,
      run: () => ctx.onSelectGuide?.(safer.id),
    },
    conditionKey: `safer_guide:${selected.id}:${safer.id}`,
  };
}

/**
 * Hint #6 (Priority 6): On the Batch tab and values are set.
 * Action: Open the dossier / Save PDF.
 * Shows once per preset, and only on the Batch tab.
 */
export function checkBatchDossierHint(ctx: HintEvaluationContext): Hint | null {
  if (ctx.activeTab !== 'batch') return null;
  if (ctx.batchCalculation.totalLipidMassMg <= 0) return null;
  if (ctx.batchDossierDismissedForPreset) return null;

  return {
    id: 'hint-batch-dossier',
    priority: 6,
    message: `Batch formulation calculated: ${ctx.batchCalculation.totalLipidMassMg.toFixed(1)} mg total lipid.`,
    action: {
      label: 'Open Pre-IND dossier',
      run: () => ctx.onOpenDossier?.(),
    },
    conditionKey: `batch_dossier:${ctx.preset.id}`,
  };
}

/**
 * Main pure evaluation function: returns all applicable hints sorted by priority.
 * Returns empty array if Clinical Tour is open.
 */
export function evaluateHints(ctx: HintEvaluationContext): Hint[] {
  // Rule 5: No hints during the Clinical Tour.
  if (ctx.isTourOpen) return [];

  const candidateHints: Array<Hint | null> = [
    checkTargetCoverageHint(ctx),
    checkBackendOfflineHint(ctx),
    checkHlaAllelesHint(ctx),
    checkLnpTargetRangeHint(ctx),
    checkRadicalBystanderHint(ctx),
    checkBatchDossierHint(ctx),
  ];

  return candidateHints
    .filter((h): h is Hint => h !== null)
    .sort((a, b) => a.priority - b.priority);
}
