// src/components/ClinicalTourController.tsx
/**
 * Clinical Walkthrough & Faculty Evaluation Tour Controller.
 * Guides evaluators, faculty (MAKAUT), and visiting scientists through
 * end-to-end therapeutic translation: from pathogenic locus targeting
 * (e.g., Sickle Cell HBB E6V -> HbG-Makassar, or NTLA-2001 TTR Amyloidosis)
 * to thermodynamic validation, LNP biophysics, HLA de-immunization, and CMC batch dosing.
 *
 * Author: Arunabha Ghosh (MAKAUT)
 * License: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  X,
  Sparkles,
  ArrowRight,
  Minimize2,
  Maximize2,
  Award,
} from 'lucide-react';
import type {
  BaseEditorType,
  DashboardTab,
  LnpFormulation,
  PamVariant,
  ThermodynamicProfile,
} from '../engines/types';
import type { InstitutionalProfile } from '../engines/institutionProfile';
import { computeTourFacts, TOUR_CASES, type TourCaseId } from '../engines/tourFacts';
import { buildTourSteps } from '../engines/tourScript';

export type CaseStudyId = TourCaseId;

// The words and numbers of each step live in engines/tourScript.ts.

export interface TourTargetSettings {
  presetId: string;
  /** null keeps the preset's own editor */
  editor: BaseEditorType | null;
  /** null keeps the preset's own PAM variant */
  pam: PamVariant | null;
  /** Guide to select by id; null selects the top-ranked one */
  guideId: string | null;
}

interface ClinicalTourControllerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: CaseStudyId;
  onSelectCase: (caseId: CaseStudyId) => void;
  currentTab: DashboardTab;
  onNavigateTab: (tab: DashboardTab) => void;
  /** Loads the preset, applies the tour's editor and PAM, and selects the guide */
  onApplyTargetSettings: (settings: TourTargetSettings) => void;
  onApplyFormulation: (form: LnpFormulation) => void;
  /** Selects exactly these HLA alleles and switches on the substitutions for them */
  onApplyHlaPanel: (alleles: string[]) => void;
  onSetBatchParameters: (volMl: number, concMgMl: number) => void;
  onOpenDossier: () => void;
  /** The Python engine's energies for the lead guide, when the backend answered */
  backendThermo?: ThermodynamicProfile | null;
  profile?: InstitutionalProfile;
}

export const ClinicalTourController: React.FC<ClinicalTourControllerProps> = ({
  isOpen,
  onClose,
  activeCase,
  onSelectCase,
  onNavigateTab,
  onApplyTargetSettings,
  onApplyFormulation,
  onApplyHlaPanel,
  onSetBatchParameters,
  onOpenDossier,
  backendThermo = null,
  profile,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(14);

  // Every number on a step comes from the engines, run on the settings this tour case applies.
  const facts = useMemo(() => computeTourFacts(activeCase), [activeCase]);
  // The backend profile only counts when it is for the lead guide's spacer
  const matchingBackendThermo =
    backendThermo && facts.guides.lead && backendThermo.spacer === facts.guides.lead.spacer
      ? backendThermo
      : null;
  const currentSteps = useMemo(
    () => buildTourSteps(activeCase, facts, matchingBackendThermo),
    [activeCase, facts, matchingBackendThermo]
  );
  const step = currentSteps[currentStepIdx] || currentSteps[0];

  // Run what a step's button does. The settings come from the same TOUR_CASES the numbers were computed from.
  const runStepAction = (idx: number) => {
    const target = currentSteps[idx];
    if (!target) return;
    const { tourCase } = facts;
    switch (target.actionKind) {
      case 'load-target':
        onApplyTargetSettings({
          presetId: tourCase.presetId,
          editor: tourCase.editor,
          pam: tourCase.pam,
          guideId: null,
        });
        break;
      case 'select-guide':
        onApplyTargetSettings({
          presetId: tourCase.presetId,
          editor: tourCase.editor,
          pam: tourCase.pam,
          guideId: facts.guides.lead?.id ?? null,
        });
        break;
      case 'load-formulation':
        onApplyFormulation(tourCase.formulation);
        break;
      case 'load-hla-panel':
        onApplyHlaPanel(tourCase.hlaAlleles);
        break;
      case 'open-dossier':
        onSetBatchParameters(tourCase.batch.volumeMl, tourCase.batch.mrnaMgPerMl);
        onOpenDossier();
        break;
      case 'show':
        onNavigateTab(target.tab);
        break;
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying && isOpen) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleNext();
            return 14;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, isOpen, currentStepIdx, currentSteps.length]);

  // Go to a step: switch tab, then run its action
  const executeStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setCountdown(14);
    const target = currentSteps[idx];
    if (target) {
      onNavigateTab(target.tab);
      runStepAction(idx);
    }
  };

  const handleNext = () => {
    if (currentStepIdx < currentSteps.length - 1) {
      executeStep(currentStepIdx + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      executeStep(currentStepIdx - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Clinical Walkthrough Tour Controller"
      className={`no-print fixed z-40 transition-all duration-300 ${
        isMinimized
          ? 'bottom-4 right-4 w-72'
          : 'bottom-4 right-4 sm:right-6 w-[94vw] sm:w-[480px] max-w-[500px]'
      }`}
    >
      <div className="bg-[#181613] border-2 border-[#cfa052]/80 rounded-[5px] shadow-2xl overflow-hidden flex flex-col backdrop-blur-md">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#12110f] border-b border-[#2e2923]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#cfa052]/15 text-[#cfa052]">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[11px] font-bold text-[#e8dfd1] flex items-center gap-1">
                {profile?.shortCode ? `${profile.shortCode} Clinical Case Tour` : 'Clinical Case Tour'}
                <Award className="w-3 h-3 text-[#cfa052]" />
              </span>
              <span className="text-[9px] text-[#70675c] font-mono-seq">
                Step {step.stepNumber} of {currentSteps.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Case Study Switcher */}
            <select
              value={activeCase}
              onChange={(e) => {
                const newCase = e.target.value as CaseStudyId;
                onSelectCase(newCase);
                setCurrentStepIdx(0);
                const next = TOUR_CASES[newCase];
                onApplyTargetSettings({
                  presetId: next.presetId,
                  editor: next.editor,
                  pam: next.pam,
                  guideId: null,
                });
              }}
              className="bg-[#211e1a] border border-[#332e27] text-[#cfa052] text-[10px] font-mono-seq rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-[#cfa052]"
              title="Switch therapeutic clinical case study"
            >
              <option value="HBB">Case 1: Sickle Cell (HBB)</option>
              <option value="TTR">Case 2: ATTR Amyloid (TTR)</option>
            </select>

            {/* Auto Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 rounded text-[10px] flex items-center gap-0.5 border cursor-pointer transition ${
                isPlaying
                  ? 'bg-[#cfa052]/20 border-[#cfa052] text-[#cfa052]'
                  : 'bg-[#211e1a] border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1]'
              }`}
              title={isPlaying ? `Auto-advance active (${countdown}s)` : 'Start auto-guided tour'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-[#cfa052]" />
                  <span className="font-mono-seq text-[9px]">{countdown}s</span>
                </>
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>

            {/* Minimize / Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#211e1a] transition cursor-pointer"
              title={isMinimized ? 'Expand tour window' : 'Minimize tour'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded text-[#a69b8d] hover:text-[#e8dfd1] hover:bg-[#211e1a] transition cursor-pointer"
              title="Exit clinical walkthrough"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Progress Segmented Indicator */}
        <div className="grid grid-cols-6 gap-1 px-3 pt-2 pb-1 bg-[#151310] border-b border-[#24201b]">
          {currentSteps.map((s, idx) => {
            const isActive = idx === currentStepIdx;
            const isCompleted = idx < currentStepIdx;
            return (
              <button
                key={idx}
                onClick={() => executeStep(idx)}
                className={`h-1.5 rounded-[2px] transition cursor-pointer ${
                  isActive
                    ? 'bg-[#cfa052] shadow-sm'
                    : isCompleted
                    ? 'bg-[#5e946c]'
                    : 'bg-[#24201b] hover:bg-[#332e27]'
                }`}
                title={`Jump to Step ${s.stepNumber}: ${s.title}`}
              />
            );
          })}
        </div>

        {/* Minimized Quick Preview */}
        {isMinimized ? (
          <div className="p-2.5 flex items-center justify-between text-xs bg-[#181613]">
            <span className="font-semibold text-[#e8dfd1] truncate pr-2">
              {step.stepNumber}. {step.title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="p-1 rounded bg-[#211e1a] border border-[#332e27] disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentStepIdx === currentSteps.length - 1}
                className="p-1 rounded bg-[#cfa052] text-[#12110f] font-bold disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Step Card Body */
          <div className="p-3.5 flex flex-col gap-3 bg-[#181613] max-h-[70vh] overflow-y-auto">
            {/* Step Headline & Category */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono-seq text-[#a69b8d] uppercase tracking-wider mb-0.5">
                <span className="text-[#cfa052] font-semibold">{step.category}</span>
                <span className="text-[#70675c]">Module {step.stepNumber} of 6</span>
              </div>
              <h2 className="font-display text-sm font-bold text-[#e8dfd1] tracking-tight">
                {step.headline}
              </h2>
            </div>

            {/* Scientific Narrative */}
            <p className="text-[11px] text-[#a69b8d] leading-relaxed bg-[#12110f] p-2.5 rounded-[3px] border border-[#24201b]">
              {step.narrative}
            </p>

            {/* Key Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-1.5 font-mono-seq text-[10px]">
              {step.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-[2px] bg-[#141210] border border-[#26221c] flex flex-col gap-0.5"
                >
                  <span className="text-[9px] text-[#70675c] uppercase">{m.label}</span>
                  <span className="font-semibold text-[#e8dfd1] text-[10px]">{m.value}</span>
                </div>
              ))}
            </div>

            {/* Action Trigger inside Step */}
            {step.actionLabel && (
              <button
                onClick={() => {
                  onNavigateTab(step.tab);
                  runStepAction(currentStepIdx);
                }}
                className="w-full py-1.5 px-3 text-xs font-semibold rounded-[3px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#cfa052]/50 hover:border-[#cfa052] text-[#e8dfd1] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#cfa052]" />
                <span>{step.actionLabel}</span>
              </button>
            )}

            {/* Footer Navigation Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-[#24201b] text-xs">
              <button
                onClick={handlePrev}
                disabled={currentStepIdx === 0}
                className="px-2.5 py-1 rounded-[3px] bg-[#211e1a] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-[10px] font-mono-seq text-[#70675c]">
                {currentStepIdx + 1} / {currentSteps.length}
              </span>

              {currentStepIdx < currentSteps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-3 py-1 rounded-[3px] bg-[#cfa052] hover:bg-[#dfb163] text-[#12110f] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded-[3px] bg-[#5e946c] hover:bg-[#73a880] text-[#12110f] font-semibold transition cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <span>Complete Tour</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
