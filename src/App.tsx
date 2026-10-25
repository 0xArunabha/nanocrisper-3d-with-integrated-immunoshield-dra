// src/App.tsx
import { useState, useMemo, useEffect } from 'react';
import {
  GENE_PRESETS,
  BASE_EDITOR_DEFINITIONS,
  PAM_VARIANT_DEFINITIONS,
  balanceCholesterol,
  bioEngineService,
  remoteBioEngineService,
  calculateHlaRiskScore,
  filterEpitopesByHlaAlleles,
  isPreferredPam,
  sanitizeLnpFormulation,
  SOUTH_ASIAN_HLA_ALLELES,
  describeBystanderImpact,
  coverageOptions,
  TOUR_CASES,
  type BaseEditorType,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset,
  type PamVariant,
  type ThermodynamicProfile,
} from './engines/bioEngines';
import { editorFor, toWorkbenchGuide, toWorkbenchSnps } from './engines/crispr/workbenchAdapter';
import { NanoViewport3D } from './components/NanoViewport3D';
import { LnpFormulationPanel } from './components/LnpFormulationPanel';
import { SequenceWorkbench } from './components/SequenceWorkbench';
import { PreIndDossierModal } from './components/PreIndDossierModal';
import { WorkbenchHeader } from './components/WorkbenchHeader';
import { evaluateHints, type HintEvaluationContext } from './engines/hints';
import {
  ClinicalTourController,
  type CaseStudyId,
  type TourTargetSettings,
} from './components/ClinicalTourController';
import { TargetCoverageNotice } from './components/TargetCoverageNotice';
import type { DashboardTab } from './engines/types';
import {
  downloadIdtOrderSheet,
  downloadGenScriptOrderSheet,
} from './engines/crispr/orderSheetGenerator';
import { tokens } from './styles/tokens';
import {
  Download,
  Check,
  Copy,
  FileText,
  Search,
  Globe,
  Sparkles,
  Compass,
  GraduationCap,
  X,
  Info,
  ChevronRight,
} from 'lucide-react';

type SortField = 'id' | 'strand' | 'gcContent' | 'CompositeScore' | 'pam';
type SortOrder = 'asc' | 'desc';

// Helper for classic pigment-coded nucleotides (Adenine, Thymine, Guanine, Cytosine)
const getBaseColorClass = (base: string) => {
  switch (base.toUpperCase()) {
    case 'A':
      return 'text-[#73a880]'; // Vintage Verdigris / Sage
    case 'T':
      return 'text-[#cc6b5a]'; // Terracotta / Vermilion
    case 'G':
      return 'text-[#d4a359]'; // Raw Ochre / Gold
    case 'C':
      return 'text-[#6699a8]'; // Petrol Blue
    default:
      return 'text-[#e8dfd1]';
  }
};

const STORAGE_KEY = 'nanocrispr_workbench_config_v3';

interface SavedWorkbenchConfig {
  presetId?: string;
  isCustom?: boolean;
  editor?: BaseEditorType;
  pam?: PamVariant;
  /** Id of the guide the user picked, for example 'sgRNA-f3'. */
  guideId?: string;
  ionizable?: number;
  dspc?: number;
  peg?: number;
  pka?: number;
  np?: number;
}

/** The formulation a new session starts from, and the fallback for any missing or invalid saved value. */
const DEFAULT_LNP_FORM: LnpFormulation = {
  ionizableLipid: 50.0,
  dspcHelper: 10.0,
  cholesterol: 38.5,
  pegLipid: 1.5,
  lipidPka: 6.35,
  npRatio: 6.0,
};

// A shared link and localStorage are both untrusted input. Object.hasOwn keeps keys such as
// 'constructor' or 'toString' from passing as editor or PAM names and crashing the render.
const isEditorType = (value: unknown): value is BaseEditorType =>
  typeof value === 'string' && Object.hasOwn(BASE_EDITOR_DEFINITIONS, value);

const isPamVariant = (value: unknown): value is PamVariant =>
  typeof value === 'string' && Object.hasOwn(PAM_VARIANT_DEFINITIONS, value);

const isPresetId = (value: unknown): value is string =>
  typeof value === 'string' && GENE_PRESETS.some((preset) => preset.id === value);

/** Guide ids look like 'sgRNA-f12' (forward strand) or 'sgRNA-r3' (reverse strand). */
const isGuideId = (value: unknown): value is string =>
  typeof value === 'string' && /^sgRNA-[fr]\d{1,4}$/.test(value);

/** A finite number from a query-string value or parsed JSON; anything else is dropped. */
const toFiniteNumber = (value: unknown): number | undefined => {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** Keeps only the fields that are valid. Keys are the shared-link parameter names. */
function sanitizeConfig(raw: Record<string, unknown>): SavedWorkbenchConfig {
  const preset = raw.preset;
  const editor = raw.editor;
  const pam = raw.pam;
  const guide = raw.guide;
  const isCustom = preset === 'CUSTOM';
  return {
    presetId: isCustom ? 'CUSTOM' : isPresetId(preset) ? preset : 'HBB',
    isCustom,
    editor: isEditorType(editor) ? editor : undefined,
    pam: isPamVariant(pam) ? pam : undefined,
    guideId: isGuideId(guide) ? guide : undefined,
    ionizable: toFiniteNumber(raw.ionizable),
    dspc: toFiniteNumber(raw.dspc),
    peg: toFiniteNumber(raw.peg),
    pka: toFiniteNumber(raw.pka),
    np: toFiniteNumber(raw.np),
  };
}

function parseUrlOrStorageConfig(): SavedWorkbenchConfig | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const hasUrlParams = ['preset', 'editor', 'pam', 'ionizable'].some((key) => params.has(key));
    if (hasUrlParams) return sanitizeConfig(Object.fromEntries(params));

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed !== null && typeof parsed === 'object') {
        return sanitizeConfig(parsed as Record<string, unknown>);
      }
    }
  } catch (err) {
    console.warn('Could not parse workbench configuration:', err);
  }
  return null;
}


interface NewcomerStageTipProps {
  stage: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  bulletPoints?: string[];
}

function NewcomerStageTip({
  stage,
  title,
  subtitle,
  badgeText,
  bulletPoints,
}: NewcomerStageTipProps) {
  return (
    <div
      style={{
        backgroundColor: '#161411',
        borderColor: '#b88644',
        borderRadius: tokens.radius,
      }}
      className="p-3 border-l-4 border flex flex-col gap-2 shadow-sm"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-[#b88644]/20 text-[#d4a359] border border-[#b88644]/40">
            {stage}
          </span>
          <span className="font-display font-semibold text-xs text-[#e8dfd1] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#d4a359]" />
            {title}
          </span>
        </div>
        {badgeText && (
          <span className="text-[10px] text-[#a69b8d] font-mono-seq">{badgeText}</span>
        )}
      </div>
      <p className="text-[#a69b8d] text-[11px] leading-relaxed">{subtitle}</p>
      {bulletPoints && bulletPoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-[#2a2621]">
          {bulletPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#e8dfd1]">
              <ChevronRight className="w-3.5 h-3.5 text-[#b88644] shrink-0 mt-0.5" />
              <span className="text-[#a69b8d] leading-tight">{point}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// The simulator sorts a formulation into one of four classes with hand-set thresholds (see
// engines/nanotech/lnpSimulator.ts). "Optimal Clinical LNP" is the class name inside the engine; what the person
// sees says only what the rule did.
const STABILITY_LABELS: Record<string, string> = {
  'Optimal Clinical LNP': 'Inside the model\u2019s target ranges',
  'PEG Stealth Dilemma (Low Uptake)': 'PEG above 3.2%: model predicts low uptake',
  'Aggregation Risk (Too Large)': 'Model predicts a large or unstable particle',
  'Poor Endosomal Escape': 'Model predicts poor endosomal escape',
};
const stabilityLabel = (status: string): string => STABILITY_LABELS[status] ?? status;

export default function App() {
  const initialConfig = useMemo(() => parseUrlOrStorageConfig(), []);

  // Preset or Custom Mode
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    () => initialConfig?.isCustom ?? false
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    () =>
      initialConfig?.presetId && initialConfig.presetId !== 'CUSTOM'
        ? initialConfig.presetId
        : 'HBB'
  );
  const [customPreset, setCustomPreset] = useState<GenePreset>({
    id: 'CUSTOM',
    symbol: 'Custom Target',
    name: 'User-Defined Sequence',
    disease: 'Investigational Gene Target',
    targetOrgan: 'Liver',
    editorType: 'ABE8e (A→G)',
    pamVariant: 'SpCas9',
    sequence:
      'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
    mutationIndex: 18,
    sasSnpIndex: 40,
    sasSnpId: 'Novel / Unmapped Variant',
    sasAlleleFreq: 0.05,
    clinicalNote: 'Custom sequence evaluation for protospacer discovery and bystander deamination.',
  });

  // Id of the guide the user picked ('sgRNA-f3'); null means "the top-ranked candidate"
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(
    () => initialConfig?.guideId ?? null
  );

  // Per-epitope stealth mutation state
  const epitopeCatalog = useMemo(() => bioEngineService.getEpitopeHotspots(), []);
  const [activeStealthMutations, setActiveStealthMutations] = useState<Record<string, boolean>>(
    () => Object.fromEntries(epitopeCatalog.map((ep) => [ep.peptide, true]))
  );
  const [selectedHlaAlleles, setSelectedHlaAlleles] = useState<string[]>(() => [
    ...SOUTH_ASIAN_HLA_ALLELES,
  ]);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('printDossier') === 'true' || params.get('dossier') === 'true';
    }
    return false;
  });

  // Dedicated Workflow Stage Mode / Dashboard Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab') as DashboardTab | null;
      if (t && ['overview', 'crispr', 'lnp', 'immunology', 'batch'].includes(t)) return t;
    }
    return 'overview';
  });

  // Dedicated Audience Mode: Newcomer (Guided walkthrough) vs Expert Workbench (Full density)
  const [workbenchMode, setWorkbenchMode] = useState<'newcomer' | 'expert'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'expert') return 'expert';
      if (m === 'newcomer') return 'newcomer';
    }
    return 'newcomer';
  });

  // Newcomer guided banner dismissal state
  const [dismissedNewcomerBanner, setDismissedNewcomerBanner] = useState<boolean>(false);

  // Web Tour for Newcomers (Clinical Walkthrough Controller)
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tour') === 'true';
    }
    return false;
  });
  const [tourCase, setTourCase] = useState<CaseStudyId>('HBB');

  // The tour loads a preset together with the editor and PAM its numbers were computed for
  // (null = the preset's own), then optionally selects a guide by id.
  const applyTourTargetSettings = (settings: TourTargetSettings) => {
    setSelectedPresetId(settings.presetId);
    setIsCustomMode(false);
    setEditorOverride(settings.editor);
    setPamOverride(settings.pam);
    setSelectedGuideId(settings.guideId);
  };

  const startClinicalWalkthrough = (caseId: CaseStudyId = 'HBB') => {
    const tourCaseSettings = TOUR_CASES[caseId];
    setTourCase(caseId);
    applyTourTargetSettings({
      presetId: tourCaseSettings.presetId,
      editor: tourCaseSettings.editor,
      pam: tourCaseSettings.pam,
      guideId: null,
    });
    setIsTourOpen(true);
  };

  // A link with ?tour=true opens the tour on load: apply the first case's settings once so the app
  // shows what step 1 describes.
  useEffect(() => {
    if (!isTourOpen) return;
    const first = TOUR_CASES[tourCase];
    applyTourTargetSettings({
      presetId: first.presetId,
      editor: first.editor,
      pam: first.pam,
      guideId: null,
    });
  }, []);

  // Table filtering and sorting
  const [sortField, setSortField] = useState<SortField>('CompositeScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStrand, setFilterStrand] = useState<'all' | '+' | '-'>('all');
  const [hideSnpCollisions, setHideSnpCollisions] = useState<boolean>(false);
  const [preferredPamOnly, setPreferredPamOnly] = useState<boolean>(false);

  // Copy feedback state for oligos, link share, and FASTA export
  const [copiedOligo, setCopiedOligo] = useState<'fwd' | 'rev' | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [fastaSaved, setFastaSaved] = useState<boolean>(false);
  const [reportSaved, setReportSaved] = useState<boolean>(false);

  // External Biological API & Genomic Search States (Tier 2 Enrichment)
  const [geneSearchQuery, setGeneSearchQuery] = useState<string>('CFTR');
  const [isSearchingGene, setIsSearchingGene] = useState<boolean>(false);
  const [geneSearchError, setGeneSearchError] = useState<string | null>(null);

  const [variantSearchQuery, setVariantSearchQuery] = useState<string>('rs10768683');
  const [isSearchingVariant, setIsSearchingVariant] = useState<boolean>(false);
  const [variantSearchError, setVariantSearchError] = useState<string | null>(null);
  const [variantSearchNote, setVariantSearchNote] = useState<string | null>(null);

  // The Python engine's energies for the selected guide; null when the backend did not answer
  const [backendThermo, setBackendThermo] = useState<ThermodynamicProfile | null>(null);

  // Formulation parameters. A link or saved value outside the slider ranges is clamped, never trusted.
  const [lnpForm, setLnpForm] = useState<LnpFormulation>(() =>
    sanitizeLnpFormulation(
      {
        ionizableLipid: initialConfig?.ionizable,
        dspcHelper: initialConfig?.dspc,
        pegLipid: initialConfig?.peg,
        lipidPka: initialConfig?.pka,
        npRatio: initialConfig?.np,
      },
      DEFAULT_LNP_FORM
    )
  );

  // Wet-lab batch calculator parameters
  const [batchVolumeMl, setBatchVolumeMl] = useState<number>(10.0);
  const [batchMrnaConcMgMl, setBatchMrnaConcMgMl] = useState<number>(1.0);
  const [showBatchCalc, setShowBatchCalc] = useState<boolean>(false);

  // Editor and PAM variant overrides (allows switching architecture for presets)
  const [editorOverride, setEditorOverride] = useState<BaseEditorType | null>(
    () => initialConfig?.editor ?? null
  );
  const [pamOverride, setPamOverride] = useState<PamVariant | null>(
    () => initialConfig?.pam ?? null
  );

  // Active target preset
  const basePreset = useMemo(() => {
    if (isCustomMode) return customPreset;
    return GENE_PRESETS.find((p) => p.id === selectedPresetId) || GENE_PRESETS[0];
  }, [isCustomMode, customPreset, selectedPresetId]);

  const activePreset: GenePreset = useMemo(() => {
    return {
      ...basePreset,
      editorType: editorOverride ?? basePreset.editorType,
      pamVariant: pamOverride ?? basePreset.pamVariant ?? 'SpCas9',
    };
  }, [basePreset, editorOverride, pamOverride]);

  const activeEditorDefinition = BASE_EDITOR_DEFINITIONS[activePreset.editorType];
  const activePamVariant = activePreset.pamVariant ?? 'SpCas9';
  const activePamDefinition = PAM_VARIANT_DEFINITIONS[activePamVariant];
  const editorWindowLabel = `${activeEditorDefinition.editingWindow[0]}–${activeEditorDefinition.editingWindow[1]}`;

  // Dual-strand guide candidates via bioEngineService
  const allGuides = useMemo(() => bioEngineService.scanGuides(activePreset), [activePreset]);

  // Filtered and sorted guides
  const processedGuides = useMemo(() => {
    return allGuides
      .filter((g) => {
        if (filterStrand !== 'all' && g.strand !== filterStrand) return false;
        if (hideSnpCollisions && g.hasSasSnpCollision) return false;
        if (preferredPamOnly && !isPreferredPam(g.pam, activePamVariant)) return false;
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [
    allGuides,
    filterStrand,
    hideSnpCollisions,
    preferredPamOnly,
    activePamVariant,
    sortField,
    sortOrder,
  ]);

  // The selection is kept by id, so sorting and filtering never move it. When the picked guide is
  // filtered out, or a new editor / PAM changes the candidate set, the top-ranked guide takes over.
  const selectedGuide: GuideCandidate | undefined =
    processedGuides.find((g) => g.id === selectedGuideId) ?? processedGuides[0] ?? allGuides[0];

  // What SequenceWorkbench draws, derived from the engine's own editor and guide definitions
  const workbenchEditor = useMemo(() => editorFor(activePreset), [activePreset]);
  const workbenchGuides = useMemo(() => processedGuides.map(toWorkbenchGuide), [processedGuides]);
  const workbenchSnps = useMemo(() => toWorkbenchSnps(activePreset), [activePreset]);

  // The bystander table is computed in the browser from each edit's consequence and its Grantham distance
  // (see engines/crispr/bystanderImpact.ts), so it needs no backend and makes no ClinVar claim.

  // Does any candidate cover the target base? If not, say so and list the settings that do.
  const hasOnTargetGuide = allGuides.some((guide) => guide.targetInWindow);
  const targetCoverage = useMemo(
    () => (hasOnTargetGuide ? [] : coverageOptions(activePreset)),
    [hasOnTargetGuide, activePreset]
  );

  // Ask the Python engine for the selected guide's full energy profile (adds the hairpin fold and the
  // homodimer check). When it does not answer, the browser estimate stays in use.
  const selectedSpacer = selectedGuide?.spacer ?? null;
  useEffect(() => {
    setBackendThermo(null);
    if (!selectedSpacer) return;
    let isCurrent = true;
    remoteBioEngineService
      .fetchThermodynamics(selectedSpacer)
      .then((profile) => {
        if (isCurrent && profile) setBackendThermo({ ...profile, source: 'backend' });
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [selectedSpacer]);

  const handleEnsemblGeneSearch = async (symbolToSearch?: string) => {
    const sym = (symbolToSearch || geneSearchQuery).trim().toUpperCase();
    if (!sym) return;
    setIsSearchingGene(true);
    setGeneSearchError(null);
    try {
      const result = await remoteBioEngineService.fetchExternalGene(sym);
      if (result && !result.error && result.sequence) {
        const targetIndex = Math.min(21, Math.max(0, result.sequence.length - 1));
        setCustomPreset({
          id: result.id || sym,
          symbol: result.symbol || `${sym} (Ensembl GRCh38)`,
          name: result.name || `${sym} Gene Target`,
          disease: result.disease || `Investigational Target (${sym})`,
          targetOrgan: result.targetOrgan || 'Liver',
          editorType: result.editorType || 'ABE8e (A→G)',
          pamVariant: result.pamVariant || 'SpCas9',
          sequence: result.sequence,
          mutationIndex: targetIndex,
          sasSnpIndex: Math.min(42, Math.max(0, result.sequence.length - 1)),
          // The backend returns a fixed target position, a fixed SNP position and a 5% frequency for any
          // gene. They are placeholders, and the note says so wherever it is shown.
          sasSnpId: 'placeholder (not a real SNP)',
          sasAlleleFreq: result.sasAlleleFreq ?? 0.05,
          clinicalNote: `${result.clinicalNote || `Ensembl annotation for ${sym}.`} Placeholders, not data: the target base (position ${targetIndex + 1}), the SNP position and the 5% SNP frequency are fixed values. Only the first ${result.sequence.length} nt of the coding sequence is loaded.`,
        });
        setIsCustomMode(true);
        setSelectedGuideId(null);
      } else {
        setGeneSearchError(result?.error || `Gene '${sym}' not found in Ensembl GRCh38 database.`);
      }
    } catch (err: any) {
      setGeneSearchError(err?.message || 'Failed to query Ensembl REST API.');
    } finally {
      setIsSearchingGene(false);
    }
  };

  const handleVariantSearch = async () => {
    const vid = variantSearchQuery.trim();
    if (!vid) return;
    setIsSearchingVariant(true);
    setVariantSearchError(null);
    setVariantSearchNote(null);
    try {
      const res = await remoteBioEngineService.fetchExternalVariant(vid);
      if (!res) {
        setVariantSearchError('The backend did not answer, so nothing was looked up.');
      } else if (res._source === 'unmapped') {
        setVariantSearchError(`${res.variantId} was not found in Ensembl. No frequency was applied.`);
      } else if (res._source === 'fallback') {
        setVariantSearchError('The backend could not reach Ensembl. No frequency was applied.');
      } else {
        const where = res._source === 'cached' ? 'cached Ensembl answer' : 'live Ensembl answer';
        const freq = res.sasFrequency;
        const scope = isCustomMode ? '' : ' It applies to the custom target, not the preset shown.';
        if (typeof freq === 'number' && freq > 0) {
          const significance = (res.clinicalSignificance ?? []).join(', ') || 'no clinical significance listed';
          setCustomPreset((prev) => ({
            ...prev,
            sasSnpId: res.variantId,
            sasAlleleFreq: freq,
            clinicalNote: `${prev.clinicalNote.replace(/ \[variant [^\]]*\]$/, '')} [variant ${res.variantId}: ${significance}]`,
          }));
          setVariantSearchNote(
            `${res.variantId}: South Asian frequency ${(freq * 100).toFixed(1)}% (${where}).${scope}`
          );
        } else {
          setVariantSearchNote(
            `${res.variantId} is in Ensembl (${where}) but lists no South Asian frequency. The current value was left unchanged.`
          );
        }
      }
    } catch (err: any) {
      setVariantSearchError(err?.message || 'Variant lookup failed.');
    } finally {
      setIsSearchingVariant(false);
    }
  };

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return bioEngineService.generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Cholesterol is not a control: it takes whatever is left of 100 mol% (never below 5).
  const effectiveCholesterol = balanceCholesterol(lnpForm);

  const activeFormulation = useMemo<LnpFormulation>(
    () => ({
      ...lnpForm,
      cholesterol: effectiveCholesterol,
    }),
    [lnpForm, effectiveCholesterol]
  );

  const biophysics = useMemo(
    () => bioEngineService.simulateLnpBiophysics(activeFormulation),
    [activeFormulation]
  );
  const batchCalculation = useMemo(
    () =>
      bioEngineService.calculateBatchMasses(
        activeFormulation,
        batchVolumeMl,
        batchMrnaConcMgMl
      ),
    [activeFormulation, batchVolumeMl, batchMrnaConcMgMl]
  );

  const wildTypeProtein = useMemo(
    () => bioEngineService.translateSequence(activePreset.sequence),
    [activePreset.sequence]
  );

  // ImmunoShield residual HLA risk calculation, scoped to patient-selected alleles.
  const patientRelevantEpitopes = useMemo(
    () => filterEpitopesByHlaAlleles(selectedHlaAlleles, epitopeCatalog),
    [selectedHlaAlleles, epitopeCatalog]
  );
  const hasPatientHlaSelection = selectedHlaAlleles.length > 0;
  const allStealthEnabled = useMemo(
    () =>
      patientRelevantEpitopes.length > 0 &&
      patientRelevantEpitopes.every((ep) => activeStealthMutations[ep.peptide]),
    [patientRelevantEpitopes, activeStealthMutations]
  );

  const residualHlaRisk = useMemo(() => {
    if (!hasPatientHlaSelection) return null;
    return calculateHlaRiskScore(patientRelevantEpitopes, activeStealthMutations);
  }, [hasPatientHlaSelection, patientRelevantEpitopes, activeStealthMutations]);

  // URL query & localStorage persistence. Both use the same keys as the shared link.
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      params.set('preset', isCustomMode ? 'CUSTOM' : selectedPresetId);
      if (editorOverride) params.set('editor', editorOverride);
      if (pamOverride) params.set('pam', pamOverride);
      if (selectedGuideId) params.set('guide', selectedGuideId);
      params.set('ionizable', lnpForm.ionizableLipid.toString());
      params.set('dspc', lnpForm.dspcHelper.toString());
      params.set('peg', lnpForm.pegLipid.toString());
      params.set('pka', lnpForm.lipidPka.toString());
      params.set('np', lnpForm.npRatio.toString());

      localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(params)));
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    } catch {
      // ignore in restricted browser environments
    }
  }, [
    isCustomMode,
    selectedPresetId,
    editorOverride,
    pamOverride,
    selectedGuideId,
    lnpForm.ionizableLipid,
    lnpForm.dspcHelper,
    lnpForm.pegLipid,
    lnpForm.lipidPka,
    lnpForm.npRatio,
  ]);

  const toggleAllStealth = () => {
    if (patientRelevantEpitopes.length === 0) return;
    const nextState = !allStealthEnabled;
    setActiveStealthMutations((previous) => ({
      ...previous,
      ...Object.fromEntries(patientRelevantEpitopes.map((ep) => [ep.peptide, nextState])),
    }));
  };

  const toggleSingleEpitope = (peptide: string) => {
    setActiveStealthMutations((prev) => ({
      ...prev,
      [peptide]: !prev[peptide],
    }));
  };

  const togglePatientHlaAllele = (allele: string) => {
    setSelectedHlaAlleles((previous) =>
      previous.includes(allele)
        ? previous.filter((selected) => selected !== allele)
        : [...previous, allele]
    );
  };

  // Tour step: select exactly these HLA alleles and switch on the substitutions that apply to them
  const applyTourHlaPanel = (alleles: string[]) => {
    setSelectedHlaAlleles(alleles);
    const relevant = filterEpitopesByHlaAlleles(alleles, epitopeCatalog);
    setActiveStealthMutations((previous) => ({
      ...previous,
      ...Object.fromEntries(relevant.map((ep) => [ep.peptide, true])),
    }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCopyOligo = (text: string, type: 'fwd' | 'rev') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedOligo(type);
      setTimeout(() => setCopiedOligo(null), 1800);
    }).catch((err) => {
      console.warn('Oligo clipboard copy failed:', err);
    });
  };

  const handleShareConfig = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.warn('Share config URL copy failed:', err);
    }
  };

  // Top-level multi-record FASTA export
  const handleExportTopFasta = () => {
    const numCodons = Math.ceil(activePreset.sequence.length / 3);
    const codonDiffMap = new Map<number, { editedCodon: string; editedAA: string }>();
    if (selectedGuide) {
      for (const edit of selectedGuide.bystanders) {
        const cIdx = Math.floor(edit.genomicIndex / 3);
        if (
          !codonDiffMap.has(cIdx) ||
          edit.classification === 'Target Edit' ||
          edit.classification === 'Nonsense (Premature Stop)'
        ) {
          codonDiffMap.set(cIdx, {
            editedCodon: edit.editedCodon,
            editedAA: edit.editedAA,
          });
        }
      }
    }

    const cdsCodons: string[] = [];
    const aaChars: string[] = [];
    for (let cIdx = 0; cIdx < numCodons; cIdx++) {
      const wtCodon = activePreset.sequence.slice(cIdx * 3, cIdx * 3 + 3);
      const wtAA = wildTypeProtein[cIdx] || '';
      const diff = codonDiffMap.get(cIdx);
      if (diff) {
        cdsCodons.push(diff.editedCodon);
        aaChars.push(diff.editedAA);
      } else {
        cdsCodons.push(wtCodon);
        aaChars.push(wtAA);
      }
    }

    const coEditedCds = cdsCodons.join('');
    const editedProtein = aaChars.join('');

    const guideHeader = selectedGuide
      ? `\n>${activePreset.id}_${selectedGuide.id}_Spacer_${selectedGuide.strand}Strand_PAM_${selectedGuide.pam}\n${selectedGuide.spacer}`
      : '';

    const fastaContent = `>${activePreset.id}_WildType_CDS | ${activePreset.name} (${activePreset.disease})
${activePreset.sequence}
>${activePreset.id}_CoEdited_CDS | Editor=${activePreset.editorType} Guide=${selectedGuide?.id ?? 'None'}
${coEditedCds}
>${activePreset.id}_WildType_Protein | Frame=+1 (${wildTypeProtein.length} aa)
${wildTypeProtein}
>${activePreset.id}_CoEdited_Protein | Editor=${activePreset.editorType} Guide=${selectedGuide?.id ?? 'None'}
${editedProtein}${guideHeader}
`;

    const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePreset.id.toLowerCase()}_${selectedGuide?.id ?? 'locus'}.fasta`;
    a.click();
    URL.revokeObjectURL(url);

    setFastaSaved(true);
    setTimeout(() => setFastaSaved(false), 2000);
  };

  // Ready-to-Order Commercial Oligo Sheet Downloads (IDT and GenScript CSVs)
  const handleDownloadIdt = (all: boolean = false) => {
    if (processedGuides.length === 0) return;
    const guidesToExport = all
      ? processedGuides
      : selectedGuide
      ? [selectedGuide]
      : [processedGuides[0]];
    downloadIdtOrderSheet(guidesToExport, activePreset, !all);
  };

  const handleDownloadGenScript = (all: boolean = false) => {
    if (processedGuides.length === 0) return;
    const guidesToExport = all
      ? processedGuides
      : selectedGuide
      ? [selectedGuide]
      : [processedGuides[0]];
    downloadGenScriptOrderSheet(guidesToExport, activePreset, !all);
  };

  // The inline calculator lives on the overview tab. From any other tab the header button opens the Batch tab instead.
  const batchCalcOpen = activeTab === 'batch' || (activeTab === 'overview' && showBatchCalc);
  const openBatchCalculator = () => {
    if (activeTab === 'overview') setShowBatchCalc((open) => !open);
    else setActiveTab('batch');
  };

  // Export regulatory pre-IND summary in Markdown format
  const downloadDraDossier = () => {
    const codonAuditRows =
      selectedGuide && selectedGuide.bystanders.length > 0
        ? selectedGuide.bystanders
            .map(
              (b) =>
                `| Pos ${b.guidePos} | bp ${b.genomicIndex + 1} | \`${b.originalCodon}\` (${b.originalAA}) | \`${b.editedCodon}\` (${b.editedAA}) | ${b.classification} |`
            )
            .join('\n')
        : `| — | — | — | — | No editable bases in window ${editorWindowLabel} |`;

    const epitopeRows = hasPatientHlaSelection
      ? patientRelevantEpitopes
          .map((ep) => {
            const isShielded = activeStealthMutations[ep.peptide];
            return `| \`${ep.peptide}\` | ${ep.residueRange} | ${ep.domain} | ${ep.hlaAllele} | ${
              isShielded ? '<10 / 100' : `${ep.bindingScore} / 100`
            } | ${isShielded ? ep.stealthMutation : 'Wild-type (Unmodified)'} |`;
          })
          .join('\n')
      : '| — | — | — | No patient HLA alleles selected | Not assessed | — |';

    const content = `# Pre-IND CMC and Preclinical Evaluation Report
Generated by NanoCRISPR-3D Evaluation Workbench

## 1. Target Locus and Genome Editing Strategy
- Gene symbol: ${activePreset.symbol}
- Gene name: ${activePreset.name}
- Clinical indication: ${activePreset.disease}
- Target tissue: ${activePreset.targetOrgan}
- Base editor architecture: ${activePreset.editorType}
- Deaminase activity window: positions ${editorWindowLabel}
- Cas9 PAM-recognition variant: ${activePamDefinition.label} (${activePamDefinition.recognition})
- Clinical rationale: ${activePreset.clinicalNote}
- Selected protospacer: ${selectedGuide?.id || 'sgRNA-1'} (5'-${selectedGuide?.spacer || ''}-3')
- Target strand: ${selectedGuide?.strand === '+' ? 'Sense (+)' : 'Antisense (-)'}
- PAM: ${selectedGuide?.pam || ''}
- Protospacer on-target score: ${selectedGuide?.CompositeScore || 0} / 100
- Assessment verdict: ${selectedGuide?.verdict || 'N/A'}
- South Asian population variant: ${
      selectedGuide?.hasSasSnpCollision
        ? 'Overlaps the SNP marker ' + activePreset.sasSnpId
        : 'No overlap with the one SNP marker checked (' +
          activePreset.sasSnpId +
          ', frequency ' +
          (activePreset.sasAlleleFreq * 100).toFixed(1) +
          '% as entered in the preset or looked up; not verified here). Other SAS variants were not checked.'
    }

### Deaminase Window (Positions ${editorWindowLabel}) Codon Consequence Audit
| Guide Pos | Genomic Index | Original Codon | Edited Codon | Consequence Classification |
| :--- | :--- | :--- | :--- | :--- |
${codonAuditRows}

### Golden Gate Oligonucleotide Synthesis Order Sheet
- Enzyme overhang standard: ${cloningOligos?.overhangSystem || 'BsmBI / BpiI'}
- Forward cloning oligo: ${cloningOligos?.forwardOligo || ''}
- Reverse cloning oligo: ${cloningOligos?.reverseOligo || ''}

## 2. Lipid Nanoparticle Formulation and Biophysics
- Basis of the numbers below: ionization at a given pH is the Henderson-Hasselbalch value. Size, PDI, zeta potential, uptake, escape and organ split come from empirical surrogate formulas in this app, not from measurements; confirm them by DLS, ELS and in vivo work.
- Molar composition: ${activeFormulation.ionizableLipid}% ionizable lipid : ${activeFormulation.dspcHelper}% DSPC : ${activeFormulation.cholesterol}% cholesterol : ${activeFormulation.pegLipid}% PEG-lipid
- Ionizable lipid apparent pKa: ${activeFormulation.lipidPka}
- Amine-to-phosphate (N/P) ratio: ${activeFormulation.npRatio}
- Hydrodynamic diameter (Dh): ${biophysics.diameterNm} nm
- Polydispersity index (PDI): ${biophysics.pdi}
- Zeta potential (pH 7.4): ${biophysics.zetaPotentialMv} mV
- Protonation fraction (endosomal pH 5.5): ${biophysics.endosomalProtonationPct}%
- Protonation fraction (blood pH 7.4): ${biophysics.bloodProtonationPct}%
- Endosomal escape efficiency: ${biophysics.endosomalEscapeEfficiency}%
- De Gennes polymer brush ratio (RF/D): ${
      biophysics.deGennesRfOverD
        ? `${biophysics.deGennesRfOverD} (${biophysics.deGennesRfOverD >= 1.0 ? 'Dense Brush' : 'Mushroom'})`
        : 'N/A'
    }
- Critical Packing Parameter (CPP at pH 5.5): ${
      biophysics.criticalPackingParam
        ? `${biophysics.criticalPackingParam} (${biophysics.criticalPackingParam >= 1.45 ? 'Inverted Hexagonal HII' : 'Lamellar La'})`
        : 'N/A'
    }
- SAXS Bragg q1 repeat spacing (dSAXS): ${
      biophysics.saxsBraggSpacingNm ? `${biophysics.saxsBraggSpacingNm} nm` : 'N/A'
    }
- Predicted organ biodistribution: Liver ${biophysics.organTropism.liver}% | Spleen ${biophysics.organTropism.spleen}% | Lungs ${biophysics.organTropism.lungs}%
- Model classification: ${stabilityLabel(biophysics.stabilityStatus)}

## 3. Wet-Lab Batch Preparation Mass Scale (${batchVolumeMl} mL at ${batchMrnaConcMgMl} mg/mL mRNA)
- Total mRNA to weigh: ${batchCalculation.totalMrnaMassMg} mg
- Total lipids to weigh: ${batchCalculation.totalLipidMassMg} mg (Lipid:mRNA ratio ${(
      batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg
    ).toFixed(1)}:1 w/w)
${batchCalculation.components.map((c) => `- ${c.name}: ${c.massMg} mg (${c.molarConcMm} mM)`).join('\n')}

## 4. Immunogenicity and De-immunization Profile (ImmunoShield-DRA)
- Patient-selected HLA alleles: ${
      hasPatientHlaSelection ? selectedHlaAlleles.join(', ') : 'Not selected (risk not assessed)'
    }
- Composite residual HLA risk score: ${residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
- Catalytic residue integrity (D10 / H840): Intact
- Interpretation: illustrative curated-panel heuristic; not a clinical HLA-binding prediction.

| Epitope Peptide | Residues | Domain | South Asian HLA Allele | Residual Risk | Active Engineering Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
${epitopeRows}
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre_ind_evaluation_${activePreset.id.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setReportSaved(true);
    setTimeout(() => setReportSaved(false), 2000);
  };

  const getVerdictStatusColor = (verdict: GuideCandidate['verdict']) => {
    if (verdict.includes('Optimal') || verdict.includes('Safe')) {
      return tokens.colors.status.success;
    }
    if (verdict.includes('Risk')) {
      return tokens.colors.status.danger;
    }
    return tokens.colors.status.warning;
  };

  // Backend connection status
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  useEffect(() => {
    let isCurrent = true;
    remoteBioEngineService
      .checkHealth()
      .then((online) => {
        if (isCurrent) setIsBackendOnline(online);
      })
      .catch(() => {
        if (isCurrent) setIsBackendOnline(false);
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  // Quiet workbench hints: on by default, single line under status bar, settle debounce of 1.5s
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('hints') === 'off' || p.get('hints') === 'false') return false;
    }
    return true;
  });
  const [dismissedConditionKeys, setDismissedConditionKeys] = useState<Set<string>>(() => new Set());
  const [settledContext, setSettledContext] = useState<HintEvaluationContext | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettledContext({
        preset: activePreset,
        editor: activePreset.editorType,
        pam: activePamVariant,
        allGuides,
        selectedGuide,
        activeTab,
        isTourOpen,
        isBackendOnline,
        hasBackendOnlyValueOnScreen: activeTab === 'crispr' || activeTab === 'overview',
        backendDismissedThisSession: dismissedConditionKeys.has('backend_offline_session'),
        selectedHlaAlleles,
        formulation: activeFormulation,
        biophysics,
        batchCalculation,
        batchDossierDismissedForPreset: dismissedConditionKeys.has(`batch_dossier:${activePreset.id}`),
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    activePreset,
    activePamVariant,
    allGuides,
    selectedGuide,
    activeTab,
    isTourOpen,
    isBackendOnline,
    selectedHlaAlleles,
    activeFormulation,
    biophysics,
    batchCalculation,
    dismissedConditionKeys,
  ]);

  const activeHints = useMemo(() => {
    if (!hintsEnabled || !settledContext) return [];
    const evaluated = evaluateHints({
      ...settledContext,
      onApplyEditorPam: (editor, pam) => {
        setEditorOverride(editor);
        setPamOverride(pam);
      },
      onSelectHlaPanel: () => {
        applyTourHlaPanel([...SOUTH_ASIAN_HLA_ALLELES]);
      },
      onAdjustLnpParam: (param, value) => {
        setLnpForm((prev) => ({ ...prev, [param]: value }));
      },
      onSelectGuide: (guideId) => {
        setSelectedGuideId(guideId);
      },
      onOpenDossier: () => {
        setIsDossierModalOpen(true);
      },
    });
    return evaluated.filter((h) => !dismissedConditionKeys.has(h.conditionKey));
  }, [hintsEnabled, settledContext, dismissedConditionKeys, applyTourHlaPanel]);

  const handleDismissHint = (conditionKey: string) => {
    setDismissedConditionKeys((prev) => {
      const next = new Set(prev);
      next.add(conditionKey);
      return next;
    });
  };

  const onTargetGuidesCount = useMemo(
    () => allGuides.filter((g) => g.targetInWindow).length,
    [allGuides]
  );

  return (
    <div
      style={{
        backgroundColor: tokens.colors.canvas,
        color: tokens.colors.textPrimary,
        fontFamily: tokens.typography.fontSans,
      }}
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#4d828f]/30 selection:text-[#e8dfd1]"
    >
      {/* Workbench Header: Status Bar, Quiet Hint Line, and Stage Strip */}
      <WorkbenchHeader
        presets={GENE_PRESETS}
        selectedPresetId={selectedPresetId}
        isCustomMode={isCustomMode}
        onSelectPreset={(id) => {
          setSelectedPresetId(id);
          setIsCustomMode(false);
          setEditorOverride(null);
          setPamOverride(null);
          setSelectedGuideId(null);
        }}
        onSelectCustom={() => {
          setIsCustomMode(true);
          setSelectedGuideId(null);
        }}
        editor={activePreset.editorType}
        pam={activePamVariant}
        onTargetCount={onTargetGuidesCount}
        isBackendOnline={isBackendOnline}
        hintsEnabled={hintsEnabled}
        onToggleHints={() => setHintsEnabled((prev) => !prev)}
        hints={activeHints}
        onDismissHint={handleDismissHint}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        stageReadouts={{
          guidesCount: processedGuides.length,
          diameterNm: biophysics.diameterNm,
          residualHlaRisk,
          batchMassMg: batchCalculation.totalLipidMassMg,
        }}
        workbenchMode={workbenchMode}
        onSelectMode={(mode) => setWorkbenchMode(mode)}
        batchCalcOpen={batchCalcOpen}
        onOpenBatchCalculator={openBatchCalculator}
        onOpenDossier={() => setIsDossierModalOpen(true)}
        onStartTour={() => startClinicalWalkthrough('HBB')}
        onExportFasta={handleExportTopFasta}
        fastaSaved={fastaSaved}
        onExportReport={downloadDraDossier}
        reportSaved={reportSaved}
        onShareConfig={handleShareConfig}
        shareCopied={shareCopied}
        isDossierModalOpen={isDossierModalOpen}
      />

      {/* Newcomer Onboarding Guidance Banner */}
      {workbenchMode === 'newcomer' && !dismissedNewcomerBanner && (
        <div
          style={{
            backgroundColor: '#161411',
            borderColor: '#b88644',
            borderRadius: tokens.radius,
          }}
          className="mx-4 mt-3 p-3.5 border-l-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-md"
        >
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-[3px] bg-[#b88644]/20 border border-[#b88644]/40 text-[#d4a359] flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xs text-[#e8dfd1]">
                  Newcomer Guide: Translational Nanomedicine &amp; Precision Base Editing
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#24201b] text-[#d4a359] border border-[#3a342c] font-medium">
                  Dedicated Newcomer Mode Active
                </span>
              </div>
              <p className="text-[#a69b8d] text-[11px] leading-relaxed">
                Welcome to NanoCRISPR-3D! This platform bridges 4 translational pillars: <strong>(1) Precision CRISPR base editing</strong> without double-strand DNA breaks, <strong>(2) Biophysical lipid nanoparticle (LNP) delivery</strong> with endosomal escape (<code className="text-[#98c2cc]">CPP &ge; 1.45</code>), <strong>(3) ImmunoShield South Asian HLA de-immunization</strong>, and <strong>(4) Wet-lab microfluidic mass scaling</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                <button
                  onClick={() => startClinicalWalkthrough('HBB')}
                  className="px-2.5 py-1 text-xs font-semibold rounded-[2px] bg-[#0f766e] hover:bg-[#115e59] text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Launch Guided Web Tour (6 Steps)</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedPresetId('HBB');
                    setIsCustomMode(false);
                    setSelectedGuideId(null);
                    setActiveTab('crispr');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#e8dfd1] hover:text-[#d4a359] transition cursor-pointer flex items-center gap-1"
                >
                  <span>Case 1: Sickle Cell (HBB E6V &rarr; HbG)</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedPresetId('TTR');
                    setIsCustomMode(false);
                    setSelectedGuideId(null);
                    setActiveTab('lnp');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#e8dfd1] hover:text-[#d4a359] transition cursor-pointer flex items-center gap-1"
                >
                  <span>Case 2: Amyloidosis (TTR)</span>
                </button>
                <button
                  onClick={() => setWorkbenchMode('expert')}
                  className="text-[11px] text-[#70675c] hover:text-[#a69b8d] underline ml-2 transition cursor-pointer"
                >
                  Switch to Expert Studio
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDismissedNewcomerBanner(true)}
            className="text-[#70675c] hover:text-[#e8dfd1] p-1 transition cursor-pointer shrink-0 self-start md:self-center"
            title="Dismiss newcomer guide banner"
            aria-label="Dismiss newcomer guide banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Sequence Input Drawer (when active) */}
      {isCustomMode && (
        <div
          style={{
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
          }}
          className="border-b px-4 py-3 flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-xs tracking-tight text-[#e8dfd1]">
              Custom target sequence configuration
            </span>
            <span className="text-[11px] text-[#70675c]">
              Dual-strand scanning will search both (+) and (-) orientations
            </span>
          </div>

          {/* Tier 2: Live Biological Database Search Bar */}
          <div
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="p-2.5 border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 flex-1">
              <span className="font-semibold text-[11px] text-[#e8dfd1] flex items-center gap-1.5 shrink-0">
                <Globe className="w-3.5 h-3.5 text-[#4d828f]" />
                Ensembl Live Lookup:
              </span>
              <div className="flex items-center gap-1.5 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="e.g. CFTR, HEXA, LDLR, DMD, HBA1"
                  value={geneSearchQuery}
                  onChange={(e) => setGeneSearchQuery(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEnsemblGeneSearch();
                  }}
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-1 border text-xs font-mono text-[#e8dfd1] outline-none w-36 uppercase"
                />
                <button
                  onClick={() => handleEnsemblGeneSearch()}
                  disabled={isSearchingGene}
                  style={{
                    backgroundColor: tokens.colors.accent,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white hover:brightness-110 transition cursor-pointer flex items-center gap-1 disabled:opacity-50 shrink-0"
                >
                  <Search className="w-3 h-3" />
                  {isSearchingGene ? 'Querying...' : 'Fetch CDS'}
                </button>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                <span className="text-[#70675c]">Quick load:</span>
                {['CFTR', 'HEXA', 'LDLR', 'DMD', 'HBA1'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setGeneSearchQuery(sym);
                      handleEnsemblGeneSearch(sym);
                    }}
                    style={{
                      borderColor: tokens.colors.border,
                      backgroundColor: tokens.colors.canvas,
                    }}
                    className="px-1.5 py-0.5 rounded border text-[#a69b8d] hover:text-[#e8dfd1] hover:border-[#4d828f] transition cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Ensembl variant lookup (South Asian allele frequency) */}
            <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3 border-[#2e2923] shrink-0">
              <span className="text-[11px] text-[#a69b8d]">SAS SNP:</span>
              <input
                type="text"
                placeholder="rs10768683"
                value={variantSearchQuery}
                onChange={(e) => setVariantSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVariantSearch();
                }}
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2 py-1 border text-xs font-mono text-[#e8dfd1] outline-none w-28"
              />
              <button
                onClick={handleVariantSearch}
                disabled={isSearchingVariant}
                style={{
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2 py-1 text-xs font-medium text-[#e8dfd1] border hover:border-[#4d828f] transition cursor-pointer disabled:opacity-50"
              >
                {isSearchingVariant ? '...' : 'Verify'}
              </button>
            </div>
          </div>

          {geneSearchError && (
            <div className="text-[11px] text-[#cc6b5a] bg-[#2a1b18] border border-[#522923] px-2.5 py-1 rounded">
              {geneSearchError}
            </div>
          )}

          {variantSearchError && (
            <div className="text-[11px] text-[#cc6b5a] bg-[#2a1b18] border border-[#522923] px-2.5 py-1 rounded">
              {variantSearchError}
            </div>
          )}

          {variantSearchNote && (
            <div className="text-[11px] text-[#a69b8d] border border-[#24201b] px-2.5 py-1 rounded">
              {variantSearchNote}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-[#a69b8d] block mb-1">
                Coding DNA sequence (5&apos; → 3&apos;)
              </label>
              <textarea
                rows={2}
                value={customPreset.sequence}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sequence: e.target.value.toUpperCase().replace(/[^ATCGN]/g, ''),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-2 border font-mono-seq text-[11px] text-[#e8dfd1] outline-none focus:border-[#4d828f]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#a69b8d] block mb-1">
                Target nucleotide (1-based index)
              </label>
              <input
                type="number"
                min={1}
                max={customPreset.sequence.length}
                value={customPreset.mutationIndex + 1}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    mutationIndex: Math.min(
                      Math.max(0, customPreset.sequence.length - 1),
                      Math.max(0, parseInt(e.target.value || '1', 10) - 1)
                    ),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
              />

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
                Base editor architecture
              </label>
              <select
                value={activePreset.editorType}
                onChange={(e) => {
                  const val = e.target.value as BaseEditorType;
                  setEditorOverride(val);
                  setCustomPreset((prev) => ({
                    ...prev,
                    editorType: val,
                  }));
                }}
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                {Object.entries(BASE_EDITOR_DEFINITIONS).map(([editorType, definition]) => (
                  <option key={editorType} value={editorType}>
                    {editorType} — positions {definition.editingWindow[0]}–{definition.editingWindow[1]}
                  </option>
                ))}
              </select>

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
                Cas9 PAM-recognition variant
              </label>
              <select
                value={activePamVariant}
                onChange={(e) => {
                  const val = e.target.value as PamVariant;
                  setPamOverride(val);
                  setCustomPreset((prev) => ({
                    ...prev,
                    pamVariant: val,
                  }));
                }}
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                {Object.entries(PAM_VARIANT_DEFINITIONS).map(([pamVariant, definition]) => (
                  <option key={pamVariant} value={pamVariant}>
                    {definition.label} — {definition.recognition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#a69b8d] block mb-1">
                Target organ / tissue
              </label>
              <select
                value={customPreset.targetOrgan}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    targetOrgan: e.target.value as 'Liver' | 'Bone Marrow (HSPC)' | 'Lung',
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                <option value="Liver">Liver (Hepatocytes)</option>
                <option value="Bone Marrow (HSPC)">Bone Marrow (HSPC)</option>
                <option value="Lung">Lung (Endothelium)</option>
              </select>

              <label className="text-[11px] text-[#a69b8d] block mt-2 mb-1">
                Optional SAS SNP marker (1-based)
              </label>
              <input
                type="number"
                min={0}
                max={customPreset.sequence.length}
                value={customPreset.sasSnpIndex + 1}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sasSnpIndex: Math.min(
                      Math.max(0, customPreset.sequence.length - 1),
                      Math.max(0, parseInt(e.target.value || '0', 10) - 1)
                    ),
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workstation Layout */}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 ${isDossierModalOpen ? 'print:hidden' : ''}`}>
        {/* LEFT WORKSTATION: GENOMICS & BASE EDITING EVALUATION */}
        {(activeTab === 'overview' || activeTab === 'crispr' || activeTab === 'immunology') && (
          <section className={`${activeTab === 'overview' ? 'lg:col-span-7' : 'lg:col-span-12'} flex flex-col gap-3`}>
            {/* Newcomer Dedicated Mode Guidance Callout */}
            {workbenchMode === 'newcomer' && activeTab === 'overview' && (
              <NewcomerStageTip
                stage="Panoramic Overview"
                title="Translational Multi-Pillar Pipeline"
                subtitle="Explore the end-to-end preclinical nanomedicine workflow connecting precision base editing, delivery biophysics, Cas9 de-immunization, and microfluidic batch formulation. Switch between dedicated stage tabs above for focused deep dives."
                badgeText="4 Preclinical Pillars"
                bulletPoints={[
                  "1. Precision Base Editing without double-strand DNA breaks",
                  "2. LNP Delivery with endosomal hexagonal (HII) fusion",
                  "3. ImmunoShield South Asian HLA de-immunization",
                ]}
              />
            )}
            {workbenchMode === 'newcomer' && activeTab === 'crispr' && (
              <NewcomerStageTip
                stage="Stage 1: Base Editing"
                title="Precision Deamination & Protospacer Discovery"
                subtitle="Adenine (ABE8e) and Cytosine (BE4max) base editors chemically modify target nucleotides within the catalytic window (typically positions 4–8) without creating double-strand DNA breaks. Evaluate candidate sgRNAs, audit bystander modifications for pathogenicity, and retrieve Golden Gate BsmBI cloning oligos."
                badgeText="Dual-Strand (+) / (-) Protospacer Search"
                bulletPoints={[
                  "Dual-strand candidate search with canonical NGG PAM variants",
                  "Bystander codon audit with Grantham amino-acid distances (rule-based, not a ClinVar lookup)",
                  "Golden Gate BsmBI cloning oligos with U6 transcription 5'-G",
                ]}
              />
            )}
            {workbenchMode === 'newcomer' && activeTab === 'immunology' && (
              <NewcomerStageTip
                stage="Stage 3: ImmunoShield-DRA"
                title="South Asian HLA Cas9 De-Immunization"
                subtitle="SpCas9 is derived from Streptococcus pyogenes. Up to 85% of humans possess pre-existing antibodies and cytotoxic CD8+ T-cells targeting Cas9 surface epitopes. ImmunoShield-DRA identifies immunogenic peptides presented by high-frequency South Asian HLA Class I/II alleles and applies targeted stealth mutations (e.g. L514A, Y823A) to neutralize CTL attack while preserving Cas9 endonuclease folding stability."
                badgeText="Pan-Allele HLA Binding & CTL Risk Elimination"
                bulletPoints={[
                  "High-frequency South Asian alleles (HLA-A*02:11, HLA-A*24:02, HLA-B*40:06)",
                  "Selective stealth substitutions disrupting T-cell receptor anchor binding",
                  "Preservation of D10 and H840 active catalytic triad residues",
                ]}
              />
            )}
          {/* Target Locus Metadata Bar */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24201b] pb-2 mb-2">
              <div>
                <span className="font-semibold text-sm text-[#e8dfd1] mr-2">
                  {activePreset.symbol}
                </span>
                <span className="text-[#a69b8d] text-xs">{activePreset.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#a69b8d]">
                <span>
                  Target tissue:{' '}
                  <strong className="text-[#e8dfd1] font-medium">
                    {activePreset.targetOrgan}
                  </strong>
                </span>
                <span>•</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span>Editor:</span>
                  <select
                    value={activePreset.editorType}
                    onChange={(e) => {
                      const val = e.target.value as BaseEditorType;
                      setEditorOverride(val);
                      if (isCustomMode) {
                        setCustomPreset((prev) => ({ ...prev, editorType: val }));
                      }
                      setSelectedGuideId(null);
                    }}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="px-2 py-0.5 border text-xs text-[#e8dfd1] outline-none cursor-pointer hover:border-[#4d828f] focus:border-[#4d828f]"
                    title="Switch base editor architecture (ABE8e, ABE9 narrow window, BE4max)"
                  >
                    {Object.keys(BASE_EDITOR_DEFINITIONS).map((ed) => (
                      <option key={ed} value={ed}>
                        {ed}
                      </option>
                    ))}
                  </select>
                </label>
                <span>•</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <span>PAM:</span>
                  <select
                    value={activePamVariant}
                    onChange={(e) => {
                      const val = e.target.value as PamVariant;
                      setPamOverride(val);
                      if (isCustomMode) {
                        setCustomPreset((prev) => ({ ...prev, pamVariant: val }));
                      }
                      setSelectedGuideId(null);
                    }}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="px-2 py-0.5 border text-xs text-[#e8dfd1] outline-none cursor-pointer hover:border-[#4d828f] focus:border-[#4d828f]"
                    title="Switch Cas9 PAM recognition variant (SpCas9, SpCas9-NG, SpRY)"
                  >
                    {Object.entries(PAM_VARIANT_DEFINITIONS).map(([pamKey, pamDef]) => (
                      <option key={pamKey} value={pamKey}>
                        {pamDef.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <div className="text-[#a69b8d] flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  Clinical indication:{' '}
                  <span className="text-[#e8dfd1] font-medium">{activePreset.disease}</span>
                </span>
                <span>
                  PAM mode:{' '}
                  <span className="text-[#e8dfd1] font-mono-seq">
                    {activePamDefinition.recognition}
                  </span>
                </span>
                <span>
                  Deaminase window:{' '}
                  <span className="text-[#e8dfd1] font-mono-seq">
                    spacer pos {editorWindowLabel}
                  </span>
                </span>
              </div>
              <p className="text-[#70675c] text-[11px] mt-0.5 leading-relaxed">
                {activePreset.clinicalNote}
              </p>
            </div>
          </div>

          {/* CRISPR Base Editing Pipeline (Sequence Viewer, Protospacers & Bystanders) */}
          {(activeTab === 'overview' || activeTab === 'crispr') && (
            <>
          {/* Sequence workbench: ruler, codons, edit outcome, guides and variants on one axis */}
          <SequenceWorkbench
            title={`${activePreset.symbol} coding sequence`}
            sequence={activePreset.sequence}
            editor={workbenchEditor}
            guides={workbenchGuides}
            snps={workbenchSnps}
            targetPos={activePreset.mutationIndex}
            selectedGuideId={selectedGuide?.id ?? null}
            onSelectGuide={setSelectedGuideId}
            audit="summary"
          />

          {/* Dual-Strand Protospacer Candidate Guides Table */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Discovered protospacers ({processedGuides.length} candidates)
                </h2>
                <span className="text-[11px] text-[#70675c]">
                  Dual-strand (+) and (-) search
                </span>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-[#a69b8d]">
                  <span>Strand:</span>
                  <select
                    value={filterStrand}
                    onChange={(e) => setFilterStrand(e.target.value as any)}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="p-1 border text-xs text-[#e8dfd1] outline-none"
                  >
                    <option value="all">All strands (+/-)</option>
                    <option value="+">Sense (+) only</option>
                    <option value="-">Antisense (-) only</option>
                  </select>
                </div>

                <label className="flex items-center gap-1 cursor-pointer text-[#a69b8d]">
                  <input
                    type="checkbox"
                    checked={preferredPamOnly}
                    onChange={(e) => setPreferredPamOnly(e.target.checked)}
                    className="accent-[#4d828f]"
                  />
                  <span>{activePamDefinition.preferredPamLabel}</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer text-[#a69b8d]">
                  <input
                    type="checkbox"
                    checked={hideSnpCollisions}
                    onChange={(e) => setHideSnpCollisions(e.target.checked)}
                    className="accent-[#4d828f]"
                  />
                  <span>Exclude SAS SNP collisions</span>
                </label>
              </div>
            </div>

            {!hasOnTargetGuide && (
              <TargetCoverageNotice
                editor={activePreset.editorType}
                pam={activePamVariant}
                options={targetCoverage}
                onApply={(editor, pam) => {
                  setEditorOverride(editor);
                  setPamOverride(pam);
                  if (isCustomMode) {
                    setCustomPreset((prev) => ({ ...prev, editorType: editor, pamVariant: pam }));
                  }
                  setSelectedGuideId(null);
                }}
              />
            )}

            {/* Candidates Table */}
            <div className="overflow-x-auto max-h-[300px] border border-[#24201b] rounded-[2px]">
              <table className="w-full border-collapse text-left text-xs">
                <thead
                  style={{ backgroundColor: tokens.colors.surfaceRaised }}
                  className="sticky top-0 z-10 text-[#a69b8d] text-[11px] border-b border-[#332e27]"
                >
                  <tr>
                    <th
                      className="py-1.5 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                      onClick={() => handleSort('id')}
                    >
                      Guide ID
                    </th>
                    <th
                      className="py-1.5 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                      onClick={() => handleSort('strand')}
                    >
                      Strand
                    </th>
                    <th className="py-1.5 px-2 font-medium">Protospacer (5&apos; → 3&apos;)</th>
                    <th
                      className="py-1.5 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                      onClick={() => handleSort('pam')}
                    >
                      PAM
                    </th>
                    <th
                      className="py-1.5 px-2 font-medium text-right cursor-pointer hover:text-[#e8dfd1]"
                      onClick={() => handleSort('gcContent')}
                    >
                      GC%
                    </th>
                    <th
                      className="py-1.5 px-2 font-medium text-right cursor-pointer hover:text-[#e8dfd1]"
                      onClick={() => handleSort('CompositeScore')}
                    >
                      Score
                    </th>
                    <th className="py-1.5 px-2 font-medium">Bystanders</th>
                    <th className="py-1.5 px-2 font-medium">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {processedGuides.map((guide, idx) => {
                    const isSelected = selectedGuide?.id === guide.id;
                    const verdictColor = getVerdictStatusColor(guide.verdict);

                    return (
                      <tr
                        key={guide.id}
                        onClick={() => setSelectedGuideId(guide.id)}
                        style={{
                          backgroundColor: isSelected
                            ? tokens.colors.surfaceSelected
                            : idx % 2 === 0
                            ? 'transparent'
                            : 'rgba(25, 23, 20, 0.4)',
                          borderColor: tokens.colors.borderMuted,
                        }}
                        className={`border-b cursor-pointer transition text-[11px] hover:bg-[#2a2621] ${
                          isSelected ? 'font-medium' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 font-mono-seq text-[#e8dfd1]">
                          <span className="flex items-center gap-1.5">
                            {isSelected && (
                              <span
                                style={{ backgroundColor: tokens.colors.accent }}
                                className="w-1.5 h-1.5 rounded-full"
                              />
                            )}
                            {guide.id}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-mono-seq">
                          <span
                            className={
                              guide.strand === '+' ? 'text-[#73a880]' : 'text-[#6699a8]'
                            }
                          >
                            {guide.strand === '+' ? '(+) Sense' : '(-) Antisense'}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-mono-seq tracking-wider">
                          {guide.spacer.split('').map((char, charIdx) => (
                            <span key={charIdx} className={getBaseColorClass(char)}>
                              {char}
                            </span>
                          ))}
                        </td>
                        <td className="py-1.5 px-2 font-mono-seq font-semibold text-[#cfa052]">
                          {guide.pam}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono-seq text-[#a69b8d]">
                          {guide.gcContent.toFixed(1)}%
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                          {guide.CompositeScore}
                        </td>
                        <td className="py-1.5 px-2">
                          {guide.bystanders.length === 0 ? (
                            <span className="text-[#5e946c] text-[10px] font-medium">None</span>
                          ) : (
                            <span className="text-[#c98a3b] text-[10px] font-medium">
                              {guide.bystanders.length} bystander{guide.bystanders.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: verdictColor }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="truncate max-w-[140px] text-[#e8dfd1]">
                              {guide.verdict}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Guide Detail View & Cloning Oligos */}
            {selectedGuide && cloningOligos && (
              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2.5 border flex flex-col gap-2 mt-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24201b] pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#e8dfd1]">
                      {selectedGuide.id} Cloning Architecture
                    </span>
                    <span className="text-[10px] font-mono-seq px-1 py-0.2 rounded-[2px] bg-[#24201b] text-[#98c2cc]">
                      Overhangs: {cloningOligos.overhangSystem}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#a69b8d]">
                    GC: {selectedGuide.gcContent.toFixed(1)}% • Score: {selectedGuide.CompositeScore}/100 • Target in window: {selectedGuide.targetInWindow ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#a69b8d]">Forward Oligo (CACC overhang):</span>
                      <button
                        onClick={() => handleCopyOligo(cloningOligos.forwardOligo, 'fwd')}
                        className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedOligo === 'fwd' ? (
                          <Check className="w-2.5 h-2.5 text-[#5e946c]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                        <span>{copiedOligo === 'fwd' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <code className="p-1.5 rounded-[2px] bg-[#181613] border border-[#24201b] font-mono-seq text-[11px] text-[#e8dfd1] break-all select-all">
                      {cloningOligos.forwardOligo}
                    </code>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#a69b8d]">Reverse Oligo (AAAC overhang):</span>
                      <button
                        onClick={() => handleCopyOligo(cloningOligos.reverseOligo, 'rev')}
                        className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedOligo === 'rev' ? (
                          <Check className="w-2.5 h-2.5 text-[#5e946c]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5" />
                        )}
                        <span>{copiedOligo === 'rev' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <code className="p-1.5 rounded-[2px] bg-[#181613] border border-[#24201b] font-mono-seq text-[11px] text-[#e8dfd1] break-all select-all">
                      {cloningOligos.reverseOligo}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bystander Mutations Consequences Table */}
          {selectedGuide && (() => {
            const displayedBystanders = selectedGuide.bystanders;

            return (
              <div
                style={{
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="border p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                      Deaminase window (spacer pos {editorWindowLabel}) bystander consequences
                    </h2>
                    <span
                      style={{
                        borderColor: tokens.colors.border,
                        backgroundColor: tokens.colors.surfaceRaised,
                      }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-[#73a880] border"
                    >
                      <Sparkles className="w-3 h-3" />
                      Rule + Grantham (not ClinVar)
                    </span>
                  </div>
                  <span className="text-[11px] text-[#70675c]">
                    {displayedBystanders.length} potential edits in catalytic window
                  </span>
                </div>

                {displayedBystanders.length === 0 ? (
                  <p className="text-[11px] text-[#70675c] py-2 text-center">
                    No editable bases found within the active deamination window ({editorWindowLabel}). Clean on-target window.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr
                          style={{ borderColor: tokens.colors.border }}
                          className="border-b text-[#a69b8d] text-[11px]"
                        >
                          <th className="py-1 px-2 font-medium">Spacer pos</th>
                          <th className="py-1 px-2 font-medium">Genomic bp</th>
                          <th className="py-1 px-2 font-medium">Original codon</th>
                          <th className="py-1 px-2 font-medium">Original residue</th>
                          <th className="py-1 px-2 font-medium">Edited codon</th>
                          <th className="py-1 px-2 font-medium">Edited residue</th>
                          <th className="py-1 px-2 font-medium">Consequence classification</th>
                          <th className="py-1 px-2 font-medium" title="Computed in the browser from the consequence class and the Grantham amino-acid distance. Not a ClinVar lookup.">Impact (rule + Grantham)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedBystanders.map((b, i) => {
                          const isSafe =
                            b.classification === 'Target Edit' ||
                            b.classification === 'Silent (Synonymous)';
                          const statusColor = isSafe
                            ? tokens.colors.status.success
                            : tokens.colors.status.danger;
                          const impact = describeBystanderImpact(activePreset.id, b);

                          return (
                            <tr
                              key={i}
                              style={{ borderColor: tokens.colors.borderMuted }}
                              className="border-b text-[11px]"
                            >
                              <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">{b.guidePos}</td>
                              <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                                bp {b.genomicIndex + 1}
                              </td>
                              <td className="py-1 px-2 font-mono-seq tracking-wider">
                                {b.originalCodon.split('').map((ch, cIdx) => (
                                  <span key={cIdx} className={getBaseColorClass(ch)}>
                                    {ch}
                                  </span>
                                ))}
                              </td>
                              <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">
                                {b.originalAA}
                              </td>
                              <td className="py-1 px-2 font-mono-seq tracking-wider">
                                {b.editedCodon.split('').map((ch, cIdx) => (
                                  <span key={cIdx} className={getBaseColorClass(ch)}>
                                    {ch}
                                  </span>
                                ))}
                              </td>
                              <td className="py-1 px-2 font-mono-seq text-[#e8dfd1]">{b.editedAA}</td>
                              <td className="py-1 px-2">
                                <span className="flex items-center gap-1.5">
                                  <span
                                    style={{ backgroundColor: statusColor }}
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                  />
                                  <span className="text-[#e8dfd1]">{b.classification}</span>
                                </span>
                              </td>
                              <td className="py-1 px-2">
                                <div className="flex flex-col gap-0.5">
                                  <span
                                    style={{
                                      color:
                                        impact.tone === 'flag'
                                          ? tokens.colors.status.danger
                                          : impact.tone === 'ok'
                                          ? tokens.colors.status.success
                                          : tokens.colors.accent,
                                    }}
                                    className="font-medium text-[10px]"
                                  >
                                    {impact.tag}
                                  </span>
                                  <span
                                    className="text-[9.5px] text-[#70675c] leading-tight max-w-[240px] truncate block"
                                    title={impact.detail}
                                  >
                                    {impact.detail}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
            </>
          )}

          {/* ImmunoShield-DRA Cas9 Epitope Immunogenicity Section (Interactive South Asian Alleles) */}
          {(activeTab === 'overview' || activeTab === 'immunology') && (
            <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  ImmunoShield-DRA: Cas9 surface epitope immunogenicity (South Asian HLA panel)
                </h2>
                <span
                  style={{
                    backgroundColor:
                      residualHlaRisk === null
                        ? tokens.colors.surfaceRaised
                        : residualHlaRisk <= 20
                        ? tokens.colors.status.successSubtle
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warningSubtle
                        : tokens.colors.status.dangerSubtle,
                    color:
                      residualHlaRisk === null
                        ? tokens.colors.textMuted
                        : residualHlaRisk <= 20
                        ? tokens.colors.status.success
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warning
                        : tokens.colors.status.danger,
                    borderRadius: tokens.radius,
                  }}
                  className="px-1.5 py-0.5 font-mono-seq text-[10px] font-semibold"
                >
                  CTL Risk: {residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
                </span>
              </div>

              <button
                onClick={toggleAllStealth}
                disabled={!hasPatientHlaSelection || patientRelevantEpitopes.length === 0}
                style={{
                  backgroundColor: tokens.colors.surfaceRaised,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-0.5 text-xs font-medium border hover:bg-[#2a2621] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
              >
                <span
                  style={{
                    backgroundColor: allStealthEnabled
                      ? tokens.colors.status.success
                      : tokens.colors.status.warning,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#e8dfd1]">
                  {!hasPatientHlaSelection
                    ? 'Select patient HLA alleles'
                    : allStealthEnabled
                    ? `All ${patientRelevantEpitopes.length} selected stealth mutations: Active`
                    : 'Restore selected stealth mutations'}
                </span>
              </button>
            </div>

            <fieldset
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="border px-2.5 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <legend className="text-[11px] font-medium text-[#e8dfd1]">
                  Patient HLA haplotype / allele set
                </legend>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedHlaAlleles([...SOUTH_ASIAN_HLA_ALLELES])}
                    className="text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                  >
                    Select panel
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHlaAlleles([])}
                    className="text-[#a69b8d] hover:text-[#e8dfd1] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {SOUTH_ASIAN_HLA_ALLELES.map((allele) => (
                  <label
                    key={allele}
                    className="flex items-center gap-1 cursor-pointer text-[11px] text-[#a69b8d]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedHlaAlleles.includes(allele)}
                      onChange={() => togglePatientHlaAllele(allele)}
                      className="accent-[#4d828f]"
                    />
                    {allele}
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-[#70675c]">
                Only epitopes associated with a selected allele contribute to the illustrative residual-risk score.
              </p>
            </fieldset>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#a69b8d] text-[11px]"
                  >
                    <th className="py-1 px-2 font-medium">Epitope peptide</th>
                    <th className="py-1 px-2 font-medium">Residues</th>
                    <th className="py-1 px-2 font-medium">Protein domain</th>
                    <th className="py-1 px-2 font-medium">South Asian HLA allele</th>
                    <th className="py-1 px-2 font-medium text-right font-mono-seq">Risk score</th>
                    <th className="py-1 px-2 font-medium">De-immunization mutation</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasPatientHlaSelection ? (
                    <tr>
                      <td colSpan={6} className="py-3 px-2 text-center text-[11px] text-[#70675c]">
                        Select one or more patient HLA alleles to assess the curated epitope panel.
                      </td>
                    </tr>
                  ) : patientRelevantEpitopes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 px-2 text-center text-[11px] text-[#70675c]">
                        No curated panel epitopes match the selected HLA alleles.
                      </td>
                    </tr>
                  ) : (
                    patientRelevantEpitopes.map((ep) => {
                      const isShielded = activeStealthMutations[ep.peptide];
                      return (
                        <tr
                          key={ep.peptide}
                          style={{ borderColor: tokens.colors.borderMuted }}
                          className="border-b text-[11px] hover:bg-[#2a2621] transition"
                        >
                          <td className="py-1 px-2 font-mono-seq font-semibold text-[#e8dfd1]">
                            {ep.peptide}
                          </td>
                          <td className="py-1 px-2 font-mono-seq text-[#a69b8d]">
                            {ep.residueRange}
                          </td>
                          <td className="py-1 px-2 text-[#a69b8d]">{ep.domain}</td>
                          <td className="py-1 px-2 text-[#a69b8d]">{ep.hlaAllele}</td>
                          <td className="py-1 px-2 text-right font-mono-seq">
                            {isShielded ? (
                              <span className="text-[#5e946c] font-medium">&lt;10</span>
                            ) : (
                              <span
                                style={{ color: tokens.colors.status.danger }}
                                className="font-semibold"
                              >
                                {ep.bindingScore} / 100
                              </span>
                            )}
                          </td>
                          <td className="py-1 px-2">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[#e8dfd1]">
                              <input
                                type="checkbox"
                                checked={isShielded}
                                onChange={() => toggleSingleEpitope(ep.peptide)}
                                className="accent-[#5e946c]"
                                aria-label={`Enable ${ep.stealthMutation}`}
                              />
                              <span
                                style={{
                                  backgroundColor: isShielded
                                    ? tokens.colors.status.success
                                    : tokens.colors.status.danger,
                                }}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                              />
                              {isShielded ? ep.stealthMutation : 'Wild-type (unmodified anchor residue)'}
                            </label>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    )}

      {/* RIGHT WORKSTATION: LIPID NANOPARTICLE FORMULATION & BIOPHYSICS */}
      {(activeTab === 'overview' || activeTab === 'lnp') && (
        <section className={`${activeTab === 'overview' ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-3`}>
          {/* Newcomer Dedicated Mode Guidance Callout */}
          {workbenchMode === 'newcomer' && activeTab === 'lnp' && (
            <NewcomerStageTip
              stage="Stage 2: LNP Delivery"
              title="Lipid Nanoparticle Biophysics & Endosomal Escape"
              subtitle="Formulate 4-component LNPs (Ionizable Lipid, DSPC, Cholesterol, PEG-Lipid). Ionizable lipids remain near-neutral at physiological blood pH 7.4 to evade immune clearance, but undergo protonation in acidic endosomes (pH 5.5). This induces the Israelachvili Critical Packing Parameter (CPP ≥ 1.45) transition into the inverted hexagonal (HII) phase, fusing with endosomal membranes to release mRNA into the cytoplasm."
              badgeText="Israelachvili CPP ≥ 1.45 Fusion"
              bulletPoints={[
                "Ionizable lipid pKa 6.0-6.5 balances blood circulation and endosomal escape",
                "Israelachvili CPP >= 1.45 triggers non-bilayer hexagonal membrane disruption",
                "ApoE-mediated receptor uptake drives targeted hepatic/endothelial biodistribution",
              ]}
            />
          )}
          {/* 3D nanoparticle cutaway: owns its title, toolbar, live readout and HUD */}
          <NanoViewport3D formulation={activeFormulation} biophysics={biophysics} />

          {/* Benchmarks, composition and assembly controls, ionization curve */}
          <LnpFormulationPanel form={lnpForm} onChange={setLnpForm} biophysics={biophysics} />

          {/* Wet-Lab Batch Preparation Mass Calculator (Collapsible / Toggleable in Overview) */}
          {activeTab === 'overview' && showBatchCalc && (
            <div
              style={{
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className="border p-3 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Wet-lab batch preparation calculator
                </h2>
                <span className="text-[11px] text-[#70675c]">Microfluidic mixing protocol</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-[#a69b8d] block mb-0.5">
                    Target batch volume (mL)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={batchVolumeMl}
                    onChange={(e) =>
                      setBatchVolumeMl(Math.max(0.1, parseFloat(e.target.value) || 10))
                    }
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#a69b8d] block mb-0.5">
                    mRNA concentration (mg/mL)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={batchMrnaConcMgMl}
                    onChange={(e) =>
                      setBatchMrnaConcMgMl(Math.max(0.05, parseFloat(e.target.value) || 1))
                    }
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e8dfd1] outline-none"
                  />
                </div>
              </div>

              {/* Mass Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr
                      style={{ borderColor: tokens.colors.border }}
                      className="border-b text-[#a69b8d] text-[11px]"
                    >
                      <th className="py-1 px-1.5 font-medium">Component</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Molar %</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">
                        Mass to weigh
                      </th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">
                        Conc (mM)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-1.5 font-semibold text-[#e8dfd1]">mRNA payload</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">—</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                        {batchCalculation.totalMrnaMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                        {batchMrnaConcMgMl.toFixed(2)} mg/mL
                      </td>
                    </tr>
                    {batchCalculation.components.map((c, i) => (
                      <tr
                        key={i}
                        style={{ borderColor: tokens.colors.borderMuted }}
                        className="border-b text-[11px]"
                      >
                        <td className="py-1 px-1.5 text-[#e8dfd1]">{c.name}</td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                          {c.molarPct.toFixed(1)}%
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq font-medium text-[#e8dfd1]">
                          {c.massMg} mg
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                          {c.molarConcMm} mM
                        </td>
                      </tr>
                    ))}
                    <tr className="text-[11px] font-semibold text-[#e8dfd1]">
                      <td className="py-1 px-1.5">Total Lipids</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">100.0%</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">
                        {batchCalculation.totalLipidMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#a69b8d]">
                        Ratio:{' '}
                        {(
                          batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg
                        ).toFixed(1)}
                        :1 w/w
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calculated Biophysical Properties (Expanded 6-Card Grid) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Calculated biophysical properties
              </h2>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  style={{
                    backgroundColor:
                      biophysics.stabilityStatus === 'Optimal Clinical LNP'
                        ? tokens.colors.status.success
                        : tokens.colors.status.warning,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#e8dfd1]">{stabilityLabel(biophysics.stabilityStatus)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">Hydrodynamic diameter</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.diameterNm} nm
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  PDI: {biophysics.pdi.toFixed(2)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">Zeta potential (pH 7.4)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.zetaPotentialMv > 0
                    ? `+${biophysics.zetaPotentialMv}`
                    : biophysics.zetaPotentialMv}{' '}
                  mV
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  Blood ionized: {biophysics.bloodProtonationPct}%
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">Endosomal ionization</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.endosomalProtonationPct}%
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  At late endosome pH 5.5
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">ApoE uptake score</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.cellularUptakeScore} / 100
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  Escape eff: {biophysics.endosomalEscapeEfficiency}%
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">De Gennes brush (RF/D)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.deGennesRfOverD?.toFixed(2) ?? '—'}
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  {(biophysics.deGennesRfOverD ?? 0) >= 1.0 ? 'Dense Brush' : 'Mushroom Regime'}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#70675c] text-[11px]">Packing param (CPP)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e8dfd1]">
                  {biophysics.criticalPackingParam?.toFixed(2) ?? '—'}
                </div>
                <div className="text-[10px] text-[#a69b8d] font-mono-seq">
                  SAXS d: {biophysics.saxsBraggSpacingNm ?? 6.1} nm
                </div>
              </div>
            </div>
            <p className="text-[10px] leading-snug text-[#70675c]">
              Ionization is the Henderson-Hasselbalch value for the pKa and pH shown. Size, PDI, zeta potential, uptake,
              escape and packing are empirical surrogates tuned by hand, not fitted to measurements. Use them to compare
              formulations, and confirm by DLS and ELS.
            </p>
          </div>

          {/* Predicted Biodistribution */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Predicted organ biodistribution (SORT model)
              </h2>
              <span className="text-[11px] text-[#70675c]">Apparent charge partitioning</span>
            </div>

            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#a69b8d]">Liver (hepatocytes)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.liver}%
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.liver}%`,
                      backgroundColor: tokens.colors.accent,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#a69b8d]">Spleen (lymphoid / immune cells)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.spleen}%
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.spleen}%`,
                      backgroundColor: tokens.colors.pigments.ochre,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#a69b8d]">Lungs (endothelial beds)</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {biophysics.organTropism.lungs}%
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderRadius: '2px',
                  }}
                  className="w-full h-1.5 overflow-hidden"
                >
                  <div
                    style={{
                      width: `${biophysics.organTropism.lungs}%`,
                      backgroundColor: tokens.colors.pigments.verdigris,
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* DEDICATED STAGE 4 WORKSTATION: WET-LAB BATCH PREPARATION & CMC REGULATORY DOSSIER */}
      {activeTab === 'batch' && (
        <section className="lg:col-span-12 flex flex-col gap-3">
          {/* Newcomer Dedicated Mode Guidance Callout */}
          {workbenchMode === 'newcomer' && (
            <NewcomerStageTip
              stage="Stage 4: Wet-Lab Batch & CMC Dossier"
              title="Microfluidic Mass Scaling, Commercial Oligo Ordering & Regulatory Technical Dossier"
              subtitle="Translate cellular-scale dosages into physical milligram quantities of lipid and mRNA for microfluidic synthesis. Download commercial synthesis sheets formatted for IDT and GenScript, and launch the Pre-IND Regulatory Technical Dossier adhering to ICH M4Q / FDA eCTD Module 3 (CMC) standards."
              badgeText="Microfluidic Dosing & FDA eCTD Module 3 CMC"
              bulletPoints={[
                "Calculate exact masses of mRNA and all 4 lipids for microfluidic mixing",
                "Export 1-click IDT and GenScript CSV bulk synthesis order sheets",
                "Review formal ICH M4Q / FDA eCTD Module 3 Pre-IND Dossier with release criteria",
              ]}
            />
          )}

          {/* Target Locus Metadata Bar */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24201b] pb-2 mb-2">
              <div>
                <span className="font-semibold text-sm text-[#e8dfd1] mr-2">
                  {activePreset.symbol}
                </span>
                <span className="text-[#a69b8d] text-xs">{activePreset.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#a69b8d]">
                <span>
                  Indication: <strong className="text-[#e8dfd1] font-medium">{activePreset.disease}</strong>
                </span>
                <span>•</span>
                <span>
                  Target tissue: <strong className="text-[#e8dfd1] font-medium">{activePreset.targetOrgan}</strong>
                </span>
                <span>•</span>
                <span>
                  Lead guide: <strong className="text-[#e8dfd1] font-mono-seq">{selectedGuide?.id ?? 'sgRNA-f1'}</strong>
                </span>
              </div>
            </div>
            <p className="text-[#70675c] text-[11px] leading-relaxed">
              Batch mass scaling and regulatory specifications for clinical investigational drug product formulation.
            </p>
          </div>

          {/* Wet-Lab Batch Preparation Mass Calculator (Full Width) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Wet-lab microfluidic batch preparation calculator
                </h2>
                <span className="text-[10px] font-mono-seq px-1.5 py-0.5 rounded bg-[#211e1a] text-[#d4a359] border border-[#332e27]">
                  Flow Ratio 3:1 (Aqueous:Ethanol)
                </span>
              </div>
              <span className="text-[11px] text-[#70675c]">
                Physical component mass requirements for NanoAssemblr / microfluidic mixer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-[#a69b8d] block mb-1">
                  Target batch volume (mL)
                </label>
                <input
                  type="number"
                  min={0.5}
                  max={1000}
                  step={1}
                  value={batchVolumeMl}
                  onChange={(e) =>
                    setBatchVolumeMl(Math.max(0.1, parseFloat(e.target.value) || 10))
                  }
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="w-full p-2 border font-mono-seq text-xs text-[#e8dfd1] outline-none focus:border-[#4d828f]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#a69b8d] block mb-1">
                  mRNA concentration (mg/mL)
                </label>
                <input
                  type="number"
                  min={0.05}
                  max={20}
                  step={0.1}
                  value={batchMrnaConcMgMl}
                  onChange={(e) =>
                    setBatchMrnaConcMgMl(Math.max(0.05, parseFloat(e.target.value) || 1))
                  }
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="w-full p-2 border font-mono-seq text-xs text-[#e8dfd1] outline-none focus:border-[#4d828f]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#a69b8d] block mb-1">
                  N/P Charge Ratio
                </label>
                <div className="p-2 border border-[#2e2923] rounded bg-[#181613] font-mono-seq text-xs text-[#e8dfd1] flex items-center justify-between">
                  <span>{lnpForm.npRatio.toFixed(1)}:1</span>
                  <span className="text-[10px] text-[#70675c]">Amine : Phosphate</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#a69b8d] block mb-1">
                  Total Lipid:mRNA Ratio
                </label>
                <div className="p-2 border border-[#2e2923] rounded bg-[#181613] font-mono-seq text-xs text-[#e8dfd1] flex items-center justify-between">
                  <span>{(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w</span>
                  <span className="text-[10px] text-[#73a880]">Clinical Standard</span>
                </div>
              </div>
            </div>

            {/* Mass & Concentration Breakdown Table */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#a69b8d] text-[11px]"
                  >
                    <th className="py-2 px-2.5 font-medium">Component</th>
                    <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Molar %</th>
                    <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Mass to Weigh (mg)</th>
                    <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Concentration (mM)</th>
                    <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Phase / Role</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{ borderColor: tokens.colors.borderMuted }}
                    className="border-b text-[11px]"
                  >
                    <td className="py-2 px-2.5 font-semibold text-[#e8dfd1]">
                      mRNA Payload (Base Editor &amp; sgRNA)
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono-seq text-[#a69b8d]">—</td>
                    <td className="py-2 px-2.5 text-right font-mono-seq font-bold text-[#e8dfd1]">
                      {batchCalculation.totalMrnaMassMg} mg
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono-seq text-[#a69b8d]">
                      {batchMrnaConcMgMl.toFixed(2)} mg/mL
                    </td>
                    <td className="py-2 px-2.5 text-right text-[#a69b8d]">Therapeutic Payload</td>
                  </tr>
                  {batchCalculation.components.map((c, i) => (
                    <tr
                      key={i}
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px] hover:bg-[#1a1714]"
                    >
                      <td className="py-2 px-2.5 text-[#e8dfd1] font-medium">{c.name}</td>
                      <td className="py-2 px-2.5 text-right font-mono-seq text-[#a69b8d]">
                        {c.molarPct.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                        {c.massMg} mg
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono-seq text-[#a69b8d]">
                        {c.molarConcMm} mM
                      </td>
                      <td className="py-2 px-2.5 text-right text-[#70675c] text-[10px]">
                        {c.name.includes('Ionizable')
                          ? 'Core Condensation'
                          : c.name.includes('Helper')
                          ? 'Bilayer Rigidity'
                          : c.name.includes('Cholesterol')
                          ? 'Membrane Fluidity'
                          : 'Stealth Corona'}
                      </td>
                    </tr>
                  ))}
                  <tr className="text-xs font-bold text-[#e8dfd1] bg-[#181613]">
                    <td className="py-2.5 px-2.5">Total Lipid Formulation</td>
                    <td className="py-2.5 px-2.5 text-right font-mono-seq">100.0%</td>
                    <td className="py-2.5 px-2.5 text-right font-mono-seq text-[#d4a359]">
                      {batchCalculation.totalLipidMassMg} mg
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono-seq text-[#a69b8d]">
                      Total Vol: {batchVolumeMl.toFixed(1)} mL
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-[#5e946c] text-[11px]">
                      N/P = {lnpForm.npRatio.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Ready-to-Order Commercial Oligo Synthesis Portal (IDT & GenScript CSVs) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Commercial synthesis order sheets (BsmBI Golden Gate cloning oligos)
                </h2>
                <span className="text-[10px] font-mono-seq px-1.5 py-0.5 rounded bg-[#211e1a] text-[#73a880] border border-[#332e27]">
                  5′ G added for U6 when needed
                </span>
              </div>
              <span className="text-[11px] text-[#70675c]">
                Pre-formatted bulk CSVs for direct commercial synthesis upload
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* IDT Order Card */}
              <div className="p-3.5 rounded-[3px] bg-[#161411] border border-[#2e2923] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#e8dfd1]">Integrated DNA Technologies (IDT)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#24201b] text-[#4d828f] border border-[#332e27]">
                      4-Column CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a69b8d] leading-relaxed">
                    Standard IDT bulk order format (<code className="text-[#98c2cc]">Name,Sequence,Scale,Purification</code>) with CACC/AAAC BsmBI overhangs and 5&apos;-G for human U6 promoter initiation.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#24201b] flex-wrap">
                  <button
                    onClick={() => handleDownloadIdt(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#e8dfd1] flex items-center gap-1.5 transition cursor-pointer"
                    title="Download single CSV for selected candidate"
                  >
                    <Download className="w-3.5 h-3.5 text-[#4d828f]" />
                    <span>Download Top Guide ({selectedGuide?.id ?? 'sgRNA-f1'}) CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownloadIdt(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center gap-1.5 transition cursor-pointer"
                    title="Download combined CSV for all discovered candidates"
                  >
                    <Download className="w-3.5 h-3.5 text-[#a69b8d]" />
                    <span>All {processedGuides.length} Candidates CSV</span>
                  </button>
                </div>
              </div>

              {/* GenScript Order Card */}
              <div className="p-3.5 rounded-[3px] bg-[#161411] border border-[#2e2923] flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-[#e8dfd1]">GenScript Molecular Portal</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#24201b] text-[#d4a359] border border-[#332e27]">
                      8-Column Batch CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-[#a69b8d] leading-relaxed">
                    Compliant with GenScript High-Throughput Oligo Synthesis: 50 nmol scale, standard desalt purification, and sequence checksum notation.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#24201b] flex-wrap">
                  <button
                    onClick={() => handleDownloadGenScript(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#e8dfd1] flex items-center gap-1.5 transition cursor-pointer"
                    title="Download single CSV for selected candidate"
                  >
                    <Download className="w-3.5 h-3.5 text-[#4d828f]" />
                    <span>Download Top Guide ({selectedGuide?.id ?? 'sgRNA-f1'}) CSV</span>
                  </button>
                  <button
                    onClick={() => handleDownloadGenScript(true)}
                    className="px-3 py-1.5 text-xs font-medium rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center gap-1.5 transition cursor-pointer"
                    title="Download combined CSV for all discovered candidates"
                  >
                    <Download className="w-3.5 h-3.5 text-[#a69b8d]" />
                    <span>All {processedGuides.length} Candidates CSV</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pre-IND Regulatory Dossier Module 3 CMC Launch Desk */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3.5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Pre-IND Regulatory Technical Dossier (ICH M4Q / FDA eCTD Module 3 CMC)
                </h2>
                <span className="text-[10px] font-mono-seq px-1.5 py-0.5 rounded bg-[#0f766e]/20 text-[#2dd4bf] border border-[#0f766e]/40">
                  9 Regulatory Modules Ready
                </span>
              </div>
              <span className="text-[11px] text-[#70675c]">
                Pre-IND submission package for CDER / CBER review
              </span>
            </div>

            <p className="text-[11px] text-[#a69b8d] leading-relaxed">
              Review and print the complete technical dossier organized across <strong>3.2.S (Drug Substance: Engineered Cas9 RNP &amp; Modified sgRNA)</strong> and <strong>3.2.P (Drug Product: Encapsulated LNP Suspension)</strong>. Includes Sugimoto heteroduplex thermodynamics, Turner 2004 MFE partition, pan-allele South Asian HLA de-immunization audits, and microfluidic batch release criteria.
            </p>

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button
                onClick={() => setIsDossierModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-[3px] bg-[#0f766e] hover:bg-[#115e59] text-white flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Launch Pre-IND Dossier Modal (Interactive &amp; Print/PDF)</span>
              </button>
              <button
                onClick={downloadDraDossier}
                className="px-3.5 py-2 text-xs font-medium rounded-[3px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#e8dfd1] flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#4d828f]" />
                <span>Export Pre-IND Technical Dossier (.md)</span>
              </button>
              <button
                onClick={handleExportTopFasta}
                className="px-3.5 py-2 text-xs font-medium rounded-[3px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] hover:border-[#4d828f] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#a69b8d]" />
                <span>Export Multi-Record FASTA (.fasta)</span>
              </button>
            </div>
          </div>
        </section>
      )}
      </main>

      {/* Pre-IND Regulatory Technical Dossier Modal */}
      <PreIndDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        preset={activePreset}
        selectedGuide={selectedGuide}
        allGuides={allGuides}
        formulation={activeFormulation}
        biophysics={biophysics}
        batchCalculation={batchCalculation}
        batchVolumeMl={batchVolumeMl}
        batchMrnaConcMgMl={batchMrnaConcMgMl}
        selectedHlaAlleles={selectedHlaAlleles}
        patientRelevantEpitopes={patientRelevantEpitopes}
        activeStealthMutations={activeStealthMutations}
        residualHlaRisk={residualHlaRisk}
        backendThermo={backendThermo}
        onExportFasta={handleExportTopFasta}
        onExportMarkdown={downloadDraDossier}
      />

      {/* Web Tour for Newcomers: Interactive Step-by-Step Clinical Walkthrough */}
      <ClinicalTourController
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeCase={tourCase}
        onSelectCase={(caseId) => setTourCase(caseId)}
        currentTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onApplyTargetSettings={applyTourTargetSettings}
        onApplyFormulation={(form) => setLnpForm((prev) => sanitizeLnpFormulation(form, prev))}
        onApplyHlaPanel={applyTourHlaPanel}
        onSetBatchParameters={(volMl, concMgMl) => {
          setBatchVolumeMl(volMl);
          setBatchMrnaConcMgMl(concMgMl);
        }}
        onOpenDossier={() => setIsDossierModalOpen(true)}
        backendThermo={backendThermo}
      />
    </div>
  );
}
