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
  type BaseEditorType,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset,
  type PamVariant,
  type BystanderEdit,
} from './engines/bioEngines';
import { editorFor, toWorkbenchGuide, toWorkbenchSnps } from './engines/crispr/workbenchAdapter';
import { NanoViewport3D } from './components/NanoViewport3D';
import { LnpFormulationPanel } from './components/LnpFormulationPanel';
import { SequenceWorkbench } from './components/SequenceWorkbench';
import { HendersonHasselbalchCurve } from './components/HendersonHasselbalchCurve';
import { ToolButton } from './components/ui/controls';
import { PreIndDossierModal } from './components/PreIndDossierModal';
import { ClinicalTourController, type CaseStudyId } from './components/ClinicalTourController';
import type { DashboardTab } from './engines/types';
import {
  downloadIdtOrderSheet,
  downloadGenScriptOrderSheet,
} from './engines/crispr/orderSheetGenerator';
import { tokens } from './styles/tokens';
import {
  Share2,
  Download,
  Check,
  Copy,
  FileText,
  Search,
  Globe,
  Sparkles,
  Compass,
  GraduationCap,
  FlaskConical,
  Dna,
  Shield,
  LayoutGrid,
  Layers,
  X,
  Info,
  ChevronRight,
} from 'lucide-react';

type SortField = 'id' | 'strand' | 'gcContent' | 'CompositeScore' | 'pam';
type SortOrder = 'asc' | 'desc';

// Helper for precision clinical nucleotide channels (Adenine, Thymine, Guanine, Cytosine)
const getBaseColorClass = (base: string) => {
  switch (base.toUpperCase()) {
    case 'A':
      return 'text-[#E5484D]'; // Vermilion Red (Target base edit A->G)
    case 'T':
      return 'text-[#F5A623]'; // Ochre Amber
    case 'G':
      return 'text-[#38D399]'; // Phosphor Mint (NGG PAM)
    case 'C':
      return 'text-[#5B9BD5]'; // Cobalt Blue
    default:
      return 'text-[#EAE6DF]';
  }
};

// Oligo Golden Gate BsmBI 5' overhang highlights (CACC & AAAC in #F5A623, rest in #EAE6DF)
const renderForwardOligo = (oligo: string) => {
  const upper = oligo.toUpperCase();
  if (upper.startsWith('CACC')) {
    return (
      <>
        <span className="text-[#F5A623] font-bold">{oligo.slice(0, 4)}</span>
        <span className="text-[#EAE6DF]">{oligo.slice(4)}</span>
      </>
    );
  }
  return <span className="text-[#EAE6DF]">{oligo}</span>;
};

const renderReverseOligo = (oligo: string) => {
  const upper = oligo.toUpperCase();
  if (upper.startsWith('AAAC')) {
    return (
      <>
        <span className="text-[#F5A623] font-bold">{oligo.slice(0, 4)}</span>
        <span className="text-[#EAE6DF]">{oligo.slice(4)}</span>
      </>
    );
  }
  return <span className="text-[#EAE6DF]">{oligo}</span>;
};

// Codon mutation highlight (mutated base in #F5A623)
const renderEditedCodon = (origCodon: string, editedCodon: string) => {
  return (
    <span className="font-mono-seq tracking-wider">
      {editedCodon.split('').map((char, idx) => {
        const isMutated = origCodon[idx] !== char;
        return (
          <span
            key={idx}
            className={isMutated ? 'text-[#F5A623] font-bold underline' : getBaseColorClass(char)}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

// Semantic verdict badge with solid color design (Optimal/Safe = emerald, Low Efficiency = amber, Risk = red)
const renderVerdictBadge = (verdict: GuideCandidate['verdict']) => {
  if (verdict.includes('Optimal') || verdict.includes('Safe')) {
    return (
      <span className="status-badge-success" title={verdict}>
        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 opacity-90" />
        <span className="truncate max-w-[160px]">{verdict}</span>
      </span>
    );
  }
  if (verdict.includes('Risk')) {
    return (
      <span className="status-badge-danger" title={verdict}>
        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 opacity-90" />
        <span className="truncate max-w-[160px]">{verdict}</span>
      </span>
    );
  }
  return (
    <span className="status-badge-warning" title={verdict}>
      <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 opacity-90" />
      <span className="truncate max-w-[160px]">{verdict}</span>
    </span>
  );
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
    <div className="p-3 bg-[#16181A] border border-[#2E3338] border-l-4 border-l-[#F5A623] rounded-[2px] flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans font-semibold uppercase px-2 py-0.5 rounded-[2px] bg-[#d97706] text-white shadow-xs">
            {stage}
          </span>
          <span className="font-display font-semibold text-xs text-[#EAE6DF] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#F5A623]" />
            {title}
          </span>
        </div>
        {badgeText && (
          <span className="text-[10px] text-[#98A1A6] font-mono-seq">{badgeText}</span>
        )}
      </div>
      <p className="text-[#98A1A6] text-[11px] leading-relaxed">{subtitle}</p>
      {bulletPoints && bulletPoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-[#2E3338]">
          {bulletPoints.map((point, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#EAE6DF]">
              <ChevronRight className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
              <span className="text-[#98A1A6] leading-tight">{point}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

  const startClinicalWalkthrough = (caseId: CaseStudyId = 'HBB') => {
    setTourCase(caseId);
    setSelectedPresetId(caseId);
    setIsCustomMode(false);
    setSelectedGuideId(null);
    setIsTourOpen(true);
  };

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

  // ClinVar bystander enrichment state
  const [annotatedBystanders, setAnnotatedBystanders] = useState<BystanderEdit[]>([]);

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

  // Asynchronous ClinVar & Grantham bystander pathogenicity enrichment
  useEffect(() => {
    if (!selectedGuide || selectedGuide.bystanders.length === 0) {
      setAnnotatedBystanders([]);
      return;
    }
    let isCurrent = true;
    remoteBioEngineService
      .annotateBystandersWithClinVar(activePreset.id, selectedGuide.bystanders)
      .then((annotated: BystanderEdit[]) => {
        if (isCurrent && annotated && annotated.length > 0) {
          setAnnotatedBystanders(annotated);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setAnnotatedBystanders(selectedGuide.bystanders);
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [selectedGuide, activePreset.id]);

  const handleEnsemblGeneSearch = async (symbolToSearch?: string) => {
    const sym = (symbolToSearch || geneSearchQuery).trim().toUpperCase();
    if (!sym) return;
    setIsSearchingGene(true);
    setGeneSearchError(null);
    try {
      const result = await remoteBioEngineService.fetchExternalGene(sym);
      if (result && !result.error && result.sequence) {
        setCustomPreset({
          id: result.id || sym,
          symbol: result.symbol || `${sym} (Ensembl GRCh38)`,
          name: result.name || `${sym} Gene Target`,
          disease: result.disease || `Investigational Target (${sym})`,
          targetOrgan: result.targetOrgan || 'Liver',
          editorType: result.editorType || 'ABE8e (A→G)',
          pamVariant: result.pamVariant || 'SpCas9',
          sequence: result.sequence,
          mutationIndex: Math.min(21, Math.max(0, result.sequence.length - 1)),
          sasSnpIndex: Math.min(42, Math.max(0, result.sequence.length - 1)),
          sasSnpId: result.sasSnpId || `Ensembl-${result.canonicalTranscriptId || 'CDS'}`,
          sasAlleleFreq: result.sasAlleleFreq ?? 0.05,
          clinicalNote: result.clinicalNote || `Ensembl REST API live annotation for ${sym}.`,
          _source: result._source || 'live_api',
          isExploratoryPrototype: true,
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
    try {
      const res = await remoteBioEngineService.fetchExternalVariant(vid);
      if (res && !res.variantId.includes('offline')) {
        if (res.sasFrequency !== undefined) {
          setCustomPreset((prev) => ({
            ...prev,
            sasSnpId: res.variantId,
            sasAlleleFreq: res.sasFrequency ?? prev.sasAlleleFreq,
            clinicalNote: `${prev.clinicalNote} [${res.name}: ${(res.clinicalSignificance || []).join(', ')}]`,
          }));
        }
      } else {
        setVariantSearchError('Variant unmapped or server offline.');
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
        ? 'Collision flagged with ' + activePreset.sasSnpId
        : 'Clear of common SAS polymorphisms (' +
          activePreset.sasSnpId +
          ', MAF: ' +
          (activePreset.sasAlleleFreq * 100).toFixed(1) +
          '%)'
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
- Formulation classification: ${biophysics.stabilityStatus}

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

  const renderTargetHeader = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="instrument-status-dot dot-sequence" />
          <span className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
            {activePreset.symbol} ({activePreset.name})
          </span>
          {/* Data Provenance Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-sans uppercase tracking-wider font-semibold text-white shadow-xs border border-white/10 ${
              activePreset._source === 'live_api'
                ? 'bg-[#0284c7]'
                : activePreset._source === 'cached'
                ? 'bg-[#2563eb]'
                : activePreset._source === 'fallback'
                ? 'bg-[#d97706]'
                : 'bg-[#059669]'
            }`}
            title={
              activePreset._source === 'live_api'
                ? 'Extracted live from Ensembl REST API (GRCh38)'
                : activePreset._source === 'cached'
                ? 'Loaded from local persistent bio_cache SQLite database'
                : activePreset._source === 'fallback'
                ? 'Offline heuristic fallback proxy'
                : 'Curated peer-reviewed clinical disease target'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-white ${
                activePreset._source === 'live_api' ? 'animate-pulse' : 'opacity-90'
              }`}
            />
            {activePreset._source === 'live_api'
              ? 'Live Ensembl REST'
              : activePreset._source === 'cached'
              ? 'Bio-Cache (Offline)'
              : activePreset._source === 'fallback'
              ? 'Offline Fallback'
              : 'Curated Clinical'}
          </span>
          {activePreset.isExploratoryPrototype && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-[2px] text-[9.5px] font-sans font-semibold bg-[#d97706] text-white shadow-xs border border-white/10"
              title="Target position 21 is a demo coordinate for initial guide scanning feasibility; specify clinical variant coordinate for formal IND evaluation."
            >
              Exploratory Prototype (Locus 21 Demo)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#98A1A6]">
          <span>
            Target tissue:{' '}
            <strong className="text-[#EAE6DF] font-medium">
              {activePreset.targetOrgan}
            </strong>
          </span>
          <span className="text-[#3A4046]">•</span>
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
              className="bg-[#111315] border border-[#2E3338] rounded-[2px] px-2 py-0.5 text-xs text-[#EAE6DF] outline-none cursor-pointer hover:border-[#38BDF8] focus:border-[#38BDF8]"
              title="Switch base editor architecture (ABE8e, ABE9 narrow window, BE4max)"
            >
              {Object.keys(BASE_EDITOR_DEFINITIONS).map((ed) => (
                <option key={ed} value={ed}>
                  {ed}
                </option>
              ))}
            </select>
          </label>
          <span className="text-[#3A4046]">•</span>
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
              className="bg-[#111315] border border-[#2E3338] rounded-[2px] px-2 py-0.5 text-xs text-[#EAE6DF] outline-none cursor-pointer hover:border-[#38BDF8] focus:border-[#38BDF8]"
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

      <div className="p-2.5 flex flex-col gap-1 text-xs bg-[#1E2124]">
        <div className="text-[#98A1A6] flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Clinical indication:{' '}
            <span className="text-[#EAE6DF] font-medium">{activePreset.disease}</span>
          </span>
          <span>
            PAM mode:{' '}
            <span className="text-[#EAE6DF] font-mono-seq">
              {activePamDefinition.recognition}
            </span>
          </span>
          <span>
            Deaminase window:{' '}
            <span className="text-[#EAE6DF] font-mono-seq">
              spacer pos {editorWindowLabel}
            </span>
          </span>
        </div>
        <p className="text-[#646D73] text-[11px] mt-0.5 leading-relaxed">
          {activePreset.clinicalNote}
        </p>
      </div>
    </div>
  );

  const renderBiophysicalCards = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <div className="instrument-header-title">
          <span className="instrument-status-dot dot-lnp" />
          <span>CALCULATED BIOPHYSICAL PROPERTIES</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={
              biophysics.stabilityStatus === 'Optimal Clinical LNP'
                ? 'status-badge-success'
                : 'status-badge-warning'
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
            <span>{biophysics.stabilityStatus}</span>
          </span>
        </div>
      </div>

      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#1E2124]">
        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">Hydrodynamic diameter</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.diameterNm} <span className="text-[13px] text-[#949DA3] font-normal">nm</span>
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            PDI: {biophysics.pdi.toFixed(2)}
          </div>
        </div>

        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">Zeta potential (pH 7.4)</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.zetaPotentialMv > 0 ? `+${biophysics.zetaPotentialMv}` : biophysics.zetaPotentialMv}{' '}
            <span className="text-[13px] text-[#949DA3] font-normal">mV</span>
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            Blood ionized: {biophysics.bloodProtonationPct}%
          </div>
        </div>

        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">Endosomal ionization</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.endosomalProtonationPct} <span className="text-[13px] text-[#949DA3] font-normal">%</span>
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            At late endosome pH 5.5
          </div>
        </div>

        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">ApoE uptake score</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.cellularUptakeScore} <span className="text-[13px] text-[#949DA3] font-normal">/ 100</span>
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            Escape eff: {biophysics.endosomalEscapeEfficiency}%
          </div>
        </div>

        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">De Gennes brush (RF/D)</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.deGennesRfOverD?.toFixed(2) ?? '—'}
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            {(biophysics.deGennesRfOverD ?? 0) >= 1.0 ? 'Dense Brush' : 'Mushroom Regime'}
          </div>
        </div>

        <div className="biophysical-card p-2.5 bg-[#262A2E] border border-[#2E3338] rounded-[2px] flex flex-col justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[#98A1A6]">Packing param (CPP)</div>
          <div className="font-mono-seq text-[20px] font-bold text-[#EAE6DF] my-0.5">
            {biophysics.criticalPackingParam?.toFixed(2) ?? '—'}
          </div>
          <div className="border-t border-[#1F2428] pt-1 text-[11px] text-[#949DA3] font-mono-seq sub-metric font-medium">
            SAXS d: {biophysics.saxsBraggSpacingNm ?? 6.1} nm
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrganBiodistribution = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <div className="instrument-header-title">
          <span className="instrument-status-dot dot-lnp" />
          <span>PREDICTED ORGAN BIODISTRIBUTION (SORT MODEL)</span>
        </div>
        <span className="text-[11px] text-[#949DA3]">Apparent charge partitioning</span>
      </div>

      <div className="p-2 flex flex-col gap-1.5 bg-[#1E2124] text-xs">
        <div>
          <div className="flex justify-between mb-0.5 text-[11px]">
            <span className="text-[#98A1A6]">Liver (hepatocytes)</span>
            <span className="font-mono-seq font-semibold text-[#EAE6DF]">
              {biophysics.organTropism.liver}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] overflow-hidden">
            <div
              style={{
                width: `${biophysics.organTropism.liver}%`,
                backgroundColor: 'var(--lipid-ionizable, #D97736)',
              }}
              className="h-full transition-all duration-300"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-0.5 text-[11px]">
            <span className="text-[#98A1A6]">Spleen (lymphoid / immune cells)</span>
            <span className="font-mono-seq font-semibold text-[#EAE6DF]">
              {biophysics.organTropism.spleen}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] overflow-hidden">
            <div
              style={{
                width: `${biophysics.organTropism.spleen}%`,
                backgroundColor: 'var(--lipid-helper-dspc, #38BDF8)',
              }}
              className="h-full transition-all duration-300"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-0.5 text-[11px]">
            <span className="text-[#98A1A6]">Lungs (endothelial beds)</span>
            <span className="font-mono-seq font-semibold text-[#EAE6DF]">
              {biophysics.organTropism.lungs}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] overflow-hidden">
            <div
              style={{
                width: `${biophysics.organTropism.lungs}%`,
                backgroundColor: 'var(--lipid-peg, #38D399)',
              }}
              className="h-full transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTop3GuidesCard = () => {
    const top3 = processedGuides.slice(0, 3);
    return (
      <div className="instrument-panel">
        <div className="instrument-header">
          <div className="instrument-header-title">
            <span className="instrument-status-dot dot-sequence" />
            <span>TOP 3 CANDIDATE GUIDES (TARGET LOCUS)</span>
          </div>
          <button
            onClick={() => setActiveTab('crispr')}
            className="tactile-btn text-xs"
            title="Switch to Base Editor tab to view all 10 candidates, filters, and cloning architecture"
          >
            <span>View all {processedGuides.length} candidates &amp; Cloning Oligos &rarr;</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
              <tr>
                <th className="py-2 px-2.5 font-medium">Guide ID</th>
                <th className="py-2 px-2.5 font-medium">Strand</th>
                <th className="py-2 px-2.5 font-medium">Protospacer (5&apos; &rarr; 3&apos;)</th>
                <th className="py-2 px-2.5 font-medium">PAM</th>
                <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Score</th>
                <th className="py-2 px-2.5 font-medium">Bystanders</th>
                <th className="py-2 px-2.5 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {top3.map((guide, idx) => {
                const isSelected = selectedGuide?.id === guide.id;
                return (
                  <tr
                    key={guide.id}
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`border-b border-[#2E3338] cursor-pointer transition text-[11px] hover:bg-[#2A2F34] ${
                      isSelected
                        ? 'bg-[#262A2E] border-l-4 border-l-[#38BDF8]'
                        : idx % 2 === 0
                        ? 'bg-[#1E2124]'
                        : 'bg-[#16191C]'
                    }`}
                  >
                    <td className="py-2 px-2.5 font-mono-seq text-[#EAE6DF]">
                      <span className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                        )}
                        <span className={isSelected ? 'font-bold text-[#38BDF8]' : ''}>
                          {guide.id}
                        </span>
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-mono-seq">
                      <span
                        className={
                          guide.strand === '+' ? 'text-[#38D399]' : 'text-[#5B9BD5]'
                        }
                      >
                        {guide.strand === '+' ? '(+) Sense' : '(-) Antisense'}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 font-mono-seq tracking-wider">
                      {guide.spacer.split('').map((char, charIdx) => (
                        <span key={charIdx} className={getBaseColorClass(char)}>
                          {char}
                        </span>
                      ))}
                    </td>
                    <td className="py-2 px-2.5 font-mono-seq font-semibold text-[#F5A623]">
                      {guide.pam}
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono-seq font-semibold text-[#EAE6DF]">
                      {guide.CompositeScore}
                    </td>
                    <td className="py-2 px-2.5">
                      {guide.bystanders.length === 0 ? (
                        <span className="text-[#646D73] font-mono-seq text-[11px]">None</span>
                      ) : (
                        <span className="text-[#F5A623] font-mono-seq text-[11px] font-medium">
                          {guide.bystanders.length} bystander{guide.bystanders.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5">
                      {renderVerdictBadge(guide.verdict)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderImmunoShieldSummaryStrip = () => (
    <div className="instrument-panel immunoshield-dock">
      <div className="instrument-header">
        <div className="instrument-header-title">
          <span className="instrument-status-dot dot-immunology" />
          <span>IMMUNOSHIELD-DRA IMMUNOGENICITY PROFILE</span>
        </div>
        <button
          onClick={() => setActiveTab('immunology')}
          className="tactile-btn text-xs"
          title="Switch to ImmunoShield tab to configure patient HLA alleles and de-immunization mutations"
        >
          <span>Configure HLA Panel &rarr;</span>
        </button>
      </div>

      <div className="p-3 bg-[#1E2124] flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={
                residualHlaRisk === null
                  ? 'status-badge-neutral'
                  : residualHlaRisk <= 20
                  ? 'status-badge-success'
                  : residualHlaRisk <= 55
                  ? 'status-badge-warning'
                  : 'status-badge-danger'
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span>
                CTL Risk: {residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
              </span>
            </span>

            <span
              className={
                allStealthEnabled ? 'status-badge-success' : 'status-badge-warning'
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
              <span>
                {allStealthEnabled
                  ? `All ${patientRelevantEpitopes.length} selected stealth mutations: Active`
                  : 'Stealth mutations: Partial / Inactive'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#98A1A6]">Patient HLA Alleles:</span>
            {selectedHlaAlleles.slice(0, 5).map((allele) => (
              <span
                key={allele}
                className="px-2 py-0.5 rounded-[2px] bg-[#059669] text-white text-[10px] font-sans font-semibold shadow-xs border border-white/10"
              >
                {allele}
              </span>
            ))}
            {selectedHlaAlleles.length > 5 && (
              <span className="text-[10px] text-[#949DA3]">+{selectedHlaAlleles.length - 5} more</span>
            )}
          </div>
        </div>

        <div className="border-t border-[#2E3338] pt-2 text-[11px] text-[#98A1A6] leading-relaxed flex items-center justify-between flex-wrap gap-2">
          <span>
            De-immunized SpCas9 neutralizes cytotoxic T-lymphocyte (CTL) surface epitopes across high-frequency South Asian HLA Class I/II haplotypes while maintaining catalytic triad stability.
          </span>
          <span className="text-[10px] font-mono-seq text-[#949DA3]">
            D10 / H840 Catalytic Triad: Intact
          </span>
        </div>
      </div>
    </div>
  );

  const renderProtospacerTable = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <div className="flex flex-wrap items-center gap-2">
          <span className="instrument-status-dot dot-sequence" />
          <span className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
            Discovered protospacers ({processedGuides.length} candidates)
          </span>
          <span className="text-[11px] text-[#646D73]">
            Dual-strand (+) and (-) search
          </span>
        </div>

        {/* Filtering Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#98A1A6]">
            <span>Strand:</span>
            <select
              value={filterStrand}
              onChange={(e) => setFilterStrand(e.target.value as any)}
              className="bg-[#111315] border border-[#2E3338] rounded-[2px] p-1 text-xs text-[#EAE6DF] outline-none hover:border-[#38BDF8]"
            >
              <option value="all">All strands (+/-)</option>
              <option value="+">Sense (+) only</option>
              <option value="-">Antisense (-) only</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-[#98A1A6] hover:text-[#EAE6DF]">
            <input
              type="checkbox"
              checked={preferredPamOnly}
              onChange={(e) => setPreferredPamOnly(e.target.checked)}
              className="accent-[#38BDF8]"
            />
            <span>{activePamDefinition.preferredPamLabel}</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[#98A1A6] hover:text-[#EAE6DF]">
            <input
              type="checkbox"
              checked={hideSnpCollisions}
              onChange={(e) => setHideSnpCollisions(e.target.checked)}
              className="accent-[#38BDF8]"
            />
            <span>Exclude SAS SNP collisions</span>
          </label>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="overflow-x-auto max-h-[340px]">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
            <tr>
              <th
                className="py-2 px-2.5 font-medium cursor-pointer hover:text-[#EAE6DF]"
                onClick={() => handleSort('id')}
              >
                Guide ID
              </th>
              <th
                className="py-2 px-2.5 font-medium cursor-pointer hover:text-[#EAE6DF]"
                onClick={() => handleSort('strand')}
              >
                Strand
              </th>
              <th className="py-2 px-2.5 font-medium">Protospacer (5&apos; &rarr; 3&apos;)</th>
              <th
                className="py-2 px-2.5 font-medium cursor-pointer hover:text-[#EAE6DF]"
                onClick={() => handleSort('pam')}
              >
                PAM
              </th>
              <th
                className="py-2 px-2.5 font-medium text-right cursor-pointer hover:text-[#EAE6DF]"
                onClick={() => handleSort('gcContent')}
              >
                GC%
              </th>
              <th
                className="py-2 px-2.5 font-medium text-right cursor-pointer hover:text-[#EAE6DF]"
                onClick={() => handleSort('CompositeScore')}
              >
                Score
              </th>
              <th className="py-2 px-2.5 font-medium">Bystanders</th>
              <th className="py-2 px-2.5 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {processedGuides.map((guide, idx) => {
              const isSelected = selectedGuide?.id === guide.id;

              return (
                <tr
                  key={guide.id}
                  onClick={() => setSelectedGuideId(guide.id)}
                  className={`border-b border-[#2E3338] cursor-pointer transition text-[11px] hover:bg-[#2A2F34] ${
                    isSelected
                      ? 'bg-[#262A2E] border-l-4 border-l-[#38BDF8]'
                      : idx % 2 === 0
                      ? 'bg-[#1E2124]'
                      : 'bg-[#16191C]'
                  }`}
                >
                  <td className="py-2 px-2.5 font-mono-seq text-[#EAE6DF]">
                    <span className="flex items-center gap-1.5">
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                      )}
                      <span className={isSelected ? 'font-bold text-[#38BDF8]' : ''}>
                        {guide.id}
                      </span>
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-mono-seq">
                    <span
                      className={
                        guide.strand === '+' ? 'text-[#38D399]' : 'text-[#5B9BD5]'
                      }
                    >
                      {guide.strand === '+' ? '(+) Sense' : '(-) Antisense'}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 font-mono-seq tracking-wider">
                    {guide.spacer.split('').map((char, charIdx) => (
                      <span key={charIdx} className={getBaseColorClass(char)}>
                        {char}
                      </span>
                    ))}
                  </td>
                  <td className="py-2 px-2.5 font-mono-seq font-semibold text-[#F5A623]">
                    {guide.pam}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-seq text-[#98A1A6]">
                    {guide.gcContent.toFixed(1)}%
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono-seq font-semibold text-[#EAE6DF]">
                    {guide.CompositeScore}
                  </td>
                  <td className="py-2 px-2.5">
                    {guide.bystanders.length === 0 ? (
                      <span className="text-[#646D73] font-mono-seq text-[11px]">None</span>
                    ) : (
                      <span className="text-[#F5A623] font-mono-seq text-[11px] font-medium">
                        {guide.bystanders.length} bystander{guide.bystanders.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2.5">
                    {renderVerdictBadge(guide.verdict)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCloningAndBystandersSideBySide = () => {
    if (!selectedGuide) return null;

    const displayedBystanders =
      annotatedBystanders.length === selectedGuide.bystanders.length
        ? annotatedBystanders
        : selectedGuide.bystanders;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Cloning Architecture */}
        {cloningOligos && (
          <div className="instrument-panel">
            <div className="instrument-header">
              <div className="flex flex-wrap items-center gap-2">
                <span className="instrument-status-dot dot-sequence" />
                <span className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
                  {selectedGuide.id} Cloning Architecture
                </span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-[2px] bg-[#0284c7] text-white shadow-xs border border-white/10">
                  Overhangs: {cloningOligos.overhangSystem}
                </span>
              </div>
              <span className="text-[11px] text-[#98A1A6]">
                GC: {selectedGuide.gcContent.toFixed(1)}% • Score: {selectedGuide.CompositeScore}/100 • Target in window: {selectedGuide.targetInWindow ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="p-3 bg-[#1E2124] flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#98A1A6]">Forward Oligo (CACC overhang):</span>
                  <button
                    onClick={() => handleCopyOligo(cloningOligos.forwardOligo, 'fwd')}
                    className="tactile-btn text-[10px] py-1 px-2"
                  >
                    {copiedOligo === 'fwd' ? (
                      <Check className="w-3 h-3 text-[#38D399]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedOligo === 'fwd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-[2px] bg-[#0A0C0E] border border-[#2E3338] font-mono-seq text-[11px] break-all select-all shadow-inner">
                  {renderForwardOligo(cloningOligos.forwardOligo)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#98A1A6]">Reverse Oligo (AAAC overhang):</span>
                  <button
                    onClick={() => handleCopyOligo(cloningOligos.reverseOligo, 'rev')}
                    className="tactile-btn text-[10px] py-1 px-2"
                  >
                    {copiedOligo === 'rev' ? (
                      <Check className="w-3 h-3 text-[#38D399]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedOligo === 'rev' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-[2px] bg-[#0A0C0E] border border-[#2E3338] font-mono-seq text-[11px] break-all select-all shadow-inner">
                  {renderReverseOligo(cloningOligos.reverseOligo)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right: Deaminase Window Bystander Consequences */}
        <div className="instrument-panel">
          <div className="instrument-header">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="instrument-status-dot dot-amber" />
              <span className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
                Deaminase window (spacer pos {editorWindowLabel}) bystander consequences
              </span>
              <span className="status-badge-success text-[10px]">
                <Sparkles className="w-3 h-3 text-white" />
                ClinVar &amp; Grantham Evaluated
              </span>
            </div>
            <span className="text-[11px] text-[#646D73]">
              {displayedBystanders.length} potential edits in window
            </span>
          </div>

          <div className="p-2 bg-[#1E2124]">
            {displayedBystanders.length === 0 ? (
              <p className="text-[11px] text-[#646D73] py-4 text-center">
                No editable bases found within active deamination window ({editorWindowLabel}). Clean on-target window.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
                    <tr>
                      <th className="py-1.5 px-2 font-medium">Spacer pos</th>
                      <th className="py-1.5 px-2 font-medium">Genomic bp</th>
                      <th className="py-1.5 px-2 font-medium">Original codon</th>
                      <th className="py-1.5 px-2 font-medium">Edited codon</th>
                      <th className="py-1.5 px-2 font-medium">Consequence</th>
                      <th className="py-1.5 px-2 font-medium">ClinVar &amp; Grantham</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedBystanders.map((b, i) => {
                      const isSafe =
                        b.classification === 'Target Edit' ||
                        b.classification === 'Silent (Synonymous)';

                      return (
                        <tr
                          key={i}
                          className="border-b border-[#2E3338] text-[11px] hover:bg-[#2A2F34] transition"
                        >
                          <td className="py-1.5 px-2 font-mono-seq text-[#98A1A6]">{b.guidePos}</td>
                          <td className="py-1.5 px-2 font-mono-seq text-[#98A1A6]">
                            bp {b.genomicIndex + 1}
                          </td>
                          <td className="py-1.5 px-2 font-mono-seq tracking-wider">
                            {b.originalCodon.split('').map((ch, cIdx) => (
                              <span key={cIdx} className={getBaseColorClass(ch)}>
                                {ch}
                              </span>
                            ))}
                            <span className="text-[#98A1A6] ml-1">({b.originalAA})</span>
                          </td>
                          <td className="py-1.5 px-2 font-mono-seq tracking-wider">
                            {renderEditedCodon(b.originalCodon, b.editedCodon)}
                            <span className="text-[#EAE6DF] ml-1 font-semibold">({b.editedAA})</span>
                          </td>
                          <td className="py-1.5 px-2">
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isSafe ? 'bg-[#38D399]' : 'bg-[#E5484D]'
                                }`}
                              />
                              <span
                                className={
                                  b.classification === 'Silent (Synonymous)'
                                    ? 'text-[#38D399] font-medium'
                                    : b.classification === 'Target Edit'
                                    ? 'text-[#38BDF8] font-medium'
                                    : 'text-[#E5484D] font-medium'
                                }
                              >
                                {b.classification}
                              </span>
                            </span>
                          </td>
                          <td className="py-1.5 px-2">
                            {b.clinvarTag ? (
                              <div className="flex flex-col gap-0.5">
                                <span
                                  className={`font-medium text-[10px] ${
                                    b.riskLevel?.includes('Pathogenic')
                                      ? 'text-[#E5484D]'
                                      : b.riskLevel?.includes('Low') || b.riskLevel?.includes('Benign')
                                      ? 'text-[#38D399]'
                                      : 'text-[#38BDF8]'
                                  }`}
                                >
                                  {b.clinvarTag}
                                </span>
                                {b.biochemicalImpact && (
                                  <span
                                    className="text-[9.5px] text-[#646D73] leading-tight max-w-[200px] truncate block"
                                    title={b.biochemicalImpact}
                                  >
                                    {b.biochemicalImpact}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#646D73]">Evaluating...</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderImmunoShieldFullModule = () => (
    <div className="instrument-panel">
      <div className="instrument-header">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="instrument-status-dot dot-immunology" />
          <h2 className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
            ImmunoShield-DRA: Cas9 surface epitope immunogenicity (South Asian HLA panel)
          </h2>
          <span
            className={
              residualHlaRisk === null
                ? 'status-badge-neutral'
                : residualHlaRisk <= 20
                ? 'status-badge-success'
                : residualHlaRisk <= 55
                ? 'status-badge-warning'
                : 'status-badge-danger'
            }
          >
            CTL Risk: {residualHlaRisk === null ? 'Not assessed' : `${residualHlaRisk} / 100`}
          </span>
        </div>

        <button
          onClick={toggleAllStealth}
          disabled={!hasPatientHlaSelection || patientRelevantEpitopes.length === 0}
          className="tactile-btn text-xs"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              allStealthEnabled ? 'bg-[#38D399]' : 'bg-[#F5A623]'
            }`}
          />
          <span>
            {!hasPatientHlaSelection
              ? 'Select patient HLA alleles'
              : allStealthEnabled
              ? `All ${patientRelevantEpitopes.length} selected stealth mutations: Active`
              : 'Restore selected stealth mutations'}
          </span>
        </button>
      </div>

      <div className="p-3 bg-[#1E2124] flex flex-col gap-3">
        <fieldset className="bg-[#111315] border border-[#2E3338] rounded-[2px] px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <legend className="text-[11px] font-semibold text-[#EAE6DF] uppercase tracking-wider">
              Patient HLA haplotype / allele set
            </legend>
            <div className="flex items-center gap-3 text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedHlaAlleles([...SOUTH_ASIAN_HLA_ALLELES])}
                className="text-[#38BDF8] hover:underline cursor-pointer"
              >
                Select full panel
              </button>
              <button
                type="button"
                onClick={() => setSelectedHlaAlleles([])}
                className="text-[#98A1A6] hover:text-[#EAE6DF] hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SOUTH_ASIAN_HLA_ALLELES.map((allele) => (
              <label
                key={allele}
                className="flex items-center gap-1.5 cursor-pointer text-[11px] text-[#98A1A6] hover:text-[#EAE6DF]"
              >
                <input
                  type="checkbox"
                  checked={selectedHlaAlleles.includes(allele)}
                  onChange={() => togglePatientHlaAllele(allele)}
                  className="accent-[#38D399]"
                />
                <span className="font-mono-seq">{allele}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#646D73]">
            Only epitopes associated with selected patient alleles contribute to the composite residual-risk score.
          </p>
        </fieldset>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
              <tr>
                <th className="py-2 px-2.5 font-medium">Epitope peptide</th>
                <th className="py-2 px-2.5 font-medium">Residues</th>
                <th className="py-2 px-2.5 font-medium">Protein domain</th>
                <th className="py-2 px-2.5 font-medium">South Asian HLA allele</th>
                <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Risk score</th>
                <th className="py-2 px-2.5 font-medium">De-immunization mutation</th>
              </tr>
            </thead>
            <tbody>
              {!hasPatientHlaSelection ? (
                <tr>
                  <td colSpan={6} className="py-4 px-2 text-center text-[11px] text-[#646D73]">
                    Select one or more patient HLA alleles above to assess the curated epitope panel.
                  </td>
                </tr>
              ) : patientRelevantEpitopes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 px-2 text-center text-[11px] text-[#646D73]">
                    No curated panel epitopes match the selected HLA alleles.
                  </td>
                </tr>
              ) : (
                patientRelevantEpitopes.map((ep, idx) => {
                  const isShielded = activeStealthMutations[ep.peptide];
                  return (
                    <tr
                      key={ep.peptide}
                      className={`border-b border-[#2E3338] text-[11px] hover:bg-[#2A2F34] transition ${
                        idx % 2 === 0 ? 'bg-[#1E2124]' : 'bg-[#16191C]'
                      }`}
                    >
                      <td className="py-2 px-2.5 font-mono-seq font-semibold text-[#EAE6DF]">
                        {ep.peptide}
                      </td>
                      <td className="py-2 px-2.5 font-mono-seq text-[#98A1A6]">
                        {ep.residueRange}
                      </td>
                      <td className="py-2 px-2.5 text-[#98A1A6]">{ep.domain}</td>
                      <td className="py-2 px-2.5 font-mono-seq text-[#98A1A6]">{ep.hlaAllele}</td>
                      <td className="py-2 px-2.5 text-right font-mono-seq">
                        {isShielded ? (
                          <span className="text-[#38D399] font-medium">&lt;10</span>
                        ) : (
                          <span className="text-[#E5484D] font-semibold">
                            {ep.bindingScore} / 100
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2.5">
                        <label className="flex items-center gap-2 cursor-pointer text-[#EAE6DF]">
                          <input
                            type="checkbox"
                            checked={isShielded}
                            onChange={() => toggleSingleEpitope(ep.peptide)}
                            className="accent-[#38D399]"
                            aria-label={`Enable ${ep.stealthMutation}`}
                          />
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isShielded ? 'bg-[#38D399]' : 'bg-[#E5484D]'
                            }`}
                          />
                          <span className="font-mono-seq">
                            {isShielded ? ep.stealthMutation : 'Wild-type (unmodified anchor residue)'}
                          </span>
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
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-chassis-deep, #141618)',
        color: 'var(--text-primary-ink, #EAE6DF)',
        fontFamily: tokens.typography.fontSans,
      }}
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#38BDF8]/30 selection:text-[#EAE6DF]"
    >
      {/* Top Application Header / Precision Lab Instrument Bar */}
      <header
        style={{
          backgroundColor: 'var(--bg-panel-header, #16181A)',
          borderColor: 'var(--border-chassis, #2E3338)',
        }}
        className={`border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 ${isDossierModalOpen ? 'print:hidden' : ''}`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: 'var(--signal-halide-cyan, #38BDF8)',
                borderRadius: '2px',
              }}
              className="w-2 h-3.5 inline-block"
            />
            <span className="font-display font-bold text-sm tracking-tight text-[#EAE6DF]">
              NanoCRISPR-3D
            </span>
            <span className="text-[#646D73] text-xs hidden sm:inline">/</span>
            <span className="text-[#98A1A6] text-xs hidden sm:inline">
              Base editor &amp; lipid nanoparticle evaluation workbench
            </span>
          </div>

          {/* Target Gene Selector Hardware Switches */}
          <div className="switch-track-recessed">
            {GENE_PRESETS.map((preset) => {
              const isActive = !isCustomMode && selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setIsCustomMode(false);
                    setEditorOverride(null);
                    setPamOverride(null);
                    setSelectedGuideId(null);
                  }}
                  className={`switch-btn-tactile ${isActive ? 'active' : ''}`}
                >
                  {isActive && <span className="led-indicator-dot" />}
                  <span>{preset.id}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                setIsCustomMode(true);
                setSelectedGuideId(null);
              }}
              className={`switch-btn-tactile ${isCustomMode ? 'active' : ''}`}
            >
              {isCustomMode && <span className="led-indicator-dot" />}
              <span>Custom</span>
            </button>
          </div>

          {/* Dedicated Audience Mode Hardware Switch: Newcomer vs Expert Workbench */}
          <div className="switch-track-recessed text-xs">
            <button
              onClick={() => setWorkbenchMode('newcomer')}
              className={`switch-btn-tactile ${workbenchMode === 'newcomer' ? 'active' : ''}`}
              title="Newcomer Guided Mode: streamlined walkthroughs, educational tips, and clinical presets"
            >
              {workbenchMode === 'newcomer' && <span className="led-indicator-dot" />}
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Newcomer Mode</span>
            </button>
            <button
              onClick={() => setWorkbenchMode('expert')}
              className={`switch-btn-tactile ${workbenchMode === 'expert' ? 'active' : ''}`}
              title="Expert Studio: unconstrained raw telemetry, custom sequence engineering, and deep biophysical controls"
            >
              {workbenchMode === 'expert' && <span className="led-indicator-dot" />}
              <Layers className="w-3.5 h-3.5" />
              <span>Expert Studio</span>
            </button>
          </div>
        </div>

        {/* Right action bar: tour, calculator and dossier, files, link */}
        <div className="flex items-center gap-x-3 gap-y-2 flex-wrap">
          <ToolButton
            icon={<Compass className="w-3.5 h-3.5" />}
            onClick={() => startClinicalWalkthrough('HBB')}
            title="Start the step-by-step clinical walkthrough (sickle cell HBB case)"
          >
            Clinical tour
          </ToolButton>

          <ToolButton
            pressed={batchCalcOpen}
            onClick={openBatchCalculator}
            title={
              activeTab === 'overview'
                ? 'Show or hide the wet-lab batch mass calculator'
                : 'Open the Batch tab with the wet-lab batch mass calculator'
            }
          >
            Batch mass calculator
          </ToolButton>

          <ToolButton
            icon={<FileText className="w-3.5 h-3.5" />}
            onClick={() => setIsDossierModalOpen(true)}
            title="Open the pre-IND regulatory technical dossier (ICH M4Q / FDA eCTD Module 3 CMC)"
          >
            Pre-IND dossier
          </ToolButton>

          <div className="h-4 w-[1px] bg-[#2E3338] mx-0.5" />

          <ToolButton
            icon={fastaSaved ? <Check className="w-3.5 h-3.5 text-[#38D399]" /> : <Download className="w-3.5 h-3.5" />}
            done={fastaSaved}
            onClick={handleExportTopFasta}
            title="Download a multi-record FASTA (.fasta): wild-type and edited CDS, both polypeptides and the protospacer"
          >
            {fastaSaved ? 'FASTA saved' : 'FASTA'}
          </ToolButton>

          <ToolButton
            icon={reportSaved ? <Check className="w-3.5 h-3.5 text-[#38D399]" /> : <Download className="w-3.5 h-3.5" />}
            done={reportSaved}
            onClick={downloadDraDossier}
            title="Download the pre-IND CMC and preclinical evaluation report as Markdown (.md)"
          >
            {reportSaved ? 'Report saved' : 'Pre-IND report (.md)'}
          </ToolButton>

          <ToolButton
            icon={shareCopied ? <Check className="w-3.5 h-3.5 text-[#38D399]" /> : <Share2 className="w-3.5 h-3.5" />}
            done={shareCopied}
            onClick={handleShareConfig}
            title={
              isCustomMode
                ? 'Copy a link to the editor, PAM, guide and formulation. A custom sequence is not stored in the link.'
                : 'Copy a link that restores this target, editor, PAM, guide and formulation'
            }
          >
            {shareCopied ? 'Link copied' : 'Share config'}
          </ToolButton>
        </div>
      </header>

      {/* Clinical Workflow Navigation Bar with Dedicated Modes */}
      <nav
        style={{
          backgroundColor: 'var(--bg-panel-header, #16181A)',
          borderColor: 'var(--border-chassis, #2E3338)',
        }}
        className="border-b px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto select-none shrink-0"
        aria-label="Workflow Navigation"
      >
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'overview', label: 'Panoramic Overview', icon: LayoutGrid, count: null, desc: 'Executive Clinical Workbench — holistic multi-track view' },
              { id: 'crispr', label: '1. Base Editor', icon: Dna, count: `${processedGuides.length} guides`, desc: 'Protospacers, bystanders & BsmBI cloning oligos' },
              { id: 'lnp', label: '2. LNP Biophysics', icon: FlaskConical, count: `${biophysics.diameterNm}nm`, desc: '3D Cutaway, Henderson-Hasselbalch, CPP & SAXS' },
              { id: 'immunology', label: '3. ImmunoShield', icon: Shield, count: residualHlaRisk !== null ? `CTL ${residualHlaRisk}` : null, desc: 'South Asian HLA Class I/II de-immunization' },
              { id: 'batch', label: '4. Batch & Dossier', icon: FileText, count: `${batchCalculation.totalLipidMassMg}mg`, desc: 'Microfluidic mass scaling, IDT/GenScript & Pre-IND' },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`switch-btn-tactile px-3 py-1.5 text-xs ${isActive ? 'active' : ''}`}
                title={tab.desc}
              >
                {isActive && <span className="led-indicator-dot" />}
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-[#38BDF8]' : 'text-[#98A1A6]'
                  }`}
                />
                <span className={isActive ? 'text-[#EAE6DF] font-semibold' : 'text-[#98A1A6]'}>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`text-[10px] font-mono-seq px-1.5 py-0.2 rounded-[2px] ${
                      isActive
                        ? 'bg-[#141618] text-[#38D399] border border-[#2E3338]'
                        : 'bg-[#111315] text-[#646D73]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Guided case study launcher in navigation bar */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#646D73]">
            <span>Active mode:</span>
            <span className="text-[#F5A623] font-medium font-display">
              {workbenchMode === 'newcomer' ? 'Newcomer Guided' : 'Expert Studio'}
            </span>
          </div>

          <button
            onClick={() => startClinicalWalkthrough(selectedPresetId === 'TTR' ? 'TTR' : 'HBB')}
            className="tactile-btn text-[11px] py-1 px-2.5 text-[#F5A623] hover:text-[#FFFFFF]"
            title="Start interactive guided walkthrough"
          >
            <Compass className="w-3.5 h-3.5 text-[#F5A623]" />
            <span>Tour Case Study</span>
          </button>
        </div>
      </nav>

      {/* Newcomer Onboarding Guidance Banner */}
      {workbenchMode === 'newcomer' && !dismissedNewcomerBanner && (
        <div className="mx-4 mt-3 p-3.5 bg-[#16181A] border border-[#2E3338] border-l-4 border-l-[#F5A623] rounded-[2px] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-8 rounded-[2px] bg-[#F5A623]/15 border border-[#F5A623]/30 text-[#F5A623] flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-xs text-[#EAE6DF]">
                  Newcomer Guide: Translational Nanomedicine &amp; Precision Base Editing
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-[2px] bg-[#d97706] text-white font-semibold shadow-xs border border-white/10">
                  Dedicated Newcomer Mode Active
                </span>
              </div>
              <p className="text-[#98A1A6] text-[11px] leading-relaxed">
                Welcome to NanoCRISPR-3D! This platform bridges 4 translational pillars: <strong>(1) Precision CRISPR base editing</strong> without double-strand DNA breaks, <strong>(2) Biophysical lipid nanoparticle (LNP) delivery</strong> with endosomal escape (<code className="text-[#38BDF8]">CPP &ge; 1.45</code>), <strong>(3) ImmunoShield South Asian HLA de-immunization</strong>, and <strong>(4) Wet-lab microfluidic mass scaling</strong>.
              </p>
              <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                <button
                  onClick={() => startClinicalWalkthrough('HBB')}
                  className="tactile-btn text-xs bg-[#0f766e] hover:bg-[#115e59] text-white border-teal-600"
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
                  className="tactile-btn text-[11px]"
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
                  className="tactile-btn text-[11px]"
                >
                  <span>Case 2: Amyloidosis (NTLA-2001 Benchmark)</span>
                </button>
                <button
                  onClick={() => setWorkbenchMode('expert')}
                  className="text-[11px] text-[#646D73] hover:text-[#98A1A6] underline ml-2 transition cursor-pointer"
                >
                  Switch to Expert Studio
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setDismissedNewcomerBanner(true)}
            className="text-[#646D73] hover:text-[#EAE6DF] p-1 transition cursor-pointer shrink-0 self-start md:self-center"
            title="Dismiss newcomer guide banner"
            aria-label="Dismiss newcomer guide banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom Sequence Input Drawer (when active) */}
      {isCustomMode && (
        <div className="border-b border-[#2E3338] bg-[#1E2124] px-4 py-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-xs tracking-tight text-[#EAE6DF]">
              Custom Target Sequence Configuration
            </span>
            <span className="text-[11px] text-[#646D73]">
              Dual-strand scanning will search both (+) and (-) orientations
            </span>
          </div>

          {/* Tier 2: Live Biological Database Search Bar */}
          <div className="p-2.5 bg-[#16181A] border border-[#2E3338] rounded-[2px] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 flex-1">
              <span className="font-semibold text-[11px] text-[#EAE6DF] flex items-center gap-1.5 shrink-0">
                <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
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
                  className="px-2 py-1 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] text-xs font-mono-seq text-[#EAE6DF] outline-none w-36 uppercase focus:border-[#38BDF8]"
                />
                <button
                  onClick={() => handleEnsemblGeneSearch()}
                  disabled={isSearchingGene}
                  className="tactile-btn text-xs"
                >
                  <Search className="w-3 h-3 text-[#38BDF8]" />
                  <span>{isSearchingGene ? 'Querying...' : 'Fetch CDS'}</span>
                </button>
              </div>

              {/* Preset Chips */}
              <div className="flex items-center gap-1 flex-wrap text-[10px]">
                <span className="text-[#646D73]">Quick load:</span>
                {['CFTR', 'HEXA', 'LDLR', 'DMD', 'HBA1'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      setGeneSearchQuery(sym);
                      handleEnsemblGeneSearch(sym);
                    }}
                    className="px-1.5 py-0.5 rounded-[2px] border border-[#2E3338] bg-[#111315] text-[#98A1A6] hover:text-[#EAE6DF] hover:border-[#38BDF8] transition cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* dbSNP / ClinVar Variant Lookup */}
            <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-3 border-[#2E3338] shrink-0">
              <span className="text-[11px] text-[#98A1A6]">SAS SNP:</span>
              <input
                type="text"
                placeholder="rs10768683"
                value={variantSearchQuery}
                onChange={(e) => setVariantSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVariantSearch();
                }}
                className="px-2 py-1 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] text-xs font-mono-seq text-[#EAE6DF] outline-none w-28 focus:border-[#38BDF8]"
              />
              <button
                onClick={handleVariantSearch}
                disabled={isSearchingVariant}
                className="tactile-btn text-xs py-1 px-2 text-[#EAE6DF] disabled:opacity-50"
              >
                {isSearchingVariant ? '...' : 'Verify'}
              </button>
            </div>
          </div>

          {geneSearchError && (
            <div className="text-[11px] text-[#FF6B6B] bg-[#2A1718] border border-[#522923] px-2.5 py-1 rounded-[2px]">
              {geneSearchError}
            </div>
          )}

          {variantSearchError && (
            <div className="text-[11px] text-[#FF6B6B] bg-[#2A1718] border border-[#522923] px-2.5 py-1 rounded-[2px]">
              {variantSearchError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                className="w-full p-2 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-[11px] text-[#EAE6DF] outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none"
              />

              <label className="text-[11px] text-[#98A1A6] block mt-2 mb-1">
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
                className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] text-xs text-[#EAE6DF] outline-none"
              >
                {Object.entries(BASE_EDITOR_DEFINITIONS).map(([editorType, definition]) => (
                  <option key={editorType} value={editorType}>
                    {editorType} — positions {definition.editingWindow[0]}–{definition.editingWindow[1]}
                  </option>
                ))}
              </select>

              <label className="text-[11px] text-[#98A1A6] block mt-2 mb-1">
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
                className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] text-xs text-[#EAE6DF] outline-none"
              >
                {Object.entries(PAM_VARIANT_DEFINITIONS).map(([pamVariant, definition]) => (
                  <option key={pamVariant} value={pamVariant}>
                    {definition.label} — {definition.recognition}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] text-xs text-[#EAE6DF] outline-none"
              >
                <option value="Liver">Liver (Hepatocytes)</option>
                <option value="Bone Marrow (HSPC)">Bone Marrow (HSPC)</option>
                <option value="Lung">Lung (Endothelium)</option>
              </select>

              <label className="text-[11px] text-[#98A1A6] block mt-2 mb-1">
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
                className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Workstation Layout */}
      <main className={`flex-1 w-full max-w-[1920px] mx-auto p-3 ${isDossierModalOpen ? 'print:hidden' : ''}`}>
        {/* TAB 0: PANORAMIC OVERVIEW (Executive Clinical Workbench - Fits cleanly without endless table scrolling) */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Left Column: Target header, Sequence track, Top 3 guides summary, ImmunoShield status */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {workbenchMode === 'newcomer' && (
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
              {renderTargetHeader()}
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
              {renderTop3GuidesCard()}
              {renderImmunoShieldSummaryStrip()}
            </div>

            {/* Right Column: 3D LNP cutaway, 6-card biophysics telemetry, pH ionization curve, and SORT biodistribution */}
            <div className="lg:col-span-5 flex flex-col gap-2">
              <NanoViewport3D formulation={activeFormulation} biophysics={biophysics} />
              {renderBiophysicalCards()}
              <HendersonHasselbalchCurve lipidPka={lnpForm.lipidPka} />
              {renderOrganBiodistribution()}

              {/* Wet-Lab Batch Preparation Mass Calculator (Toggleable accordion in Overview) */}
              {showBatchCalc && (
                <div className="instrument-panel">
                  <div className="instrument-header">
                    <div className="instrument-header-title">
                      <span className="instrument-status-dot dot-amber" />
                      <span>WET-LAB BATCH PREPARATION CALCULATOR</span>
                    </div>
                    <span className="text-[11px] text-[#646D73]">Microfluidic mixing protocol</span>
                  </div>

                  <div className="p-3 bg-[#1E2124] flex flex-col gap-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                          className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                          className="w-full p-1.5 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto pt-1">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
                          <tr>
                            <th className="py-1 px-1.5 font-medium">Component</th>
                            <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Molar %</th>
                            <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Mass to weigh</th>
                            <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Conc (mM)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#2E3338] text-[11px]">
                            <td className="py-1 px-1.5 font-semibold text-[#EAE6DF]">mRNA payload</td>
                            <td className="py-1 px-1.5 text-right font-mono-seq text-[#98A1A6]">—</td>
                            <td className="py-1 px-1.5 text-right font-mono-seq font-semibold text-[#EAE6DF]">
                              {batchCalculation.totalMrnaMassMg} mg
                            </td>
                            <td className="py-1 px-1.5 text-right font-mono-seq text-[#98A1A6]">
                              {batchMrnaConcMgMl.toFixed(2)} mg/mL
                            </td>
                          </tr>
                          {batchCalculation.components.map((c, i) => (
                            <tr key={i} className="border-b border-[#2E3338] text-[11px]">
                              <td className="py-1 px-1.5 text-[#EAE6DF]">{c.name}</td>
                              <td className="py-1 px-1.5 text-right font-mono-seq text-[#98A1A6]">
                                {c.molarPct.toFixed(1)}%
                              </td>
                              <td className="py-1 px-1.5 text-right font-mono-seq font-medium text-[#EAE6DF]">
                                {c.massMg} mg
                              </td>
                              <td className="py-1 px-1.5 text-right font-mono-seq text-[#98A1A6]">
                                {c.molarConcMm} mM
                              </td>
                            </tr>
                          ))}
                          <tr className="text-[11px] font-semibold text-[#EAE6DF] bg-[#16181A]">
                            <td className="py-1 px-1.5">Total Lipids</td>
                            <td className="py-1 px-1.5 text-right font-mono-seq">100.0%</td>
                            <td className="py-1 px-1.5 text-right font-mono-seq text-[#F5A623]">
                              {batchCalculation.totalLipidMassMg} mg
                            </td>
                            <td className="py-1 px-1.5 text-right font-mono-seq text-[#98A1A6]">
                              Ratio: {(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: 1. BASE EDITOR (Full-width detailed protospacer discovery, oligo cloning & bystander audits) */}
        {activeTab === 'crispr' && (
          <div className="flex flex-col gap-3">
            {workbenchMode === 'newcomer' && (
              <NewcomerStageTip
                stage="Stage 1: Base Editing"
                title="Precision Deamination & Protospacer Discovery"
                subtitle="Adenine (ABE8e) and Cytosine (BE4max) base editors chemically modify target nucleotides within the catalytic window (typically positions 4–8) without creating double-strand DNA breaks. Evaluate candidate sgRNAs, audit bystander modifications for pathogenicity, and retrieve Golden Gate BsmBI cloning oligos."
                badgeText="Dual-Strand (+) / (-) Protospacer Search"
                bulletPoints={[
                  "Dual-strand candidate search with canonical NGG PAM variants",
                  "Bystander codon audit with ClinVar & Grantham impact scores",
                  "Golden Gate BsmBI cloning oligos with U6 transcription 5'-G",
                ]}
              />
            )}
            {renderTargetHeader()}
            <SequenceWorkbench
              title={`${activePreset.symbol} coding sequence`}
              sequence={activePreset.sequence}
              editor={workbenchEditor}
              guides={workbenchGuides}
              snps={workbenchSnps}
              targetPos={activePreset.mutationIndex}
              selectedGuideId={selectedGuide?.id ?? null}
              onSelectGuide={setSelectedGuideId}
              audit="full"
            />
            {renderProtospacerTable()}
            {renderCloningAndBystandersSideBySide()}
          </div>
        )}

        {/* TAB 2: 2. LNP BIOPHYSICS (Dedicated two-column: Left 3D + telemetry; Right formulations & curve) */}
        {activeTab === 'lnp' && (
          <div className="flex flex-col gap-3">
            {workbenchMode === 'newcomer' && (
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Left Column: 3D Cutaway + Biophysical Properties */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <NanoViewport3D formulation={activeFormulation} biophysics={biophysics} />
                {renderBiophysicalCards()}
              </div>

              {/* Right Column: LNP Formulation Panel + Biodistribution */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <LnpFormulationPanel form={lnpForm} onChange={setLnpForm} biophysics={biophysics} />
                {renderOrganBiodistribution()}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 3. IMMUNOSHIELD (Full-width de-immunization matrix & HLA allele selector) */}
        {activeTab === 'immunology' && (
          <div className="flex flex-col gap-3">
            {workbenchMode === 'newcomer' && (
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
            {renderTargetHeader()}
            {renderImmunoShieldFullModule()}
          </div>
        )}

        {/* TAB 4: 4. BATCH & DOSSIER (Full-width microfluidic batch calculation & pre-IND technical dossier) */}
        {activeTab === 'batch' && (
          <div className="flex flex-col gap-3">
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
            {renderTargetHeader()}

            {/* Wet-Lab Batch Preparation Mass Calculator (Full Width) */}
            <div className="instrument-panel">
              <div className="instrument-header">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="instrument-status-dot dot-amber" />
                  <h2 className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
                    Wet-lab microfluidic batch preparation calculator
                  </h2>
                  <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-[2px] bg-[#d97706] text-white shadow-xs border border-white/10">
                    Flow Ratio 3:1 (Aqueous:Ethanol)
                  </span>
                </div>
                <span className="text-[11px] text-[#646D73]">
                  Physical component mass requirements for NanoAssemblr / microfluidic mixer
                </span>
              </div>

              <div className="p-3.5 bg-[#1E2124] flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                      className="w-full p-2 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#98A1A6] block mb-1">
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
                      className="w-full p-2 bg-[#0A0C0E] border border-[#2E3338] rounded-[2px] font-mono-seq text-xs text-[#EAE6DF] outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#98A1A6] block mb-1">
                      N/P Charge Ratio
                    </label>
                    <div className="p-2 border border-[#2E3338] rounded-[2px] bg-[#0A0C0E] font-mono-seq text-xs text-[#EAE6DF] flex items-center justify-between">
                      <span>{lnpForm.npRatio.toFixed(1)}:1</span>
                      <span className="text-[10px] text-[#646D73]">Amine : Phosphate</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#98A1A6] block mb-1">
                      Total Lipid:mRNA Ratio
                    </label>
                    <div className="p-2 border border-[#2E3338] rounded-[2px] bg-[#0A0C0E] font-mono-seq text-xs text-[#EAE6DF] flex items-center justify-between">
                      <span>{(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w</span>
                      <span className="text-[10px] text-[#38D399]">Clinical Standard</span>
                    </div>
                  </div>
                </div>

                {/* Mass & Concentration Breakdown Table */}
                <div className="overflow-x-auto pt-1">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead className="bg-[#16181A] text-[#98A1A6] text-[11px] border-b border-[#2E3338]">
                      <tr>
                        <th className="py-2 px-2.5 font-medium">Component</th>
                        <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Molar %</th>
                        <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Mass to Weigh (mg)</th>
                        <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Concentration (mM)</th>
                        <th className="py-2 px-2.5 font-medium text-right font-mono-seq">Phase / Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#2E3338] text-[11px]">
                        <td className="py-2 px-2.5 font-semibold text-[#EAE6DF]">
                          mRNA Payload (Base Editor &amp; sgRNA)
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono-seq text-[#98A1A6]">—</td>
                        <td className="py-2 px-2.5 text-right font-mono-seq font-bold text-[#EAE6DF]">
                          {batchCalculation.totalMrnaMassMg} mg
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono-seq text-[#98A1A6]">
                          {batchMrnaConcMgMl.toFixed(2)} mg/mL
                        </td>
                        <td className="py-2 px-2.5 text-right text-[#98A1A6]">Therapeutic Payload</td>
                      </tr>
                      {batchCalculation.components.map((c, i) => (
                        <tr
                          key={i}
                          className="border-b border-[#2E3338] text-[11px] hover:bg-[#2A2F34]"
                        >
                          <td className="py-2 px-2.5 text-[#EAE6DF] font-medium">{c.name}</td>
                          <td className="py-2 px-2.5 text-right font-mono-seq text-[#98A1A6]">
                            {c.molarPct.toFixed(1)}%
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono-seq font-semibold text-[#EAE6DF]">
                            {c.massMg} mg
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono-seq text-[#98A1A6]">
                            {c.molarConcMm} mM
                          </td>
                          <td className="py-2 px-2.5 text-right text-[#646D73] text-[10px]">
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
                      <tr className="text-xs font-bold text-[#EAE6DF] bg-[#16181A]">
                        <td className="py-2.5 px-2.5">Total Lipid Formulation</td>
                        <td className="py-2.5 px-2.5 text-right font-mono-seq">100.0%</td>
                        <td className="py-2.5 px-2.5 text-right font-mono-seq text-[#F5A623]">
                          {batchCalculation.totalLipidMassMg} mg
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono-seq text-[#98A1A6]">
                          Total Vol: {batchVolumeMl.toFixed(1)} mL
                        </td>
                        <td className="py-2.5 px-2.5 text-right text-[#38D399] text-[11px]">
                          N/P = {lnpForm.npRatio.toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Ready-to-Order Commercial Oligo Synthesis Portal (IDT & GenScript CSVs) */}
            <div className="instrument-panel">
              <div className="instrument-header">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="instrument-status-dot dot-sequence" />
                  <h2 className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
                    Commercial synthesis order sheets (BsmBI Golden Gate cloning oligos)
                  </h2>
                  <span className="status-badge-success text-[10px]">
                    IUPAC &amp; U6 Validated
                  </span>
                </div>
                <span className="text-[11px] text-[#646D73]">
                  Pre-formatted bulk CSVs for direct commercial synthesis upload
                </span>
              </div>

              <div className="p-3.5 bg-[#1E2124] grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* IDT Order Card */}
                <div className="p-3.5 rounded-[2px] bg-[#16181A] border border-[#2E3338] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#EAE6DF]">Integrated DNA Technologies (IDT)</span>
                      <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-[2px] bg-[#0284c7] text-white shadow-xs border border-white/10">
                        4-Column CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-[#98A1A6] leading-relaxed">
                      Standard IDT bulk order format (<code className="text-[#38BDF8]">Name,Sequence,Scale,Purification</code>) with CACC/AAAC BsmBI overhangs and 5&apos;-G for human U6 promoter initiation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2E3338] flex-wrap">
                    <button
                      onClick={() => handleDownloadIdt(false)}
                      className="tactile-btn text-xs"
                      title="Download single CSV for selected candidate"
                    >
                      <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Download Top Guide ({selectedGuide?.id ?? 'sgRNA-f1'}) CSV</span>
                    </button>
                    <button
                      onClick={() => handleDownloadIdt(true)}
                      className="tactile-btn text-xs text-[#98A1A6]"
                      title="Download combined CSV for all discovered candidates"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>All {processedGuides.length} Candidates CSV</span>
                    </button>
                  </div>
                </div>

                {/* GenScript Order Card */}
                <div className="p-3.5 rounded-[2px] bg-[#16181A] border border-[#2E3338] flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#EAE6DF]">GenScript Molecular Portal</span>
                      <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-[2px] bg-[#d97706] text-white shadow-xs border border-white/10">
                        8-Column Batch CSV
                      </span>
                    </div>
                    <p className="text-[11px] text-[#98A1A6] leading-relaxed">
                      Compliant with GenScript High-Throughput Oligo Synthesis: 50 nmol scale, standard desalt purification, and sequence checksum notation.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2E3338] flex-wrap">
                    <button
                      onClick={() => handleDownloadGenScript(false)}
                      className="tactile-btn text-xs"
                      title="Download single CSV for selected candidate"
                    >
                      <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Download Top Guide ({selectedGuide?.id ?? 'sgRNA-f1'}) CSV</span>
                    </button>
                    <button
                      onClick={() => handleDownloadGenScript(true)}
                      className="tactile-btn text-xs text-[#98A1A6]"
                      title="Download combined CSV for all discovered candidates"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>All {processedGuides.length} Candidates CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-IND Regulatory Dossier Module 3 CMC Launch Desk */}
            <div className="instrument-panel">
              <div className="instrument-header">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="instrument-status-dot dot-immunology" />
                  <h2 className="font-semibold text-xs tracking-wide text-[#EAE6DF] uppercase">
                    Pre-IND Regulatory Technical Dossier (ICH M4Q / FDA eCTD Module 3 CMC)
                  </h2>
                  <span className="status-badge-success text-[10px]">
                    9 Regulatory Modules Ready
                  </span>
                </div>
                <span className="text-[11px] text-[#646D73]">
                  Pre-IND submission package for CDER / CBER review
                </span>
              </div>

              <div className="p-3.5 bg-[#1E2124] flex flex-col gap-3">
                <p className="text-[11px] text-[#98A1A6] leading-relaxed">
                  Review and print the complete technical dossier organized across <strong>3.2.S (Drug Substance: Engineered Cas9 RNP &amp; Modified sgRNA)</strong> and <strong>3.2.P (Drug Product: Encapsulated LNP Suspension)</strong>. Includes Sugimoto heteroduplex thermodynamics, Turner 2004 MFE partition, pan-allele South Asian HLA de-immunization audits, and microfluidic batch release criteria.
                </p>

                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    onClick={() => setIsDossierModalOpen(true)}
                    className="tactile-btn text-xs bg-[#0f766e] hover:bg-[#115e59] text-white border-teal-600 font-semibold"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Launch Pre-IND Dossier Modal (Interactive &amp; Print/PDF)</span>
                  </button>
                  <button
                    onClick={downloadDraDossier}
                    className="tactile-btn text-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Export Pre-IND Technical Dossier (.md)</span>
                  </button>
                  <button
                    onClick={handleExportTopFasta}
                    className="tactile-btn text-xs text-[#98A1A6]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Multi-Record FASTA (.fasta)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
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
        onExportFasta={handleExportTopFasta}
        onExportMarkdown={downloadDraDossier}
      />

      {/* Web Tour for Newcomers: Interactive Step-by-Step Clinical Walkthrough */}
      <ClinicalTourController
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        activeCase={tourCase}
        onSelectCase={(caseId) => {
          setTourCase(caseId);
          setSelectedPresetId(caseId);
          setIsCustomMode(false);
          setSelectedGuideId(null);
        }}
        currentTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onApplyPreset={(presetId) => {
          setSelectedPresetId(presetId);
          setIsCustomMode(false);
          setSelectedGuideId(null);
        }}
        // Index 0 is the top-ranked guide, which is what an unset selection already shows.
        onSelectGuideIndex={(idx) => setSelectedGuideId(idx === 0 ? null : (processedGuides[idx]?.id ?? null))}
        onApplyFormulation={(form) => setLnpForm((prev) => sanitizeLnpFormulation(form, prev))}
        onToggleHlaAllele={togglePatientHlaAllele}
        onToggleStealthMutation={toggleSingleEpitope}
        onSetBatchParameters={(volMl, concMgMl) => {
          setBatchVolumeMl(volMl);
          setBatchMrnaConcMgMl(concMgMl);
        }}
        onOpenDossier={() => setIsDossierModalOpen(true)}
      />
    </div>
  );
}
