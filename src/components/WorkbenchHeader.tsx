// src/components/WorkbenchHeader.tsx
//
// Refined instrument workbench header, quiet hint bar, and stage pipeline strip.
// Adheres strictly to the plan:
// - Status bar: target, editor, PAM, guides on target, backend light, hints on/off.
// - Tool group at the right end: Tour, Calculator, Dossier PDF, Export, Share.
// - Fixed hint line under status bar (settle debounce, 1 hint at a time, +N others, dismiss sticks).
// - Pipeline strip: four numbered stages with live readouts, thin underline for active stage.
// - Mode toggle: Newcomer vs Expert Studio at the far right of stage strip.
// - Removed: "Active mode" text, duplicate "Tour Case Study" button, and tab icons.
// - Amber means "selected" only.

import type { BaseEditorType, DashboardTab, GenePreset, PamVariant } from '../engines/types';
import type { Hint } from '../engines/hints';
import { HintLine } from './HintLine';
import { ToolButton } from './ui/controls';
import { tokens } from '../styles/tokens';
import { Compass, FileText, Download, Check, Share2 } from 'lucide-react';
import './ui/controls.css';

interface WorkbenchHeaderProps {
  // Preset & Sequence Target
  presets: readonly GenePreset[];
  selectedPresetId: string;
  isCustomMode: boolean;
  onSelectPreset: (id: string) => void;
  onSelectCustom: () => void;

  // Telemetry in Status Bar
  editor: BaseEditorType;
  pam: PamVariant;
  onTargetCount: number;

  // Backend Service Indicator
  isBackendOnline: boolean;

  // Hints System
  hintsEnabled: boolean;
  onToggleHints: () => void;
  hints: readonly Hint[];
  onDismissHint: (conditionKey: string) => void;

  // Stage Pipeline Navigation
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  stageReadouts: {
    guidesCount: number;
    diameterNm: number;
    residualHlaRisk: number | null;
    batchMassMg: number;
  };

  // Audience Mode (Far right of stage strip)
  workbenchMode: 'newcomer' | 'expert';
  onSelectMode: (mode: 'newcomer' | 'expert') => void;

  // Right-hand Tool Group Actions
  batchCalcOpen: boolean;
  onOpenBatchCalculator: () => void;
  onOpenDossier: () => void;
  onStartTour: () => void;
  onExportFasta: () => void;
  fastaSaved: boolean;
  onExportReport: () => void;
  reportSaved: boolean;
  onShareConfig: () => void;
  shareCopied: boolean;

  isDossierModalOpen?: boolean;
}

const shortEditor = (editor: string): string => editor.split(' (')[0];

export function WorkbenchHeader({
  presets,
  selectedPresetId,
  isCustomMode,
  onSelectPreset,
  onSelectCustom,
  editor,
  pam,
  onTargetCount,
  isBackendOnline,
  hintsEnabled,
  onToggleHints,
  hints,
  onDismissHint,
  activeTab,
  onSelectTab,
  stageReadouts,
  workbenchMode,
  onSelectMode,
  batchCalcOpen,
  onOpenBatchCalculator,
  onOpenDossier,
  onStartTour,
  onExportFasta,
  fastaSaved,
  onExportReport,
  reportSaved,
  onShareConfig,
  shareCopied,
  isDossierModalOpen = false,
}: WorkbenchHeaderProps) {
  const stages: ReadonlyArray<{
    id: DashboardTab;
    label: string;
    readout: string | null;
    title: string;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      readout: null,
      title: 'Panoramic overview of all 4 translational pipeline stages',
    },
    {
      id: 'crispr',
      label: '1. Base Editor',
      readout: `${stageReadouts.guidesCount} guides`,
      title: 'Protospacers, bystanders, and BsmBI cloning oligos',
    },
    {
      id: 'lnp',
      label: '2. LNP Biophysics',
      readout: `${stageReadouts.diameterNm} nm`,
      title: 'Lipid nanoparticle formulation, endosomal escape, and SAXS structure',
    },
    {
      id: 'immunology',
      label: '3. ImmunoShield',
      readout: stageReadouts.residualHlaRisk !== null ? `CTL ${stageReadouts.residualHlaRisk}` : 'CTL —',
      title: 'South Asian patient HLA Class I/II de-immunization',
    },
    {
      id: 'batch',
      label: '4. Batch & Dossier',
      readout: `${stageReadouts.batchMassMg.toFixed(1)} mg`,
      title: 'Microfluidic batch mass scaling and regulatory Pre-IND technical dossier',
    },
  ];

  return (
    <header
      className={`border-b border-[#262a2e] flex flex-col shrink-0 select-none ${
        isDossierModalOpen ? 'print:hidden' : ''
      }`}
      style={{ backgroundColor: tokens.colors.surface }}
    >
      {/* 1. Status Bar */}
      <div className="px-4 py-2 border-b border-[#22262a] flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Left Status Cluster: Target, Editor, PAM, Guides on target, Backend, Hints */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 pr-1 border-r border-[#2b3035]">
            <span
              style={{
                backgroundColor: tokens.colors.accent,
                borderRadius: tokens.radius,
              }}
              className="w-2 h-3.5 inline-block shrink-0"
              aria-hidden="true"
            />
            <span className="font-display font-bold text-sm tracking-tight text-[#e8dfd1] whitespace-nowrap">
              NanoCRISPR-3D
            </span>
          </div>

          {/* Target Selector */}
          <div
            role="group"
            aria-label="Target gene preset"
            className="flex items-center p-0.5 rounded-[2px] bg-[#121416] border border-[#2b3035]"
          >
            {presets.map((preset) => {
              const isSelected = !isCustomMode && selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  aria-pressed={isSelected}
                  style={{
                    backgroundColor: isSelected ? '#b88644' : 'transparent',
                    color: isSelected ? '#ffffff' : tokens.colors.textSecondary,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-xs font-medium hover:text-[#e8dfd1] transition cursor-pointer"
                  title={`${preset.symbol}: ${preset.disease}`}
                >
                  {preset.id}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onSelectCustom}
              aria-pressed={isCustomMode}
              style={{
                backgroundColor: isCustomMode ? '#b88644' : 'transparent',
                color: isCustomMode ? '#ffffff' : tokens.colors.textSecondary,
                borderRadius: tokens.radius,
              }}
              className="px-2 py-0.5 text-xs font-medium hover:text-[#e8dfd1] transition cursor-pointer"
              title="User-defined sequence target evaluation"
            >
              Custom
            </button>
          </div>

          {/* Active Editor Telemetry Readout */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#16191c] border border-[#2a2f35] text-[11px]"
            title={`Active base editor: ${editor}`}
          >
            <span className="text-[#70675c] font-mono uppercase text-[9.5px]">Editor</span>
            <span className="font-mono text-[#e8dfd1] font-semibold">{shortEditor(editor)}</span>
          </div>

          {/* Active PAM Telemetry Readout */}
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] bg-[#16191c] border border-[#2a2f35] text-[11px]"
            title={`Active PAM recognition variant: ${pam}`}
          >
            <span className="text-[#70675c] font-mono uppercase text-[9.5px]">PAM</span>
            <span className="font-mono text-[#e8dfd1] font-semibold">{pam}</span>
          </div>

          {/* Guides on Target Live Readout */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-mono ${
              onTargetCount > 0
                ? 'bg-[#18201a] border-[#253928] text-[#73a880]'
                : 'bg-[#201918] border-[#382624] text-[#cc6b5a]'
            }`}
            title={`${onTargetCount} candidate guides place the target base in the editing window`}
          >
            <span className="font-semibold">{onTargetCount}</span>
            <span className="text-[10px] opacity-80">on target</span>
          </div>

          {/* Backend Connection Indicator Light */}
          <div
            className="status-indicator pl-1"
            title={
              isBackendOnline
                ? 'Python biophysical microservice connected (thermodynamic nearest-neighbor & remote APIs active)'
                : 'Python backend offline: analytical in-browser heuristics active'
            }
          >
            <span
              className={`status-dot ${
                isBackendOnline ? 'status-dot--online' : 'status-dot--offline'
              }`}
              aria-hidden="true"
            />
            <span className="text-[11px] text-[#98a1a6]">
              {isBackendOnline ? 'Backend' : 'Offline'}
            </span>
          </div>

          {/* Hints ON / OFF Switch */}
          <button
            type="button"
            onClick={onToggleHints}
            aria-pressed={hintsEnabled}
            title={hintsEnabled ? 'Turn off quiet workbench hints' : 'Turn on quiet workbench hints'}
            className={`ctl-btn h-[22px] px-2 text-[10.5px] font-medium transition cursor-pointer ${
              hintsEnabled
                ? 'text-[#e8dfd1] border-[#3a4046] bg-[#262a2e]'
                : 'text-[#70675c] border-[#22262a] bg-[#141618]'
            }`}
          >
            <span className="text-[#889096] uppercase text-[9.5px] font-mono mr-1">Hints</span>
            <span className={hintsEnabled ? 'text-[#38d399] font-semibold' : 'text-[#70675c]'}>
              {hintsEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Right Tools Cluster: Tour, Calculator, Dossier PDF, Export, Share */}
        <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
          <ToolButton
            icon={<Compass className="w-3.5 h-3.5 text-[#38bdf8]" />}
            onClick={onStartTour}
            title="Start step-by-step clinical walkthrough (sickle cell HBB case)"
          >
            Clinical tour
          </ToolButton>

          <ToolButton
            pressed={batchCalcOpen}
            onClick={onOpenBatchCalculator}
            title={
              activeTab === 'overview'
                ? 'Show or hide wet-lab batch mass calculator'
                : 'Open the Batch tab with the wet-lab batch mass calculator'
            }
          >
            Batch calculator
          </ToolButton>

          <ToolButton
            icon={<FileText className="w-3.5 h-3.5" />}
            onClick={onOpenDossier}
            title="Open Pre-IND regulatory technical dossier (ICH M4Q Module 3 CMC)"
          >
            Pre-IND dossier
          </ToolButton>

          {/* Export Cluster */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Export options">
            <span className="ctl-label" aria-hidden="true">
              Export
            </span>
            <ToolButton
              icon={fastaSaved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              done={fastaSaved}
              onClick={onExportFasta}
              title="Download multi-record FASTA (.fasta): wild-type & edited CDS, polypeptides & protospacer"
            >
              {fastaSaved ? 'FASTA saved' : 'FASTA'}
            </ToolButton>
            <ToolButton
              icon={reportSaved ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              done={reportSaved}
              onClick={onExportReport}
              title="Download Pre-IND evaluation report as Markdown (.md)"
            >
              {reportSaved ? 'Report saved' : 'Report (.md)'}
            </ToolButton>
          </div>

          <ToolButton
            icon={shareCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            done={shareCopied}
            onClick={onShareConfig}
            title={
              isCustomMode
                ? 'Copy share link (custom sequence is evaluated locally)'
                : 'Copy link that restores this target, editor, PAM, guide and formulation'
            }
          >
            {shareCopied ? 'Link copied' : 'Share'}
          </ToolButton>
        </div>
      </div>

      {/* 2. Fixed Single-Line Hint Bar */}
      <HintLine
        hints={hints}
        hintsEnabled={hintsEnabled}
        onDismiss={onDismissHint}
      />

      {/* 3. Pipeline Stage Strip */}
      <nav
        className="px-4 h-[34px] border-t border-[#1e2226] bg-[#16191c] flex items-center justify-between gap-3 overflow-x-auto select-none"
        aria-label="Translational pipeline stages"
      >
        {/* Stages */}
        <div className="flex items-center gap-1 shrink-0">
          {stages.map((stage) => {
            const isActive = activeTab === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => onSelectTab(stage.id)}
                data-active={isActive ? 'true' : 'false'}
                aria-pressed={isActive}
                className="pipeline-stage"
                title={stage.title}
              >
                <span>{stage.label}</span>
                {stage.readout && (
                  <span className="pipeline-stage__badge">{stage.readout}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Audience Mode Switcher: Far right of stage strip */}
        <div
          role="group"
          aria-label="Audience workbench mode"
          className="flex items-center p-0.5 rounded-[2px] bg-[#101214] border border-[#262c32] shrink-0 text-xs"
        >
          <button
            type="button"
            onClick={() => onSelectMode('newcomer')}
            aria-pressed={workbenchMode === 'newcomer'}
            style={{
              backgroundColor: workbenchMode === 'newcomer' ? '#b88644' : 'transparent',
              color: workbenchMode === 'newcomer' ? '#ffffff' : tokens.colors.textSecondary,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 font-medium transition cursor-pointer whitespace-nowrap"
            title="Newcomer Guided Mode: streamlined walkthroughs, educational tips, and clinical presets"
          >
            Newcomer
          </button>
          <button
            type="button"
            onClick={() => onSelectMode('expert')}
            aria-pressed={workbenchMode === 'expert'}
            style={{
              backgroundColor: workbenchMode === 'expert' ? '#b88644' : 'transparent',
              color: workbenchMode === 'expert' ? '#ffffff' : tokens.colors.textSecondary,
              borderRadius: tokens.radius,
            }}
            className="px-2 py-0.5 font-medium transition cursor-pointer whitespace-nowrap"
            title="Expert Studio: unconstrained raw telemetry, custom sequence engineering, and deep biophysical controls"
          >
            Expert Studio
          </button>
        </div>
      </nav>
    </header>
  );
}
