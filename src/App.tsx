// src/App.tsx
import { useState, useMemo, useEffect } from 'react';
import {
  GENE_PRESETS,
  BASE_EDITOR_DEFINITIONS,
  PAM_VARIANT_DEFINITIONS,
  bioEngineService,
  calculateHlaRiskScore,
  filterEpitopesByHlaAlleles,
  isPreferredPam,
  SOUTH_ASIAN_HLA_ALLELES,
  type BaseEditorType,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset,
  type PamVariant,
} from './engines/bioEngines';
import { NanoViewport3D } from './components/NanoViewport3D';
import { GenomicSequenceViewer } from './components/GenomicSequenceViewer';
import { tokens } from './styles/tokens';
import { Share2, Download, Check, Copy } from 'lucide-react';

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

const STORAGE_KEY = 'nanocrispr_workbench_config_v2';

interface SavedWorkbenchConfig {
  presetId?: string;
  isCustom?: boolean;
  editor?: BaseEditorType;
  pam?: PamVariant;
  guideIdx?: number;
  ionizable?: number;
  dspc?: number;
  peg?: number;
  pka?: number;
  np?: number;
}

function parseUrlOrStorageConfig(): SavedWorkbenchConfig | null {
  try {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const hasUrlParams =
      params.has('preset') || params.has('editor') || params.has('ionizable') || params.has('pam');

    if (hasUrlParams) {
      const editorParam = params.get('editor') as BaseEditorType | null;
      const pamParam = params.get('pam') as PamVariant | null;
      return {
        presetId: params.get('preset') || 'HBB',
        isCustom: params.get('preset') === 'CUSTOM',
        editor: editorParam && BASE_EDITOR_DEFINITIONS[editorParam] ? editorParam : undefined,
        pam: pamParam && PAM_VARIANT_DEFINITIONS[pamParam] ? pamParam : undefined,
        guideIdx: params.has('guide') ? parseInt(params.get('guide')!, 10) : 0,
        ionizable: params.has('ionizable') ? parseFloat(params.get('ionizable')!) : 50.0,
        dspc: params.has('dspc') ? parseFloat(params.get('dspc')!) : 10.0,
        peg: params.has('peg') ? parseFloat(params.get('peg')!) : 1.5,
        pka: params.has('pka') ? parseFloat(params.get('pka')!) : 6.35,
        np: params.has('np') ? parseFloat(params.get('np')!) : 6.0,
      };
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Could not parse workbench configuration:', err);
  }
  return null;
}

/**
 * Interactive SVG Henderson-Hasselbalch ionization and H_II hexagonal phase transition curve.
 * Plots % protonation across pH 4.5 -> 8.0, marking Late Endosome (pH 5.5), Apparent pKa (50%),
 * Systemic Blood (pH 7.4), and the CPP >= 1.45 (L_alpha -> H_II hexagonal fusion) threshold.
 */
function HendersonHasselbalchCurve({ lipidPka }: { lipidPka: number }) {
  const [hoveredPh, setHoveredPh] = useState<number | null>(null);

  // SVG canvas dimensions
  const width = 500;
  const height = 190;
  const padding = { top: 22, right: 30, bottom: 32, left: 44 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const phMin = 4.5;
  const phMax = 8.0;

  const getX = (ph: number) => padding.left + ((ph - phMin) / (phMax - phMin)) * plotW;
  const getY = (alpha: number) => padding.top + (1 - alpha / 100) * plotH;

  // Henderson-Hasselbalch: % = 100 / (1 + 10^(pH - pKa))
  const getAlpha = (ph: number) => 100 / (1 + Math.pow(10, ph - lipidPka));
  const getCpp = (alpha: number) => Number((1.08 + (alpha / 100) * 0.58).toFixed(2));

  // Critical packing parameter transition CPP >= 1.45 => alpha >= 63.79%
  const alphaHii = 63.793;
  const yHiiThreshold = getY(alphaHii);

  // Generate curve path
  const curvePoints: [number, number][] = [];
  const steps = 70;
  for (let i = 0; i <= steps; i++) {
    const ph = phMin + (i / steps) * (phMax - phMin);
    const alpha = getAlpha(ph);
    curvePoints.push([getX(ph), getY(alpha)]);
  }

  const pathD = curvePoints.reduce(
    (acc, [x, y], i) => `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`,
    ''
  );
  const areaD = `${pathD} L ${getX(phMax).toFixed(1)} ${getY(0).toFixed(1)} L ${getX(phMin).toFixed(
    1
  )} ${getY(0).toFixed(1)} Z`;

  // Key landmarks
  const endoPh = 5.5;
  const endoAlpha = getAlpha(endoPh);
  const endoX = getX(endoPh);
  const endoY = getY(endoAlpha);

  const pkaX = getX(lipidPka);
  const pkaY = getY(50);

  const bloodPh = 7.4;
  const bloodAlpha = getAlpha(bloodPh);
  const bloodX = getX(bloodPh);
  const bloodY = getY(bloodAlpha);

  // Active hover calculation directly computed without hook overhead
  const hoverData =
    hoveredPh !== null
      ? (() => {
          const alpha = getAlpha(hoveredPh);
          const cpp = getCpp(alpha);
          const isHii = cpp >= 1.45;
          return {
            ph: hoveredPh,
            alpha,
            cpp,
            x: getX(hoveredPh),
            y: getY(alpha),
            phase: isHii ? 'Inverted Hexagonal (HII Fusion)' : 'Lamellar / Micellar (Lα)',
          };
        })()
      : null;

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * width;
    const clampedSvgX = Math.max(padding.left, Math.min(width - padding.right, svgX));
    const ph = phMin + ((clampedSvgX - padding.left) / plotW) * (phMax - phMin);
    setHoveredPh(Number(ph.toFixed(2)));
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-[3px] bg-[#12110f] border border-[#24201b]">
      <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#e8dfd1]">
            Henderson-Hasselbalch Ionization &amp; H<sub>II</sub> Phase Transition
          </span>
          <span className="text-[10px] font-mono text-[#a69b8d]">
            pK<sub>a</sub> = {lipidPka.toFixed(2)}
          </span>
        </div>
        <div className="text-[10px] font-mono text-[#70675c]">
          CPP = 1.08 + 0.58·(α)
        </div>
      </div>

      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredPh(null)}
        >
          <defs>
            <linearGradient id="hhGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d828f" stopOpacity="0.32" />
              <stop offset="70%" stopColor="#4d828f" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#4d828f" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="curveStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5e946c" />
              <stop offset="45%" stopColor="#cfa052" />
              <stop offset="85%" stopColor="#4d828f" />
            </linearGradient>
          </defs>

          {/* Shaded H_II Inverted Hexagonal Regime (CPP >= 1.45, alpha >= 63.8%) */}
          <rect
            x={padding.left}
            y={padding.top}
            width={plotW}
            height={yHiiThreshold - padding.top}
            fill="#b85b46"
            fillOpacity="0.08"
          />
          <line
            x1={padding.left}
            y1={yHiiThreshold}
            x2={width - padding.right}
            y2={yHiiThreshold}
            stroke="#b85b46"
            strokeDasharray="4 3"
            strokeWidth="1"
            strokeOpacity="0.75"
          />
          <text
            x={width - padding.right - 4}
            y={yHiiThreshold - 4}
            textAnchor="end"
            fontSize="8.5"
            fontFamily="monospace"
            fill="#cc6b5a"
            fontWeight="bold"
          >
            HII Hexagonal Fusion (CPP ≥ 1.45 • α ≥ 64%)
          </text>
          <text
            x={width - padding.right - 4}
            y={yHiiThreshold + 11}
            textAnchor="end"
            fontSize="8"
            fontFamily="monospace"
            fill="#70675c"
          >
            Lα Lamellar Bilayer (CPP &lt; 1.45)
          </text>

          {/* Grid lines: % Protonation */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = getY(pct);
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#24201b"
                  strokeWidth="1"
                  strokeDasharray={pct === 50 ? '3 3' : undefined}
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fill="#70675c"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Grid lines: pH values */}
          {[4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0].map((phVal) => {
            const x = getX(phVal);
            return (
              <g key={phVal}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#24201b"
                  strokeWidth="1"
                  strokeDasharray={phVal === 5.5 || phVal === 7.4 ? '2 2' : undefined}
                />
                <text
                  x={x}
                  y={height - padding.bottom + 14}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fill={phVal === 5.5 || phVal === 7.4 ? '#a69b8d' : '#70675c'}
                  fontWeight={phVal === 5.5 || phVal === 7.4 ? 'bold' : 'normal'}
                >
                  {phVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Under-curve gradient fill */}
          <path d={areaD} fill="url(#hhGradient)" />

          {/* Sigmoidal Protonation Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveStroke)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Landmark: Late Endosome (pH 5.5) */}
          <line
            x1={endoX}
            y1={endoY}
            x2={endoX}
            y2={height - padding.bottom}
            stroke="#5e946c"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          <circle cx={endoX} cy={endoY} r="4" fill="#5e946c" stroke="#181613" strokeWidth="1.5" />
          <text
            x={endoX - 4}
            y={endoY - 6}
            textAnchor="end"
            fontSize="8.5"
            fontFamily="monospace"
            fill="#73a880"
            fontWeight="bold"
          >
            pH 5.5 Endosome ({endoAlpha.toFixed(0)}%)
          </text>

          {/* Landmark: Apparent pKa (50% protonation) */}
          {lipidPka >= phMin && lipidPka <= phMax && (
            <g>
              <line
                x1={pkaX}
                y1={pkaY}
                x2={pkaX}
                y2={height - padding.bottom}
                stroke="#cfa052"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={padding.left}
                y1={pkaY}
                x2={pkaX}
                y2={pkaY}
                stroke="#cfa052"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={pkaX} cy={pkaY} r="3.5" fill="#cfa052" stroke="#181613" strokeWidth="1.5" />
              <text
                x={pkaX + 6}
                y={pkaY - 4}
                textAnchor="start"
                fontSize="8.5"
                fontFamily="monospace"
                fill="#df9e51"
                fontWeight="bold"
              >
                pKa {lipidPka.toFixed(2)} (50%)
              </text>
            </g>
          )}

          {/* Landmark: Systemic Blood (pH 7.4) */}
          <line
            x1={bloodX}
            y1={bloodY}
            x2={bloodX}
            y2={height - padding.bottom}
            stroke="#4d828f"
            strokeWidth="1.2"
            strokeDasharray="3 2"
          />
          <circle cx={bloodX} cy={bloodY} r="4" fill="#4d828f" stroke="#181613" strokeWidth="1.5" />
          <text
            x={bloodX + 4}
            y={bloodY - 6}
            textAnchor="start"
            fontSize="8.5"
            fontFamily="monospace"
            fill="#98c2cc"
            fontWeight="bold"
          >
            pH 7.4 Blood ({bloodAlpha.toFixed(0)}%)
          </text>

          {/* Interactive Crosshair & Cursor */}
          {hoverData && (
            <g>
              <line
                x1={hoverData.x}
                y1={padding.top}
                x2={hoverData.x}
                y2={height - padding.bottom}
                stroke="#e8dfd1"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r="4.5"
                fill="#e8dfd1"
                stroke="#12110f"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis label */}
          <text
            x={padding.left + plotW / 2}
            y={height - 4}
            textAnchor="middle"
            fontSize="9"
            fontFamily="sans-serif"
            fill="#a69b8d"
          >
            Ambient pH (Endosome 5.5 → Physiological Blood 7.4)
          </text>

          {/* Y Axis label */}
          <text
            transform="rotate(-90)"
            x={-(padding.top + plotH / 2)}
            y={12}
            textAnchor="middle"
            fontSize="9"
            fontFamily="sans-serif"
            fill="#a69b8d"
          >
            Protonation % (α)
          </text>
        </svg>

        {/* Floating Scrubber HUD Tooltip */}
        {hoverData && (
          <div
            style={{
              left: `${Math.min(74, Math.max(14, (hoverData.x / width) * 100))}%`,
              top: '4px',
            }}
            className="absolute pointer-events-none transform -translate-x-1/2 px-2 py-0.5 rounded-[2px] bg-[#1c1a16]/95 border border-[#4d828f]/60 text-[10px] font-mono shadow-md flex items-center gap-2 z-10"
          >
            <span className="text-[#e8dfd1] font-bold">pH {hoverData.ph.toFixed(2)}</span>
            <span className="text-[#4d828f]">{hoverData.alpha.toFixed(1)}% ionized</span>
            <span className="text-[#cfa052]">CPP = {hoverData.cpp}</span>
            <span
              className={hoverData.cpp >= 1.45 ? 'text-[#cc6b5a] font-semibold' : 'text-[#70675c]'}
            >
              {hoverData.cpp >= 1.45 ? 'HII Fusion' : 'Lα Phase'}
            </span>
          </div>
        )}
      </div>
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

  const [selectedGuideIdx, setSelectedGuideIdx] = useState<number>(
    () => initialConfig?.guideIdx ?? 0
  );

  // Per-epitope stealth mutation state
  const epitopeCatalog = useMemo(() => bioEngineService.getEpitopeHotspots(), []);
  const [activeStealthMutations, setActiveStealthMutations] = useState<Record<string, boolean>>(
    () => Object.fromEntries(epitopeCatalog.map((ep) => [ep.peptide, true]))
  );
  const [selectedHlaAlleles, setSelectedHlaAlleles] = useState<string[]>(() => [
    ...SOUTH_ASIAN_HLA_ALLELES,
  ]);

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

  // Formulation parameters
  const [lnpForm, setLnpForm] = useState<LnpFormulation>(() => ({
    ionizableLipid: initialConfig?.ionizable ?? 50.0,
    dspcHelper: initialConfig?.dspc ?? 10.0,
    cholesterol: 38.5,
    pegLipid: initialConfig?.peg ?? 1.5,
    lipidPka: initialConfig?.pka ?? 6.35,
    npRatio: initialConfig?.np ?? 6.0,
  }));

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

  const selectedGuide: GuideCandidate | undefined =
    processedGuides[selectedGuideIdx] || processedGuides[0] || allGuides[0];

  // Auto-reset active guide index when filters reduce candidate count
  useEffect(() => {
    if (processedGuides.length > 0 && selectedGuideIdx >= processedGuides.length) {
      setSelectedGuideIdx(0);
    }
  }, [processedGuides.length, selectedGuideIdx]);

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return bioEngineService.generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Dynamic Cholesterol balancing to strictly lock stoichiometry at 100.0%
  // Ensures Ionizable + DSPC + PEG never exceeds 95.0% so cholesterol >= 5.0%
  const effectiveCholesterol = useMemo(() => {
    return Math.max(
      5.0,
      Number((100 - lnpForm.ionizableLipid - lnpForm.dspcHelper - lnpForm.pegLipid).toFixed(1))
    );
  }, [lnpForm.ionizableLipid, lnpForm.dspcHelper, lnpForm.pegLipid]);

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

  // URL query & localStorage persistence synchronization
  useEffect(() => {
    try {
      const config: SavedWorkbenchConfig = {
        presetId: isCustomMode ? 'CUSTOM' : selectedPresetId,
        isCustom: isCustomMode,
        editor: editorOverride ?? undefined,
        pam: pamOverride ?? undefined,
        guideIdx: selectedGuideIdx,
        ionizable: lnpForm.ionizableLipid,
        dspc: lnpForm.dspcHelper,
        peg: lnpForm.pegLipid,
        pka: lnpForm.lipidPka,
        np: lnpForm.npRatio,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

      const params = new URLSearchParams();
      params.set('preset', config.presetId!);
      if (config.editor) params.set('editor', config.editor);
      if (config.pam) params.set('pam', config.pam);
      if (config.guideIdx && config.guideIdx > 0) params.set('guide', config.guideIdx.toString());
      params.set('ionizable', config.ionizable!.toString());
      params.set('dspc', config.dspc!.toString());
      params.set('peg', config.peg!.toString());
      params.set('pka', config.pka!.toString());
      params.set('np', config.np!.toString());

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // ignore in restricted browser environments
    }
  }, [
    isCustomMode,
    selectedPresetId,
    editorOverride,
    pamOverride,
    selectedGuideIdx,
    lnpForm.ionizableLipid,
    lnpForm.dspcHelper,
    lnpForm.pegLipid,
    lnpForm.lipidPka,
    lnpForm.npRatio,
  ]);

  // Sliders with dynamic clamping: Ionizable + DSPC + PEG <= 95.0%
  const handleIonizableChange = (val: number) => {
    const maxAllowed = Number((95.0 - lnpForm.dspcHelper - lnpForm.pegLipid).toFixed(1));
    const clamped = Math.max(35.0, Math.min(val, maxAllowed));
    setLnpForm((prev) => ({ ...prev, ionizableLipid: clamped }));
  };

  const handleDspcChange = (val: number) => {
    const maxAllowed = Number((95.0 - lnpForm.ionizableLipid - lnpForm.pegLipid).toFixed(1));
    const clamped = Math.max(5.0, Math.min(val, maxAllowed));
    setLnpForm((prev) => ({ ...prev, dspcHelper: clamped }));
  };

  const handlePegChange = (val: number) => {
    const maxAllowed = Number((95.0 - lnpForm.ionizableLipid - lnpForm.dspcHelper).toFixed(1));
    const clamped = Math.max(0.3, Math.min(val, maxAllowed));
    setLnpForm((prev) => ({ ...prev, pegLipid: clamped }));
  };

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

  // Clinical & Research LNP Benchmark Presets
  const CLINICAL_LNP_PRESETS = [
    {
      id: 'Onpattro',
      name: 'Onpattro®',
      lipidName: 'DLin-MC3-DMA',
      target: 'Liver (78%)',
      organ: 'Hepatic',
      dotColor: '#5e946c',
      formulation: {
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.44,
        npRatio: 6.0,
      },
    },
    {
      id: 'Moderna',
      name: 'Spikevax®',
      lipidName: 'SM-102',
      target: 'Liver / Muscle',
      organ: 'Systemic',
      dotColor: '#cfa052',
      formulation: {
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.68,
        npRatio: 6.0,
      },
    },
    {
      id: 'Comirnaty',
      name: 'Comirnaty®',
      lipidName: 'ALC-0315',
      target: 'Liver / Spleen',
      organ: 'Lymphoid',
      dotColor: '#4d828f',
      formulation: {
        ionizableLipid: 46.3,
        dspcHelper: 9.4,
        cholesterol: 42.7,
        pegLipid: 1.6,
        lipidPka: 6.09,
        npRatio: 6.0,
      },
    },
    {
      id: 'NTLA2001',
      name: 'NTLA-2001',
      lipidName: 'LP-01 (CRISPR)',
      target: 'Liver (82%)',
      organ: 'In Vivo Cas9',
      dotColor: '#9e6778',
      formulation: {
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.50,
        npRatio: 6.0,
      },
    },
    {
      id: 'LungSORT',
      name: 'Lung-SORT',
      lipidName: '50% DOTAP',
      target: 'Lungs (65%)',
      organ: 'Endothelial',
      dotColor: '#528796',
      formulation: {
        ionizableLipid: 55.0,
        dspcHelper: 12.0,
        cholesterol: 31.5,
        pegLipid: 1.5,
        lipidPka: 7.10,
        npRatio: 8.0,
      },
    },
    {
      id: 'SpleenSORT',
      name: 'Spleen-SORT',
      lipidName: '18PA (Anionic)',
      target: 'Spleen (60%)',
      organ: 'Splenic B/T',
      dotColor: '#bd5142',
      formulation: {
        ionizableLipid: 48.0,
        dspcHelper: 10.0,
        cholesterol: 40.5,
        pegLipid: 1.5,
        lipidPka: 5.85,
        npRatio: 5.0,
      },
    },
  ] as const;

  type ClinicalLnpPresetId = (typeof CLINICAL_LNP_PRESETS)[number]['id'];

  const applyClinicalLnp = (id: ClinicalLnpPresetId) => {
    const preset = CLINICAL_LNP_PRESETS.find((p) => p.id === id);
    if (preset) {
      setLnpForm({ ...preset.formulation });
    }
  };

  const activeClinicalPreset = useMemo(() => {
    return CLINICAL_LNP_PRESETS.find(
      (p) =>
        Math.abs(p.formulation.ionizableLipid - lnpForm.ionizableLipid) < 0.2 &&
        Math.abs(p.formulation.dspcHelper - lnpForm.dspcHelper) < 0.2 &&
        Math.abs(p.formulation.pegLipid - lnpForm.pegLipid) < 0.2 &&
        Math.abs(p.formulation.lipidPka - lnpForm.lipidPka) < 0.08
    );
  }, [lnpForm]);

  const [copiedFormulation, setCopiedFormulation] = useState<boolean>(false);
  const handleCopyFormulation = () => {
    const recipe = {
      preset: activeClinicalPreset?.name ?? 'Custom LNP Formulation',
      ionizableLipid_molPct: lnpForm.ionizableLipid,
      dspcHelper_molPct: lnpForm.dspcHelper,
      cholesterol_molPct: effectiveCholesterol,
      pegLipid_molPct: lnpForm.pegLipid,
      apparent_pKa: lnpForm.lipidPka,
      np_charge_ratio: lnpForm.npRatio,
      hydrodynamic_diameter_nm: biophysics.diameterNm,
      pdi: biophysics.pdi,
      zeta_potential_mv: biophysics.zetaPotentialMv,
    };
    navigator.clipboard
      .writeText(JSON.stringify(recipe, null, 2))
      .then(() => {
        setCopiedFormulation(true);
        setTimeout(() => setCopiedFormulation(false), 2000);
      })
      .catch((err) => console.warn('Failed to copy formulation:', err));
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

  return (
    <div
      style={{
        backgroundColor: tokens.colors.canvas,
        color: tokens.colors.textPrimary,
        fontFamily: tokens.typography.fontSans,
      }}
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#4d828f]/30 selection:text-[#e8dfd1]"
    >
      {/* Top Application Header / Menu Bar */}
      <header
        style={{
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
        }}
        className="border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: tokens.colors.accent,
                borderRadius: tokens.radius,
              }}
              className="w-2 h-3.5 inline-block"
            />
            <span className="font-display font-bold text-sm tracking-tight text-[#e8dfd1]">
              NanoCRISPR-3D
            </span>
            <span className="text-[#70675c] text-xs">/</span>
            <span className="text-[#a69b8d] text-xs hidden sm:inline">
              Base editor &amp; lipid nanoparticle evaluation workbench
            </span>
          </div>

          {/* Target Gene Selector Tabs */}
          <div
            style={{
              backgroundColor: tokens.colors.canvas,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="flex items-center p-0.5 border"
          >
            {GENE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setIsCustomMode(false);
                  setEditorOverride(null);
                  setPamOverride(null);
                  setSelectedGuideIdx(0);
                }}
                style={{
                  backgroundColor:
                    !isCustomMode && selectedPresetId === preset.id
                      ? tokens.colors.surfaceSelected
                      : 'transparent',
                  color:
                    !isCustomMode && selectedPresetId === preset.id
                      ? tokens.colors.textPrimary
                      : tokens.colors.textSecondary,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-1 text-xs font-medium hover:text-[#e8dfd1] transition cursor-pointer"
              >
                {preset.id}
              </button>
            ))}

            <button
              onClick={() => {
                setIsCustomMode(true);
                setSelectedGuideIdx(0);
              }}
              style={{
                backgroundColor: isCustomMode ? tokens.colors.surfaceSelected : 'transparent',
                color: isCustomMode ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                borderRadius: tokens.radius,
              }}
              className="px-2.5 py-1 text-xs font-medium hover:text-[#e8dfd1] transition cursor-pointer"
            >
              Custom
            </button>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Share Config Link Button */}
          <button
            onClick={handleShareConfig}
            style={{
              backgroundColor: shareCopied
                ? tokens.colors.status.successSubtle
                : tokens.colors.surfaceRaised,
              borderColor: shareCopied ? tokens.colors.status.success : tokens.colors.border,
              borderRadius: tokens.radius,
              color: shareCopied ? tokens.colors.status.success : tokens.colors.textPrimary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:bg-[#2a2621] hover:border-[#4d828f] transition cursor-pointer flex items-center gap-1.5"
            title="Copy shareable configuration URL with active presets and formulation"
          >
            {shareCopied ? (
              <Check className="w-3 h-3 text-[#5e946c]" />
            ) : (
              <Share2 className="w-3 h-3 text-[#4d828f]" />
            )}
            <span>{shareCopied ? 'Link copied' : 'Share config'}</span>
          </button>

          {/* Export Multi-Record FASTA Button */}
          <button
            onClick={handleExportTopFasta}
            style={{
              backgroundColor: fastaSaved
                ? tokens.colors.status.successSubtle
                : tokens.colors.surfaceRaised,
              borderColor: fastaSaved ? tokens.colors.status.success : tokens.colors.border,
              borderRadius: tokens.radius,
              color: fastaSaved ? tokens.colors.status.success : tokens.colors.textPrimary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:bg-[#2a2621] hover:border-[#4d828f] transition cursor-pointer flex items-center gap-1.5"
            title="Download multi-record FASTA with WT/edited CDS, polypeptides, and protospacer"
          >
            {fastaSaved ? (
              <Check className="w-3 h-3 text-[#5e946c]" />
            ) : (
              <Download className="w-3 h-3 text-[#4d828f]" />
            )}
            <span>{fastaSaved ? 'Saved FASTA' : 'Export FASTA (.fasta)'}</span>
          </button>

          <button
            onClick={() => setShowBatchCalc(!showBatchCalc)}
            style={{
              backgroundColor: showBatchCalc
                ? tokens.colors.accentSubdued
                : tokens.colors.surfaceRaised,
              borderColor: showBatchCalc ? tokens.colors.accentBorder : tokens.colors.border,
              borderRadius: tokens.radius,
              color: showBatchCalc ? tokens.colors.textPrimary : tokens.colors.textSecondary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:text-[#e8dfd1] hover:border-[#4d828f] transition cursor-pointer"
          >
            {showBatchCalc ? 'Hide mass calculator' : 'Batch mass calculator'}
          </button>

          <button
            onClick={downloadDraDossier}
            style={{
              backgroundColor: tokens.colors.surfaceRaised,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
              color: tokens.colors.textPrimary,
            }}
            className="px-3 py-1 text-xs font-medium border hover:bg-[#2a2621] hover:border-[#4d828f] transition cursor-pointer"
          >
            Export pre-IND report (.md)
          </button>
        </div>
      </header>

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
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* LEFT WORKSTATION: GENOMICS & BASE EDITING EVALUATION */}
        <section className="lg:col-span-7 flex flex-col gap-3">
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
                      setSelectedGuideIdx(0);
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
                      setSelectedGuideIdx(0);
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

          {/* Interactive Multi-Track Monospace Sequence Visualizer */}
          <GenomicSequenceViewer
            preset={activePreset}
            selectedGuide={selectedGuide}
            wildTypeProtein={wildTypeProtein}
            onSelectGuideIdx={setSelectedGuideIdx}
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
                        onClick={() => setSelectedGuideIdx(idx)}
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
          {selectedGuide && (
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
                  Deaminase window (spacer pos {editorWindowLabel}) bystander consequences
                </h2>
                <span className="text-[11px] text-[#70675c]">
                  {selectedGuide.bystanders.length} potential edits in catalytic window
                </span>
              </div>

              {selectedGuide.bystanders.length === 0 ? (
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
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGuide.bystanders.map((b, i) => {
                        const isSafe =
                          b.classification === 'Target Edit' ||
                          b.classification === 'Silent (Synonymous)';
                        const statusColor = isSafe
                          ? tokens.colors.status.success
                          : tokens.colors.status.danger;

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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Cas9 Epitope Immunogenicity Section (Interactive South Asian Alleles) */}
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
        </section>

        {/* RIGHT WORKSTATION: LIPID NANOPARTICLE FORMULATION & BIOPHYSICS */}
        <section className="lg:col-span-5 flex flex-col gap-3">
          {/* 3D Nanoparticle Cross-Section Viewport */}
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
                Nanoparticle structural cutaway
              </h2>
              <span className="text-[11px] text-[#70675c]">
                Interactive WebGL instanced model
              </span>
            </div>
            <NanoViewport3D formulation={activeFormulation} biophysics={biophysics} />
          </div>

          {/* Formulation Controls with 4-Component Auto-Balancing */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3.5 flex flex-col gap-3.5"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Lipid formulation parameters &amp; organ tropism
                </h2>
                {activeClinicalPreset ? (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#5e946c]/20 border border-[#5e946c]/50 text-[#73a880] text-[10px] font-mono font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5e946c]" />
                    {activeClinicalPreset.name} Benchmark
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-[2px] bg-[#211e1a] border border-[#332e27] text-[#a69b8d] text-[10px] font-mono">
                    Custom Formulation
                  </span>
                )}
              </div>

              {/* Formulation Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyFormulation}
                  className="px-2 py-1 text-[10px] rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] transition cursor-pointer flex items-center gap-1"
                  title="Copy formulation stoichiometry and pKa to clipboard as JSON"
                >
                  {copiedFormulation ? (
                    <Check className="w-2.5 h-2.5 text-[#5e946c]" />
                  ) : (
                    <Copy className="w-2.5 h-2.5 text-[#4d828f]" />
                  )}
                  <span>{copiedFormulation ? 'Copied' : 'Copy Recipe'}</span>
                </button>

                <button
                  onClick={() => applyClinicalLnp('Onpattro')}
                  className="px-2 py-1 text-[10px] rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#70675c] hover:text-[#e8dfd1] transition cursor-pointer"
                  title="Reset formulation to clinical benchmark (Onpattro)"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* 6 Clinical & Research Benchmark Formulation Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
              {CLINICAL_LNP_PRESETS.map((preset) => {
                const isActive = activeClinicalPreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyClinicalLnp(preset.id)}
                    style={{
                      borderColor: isActive ? preset.dotColor : tokens.colors.border,
                      backgroundColor: isActive ? `${preset.dotColor}18` : tokens.colors.surfaceRaised,
                    }}
                    className={`p-2 rounded-[3px] border text-left flex flex-col justify-between gap-1 transition cursor-pointer hover:bg-[#2a2621] ${
                      isActive ? 'ring-1 shadow-xs' : ''
                    }`}
                    style-ringcolor={preset.dotColor}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold text-[11px] ${isActive ? 'text-[#e8dfd1]' : 'text-[#c7bcb0]'}`}>
                        {preset.name}
                      </span>
                      <span
                        style={{ backgroundColor: preset.dotColor }}
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                      />
                    </div>
                    <div className="text-[9px] text-[#a69b8d] font-mono leading-tight truncate">
                      {preset.lipidName}
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-[#70675c] pt-0.5 border-t border-[#332e27]/50">
                      <span>{preset.target}</span>
                      <span className="text-[#98c2cc]">{preset.organ}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 4-Component Stacked Stoichiometry Bar */}
            <div className="flex flex-col gap-1.5 p-2 rounded-[3px] bg-[#12110f] border border-[#24201b]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#a69b8d] font-medium">
                  Molar Stoichiometry Bar (100.0% Guaranteed)
                </span>
                <span className="font-mono text-[#e8dfd1] font-semibold">
                  Cholesterol: {effectiveCholesterol.toFixed(1)} mol%
                </span>
              </div>

              {/* Stacked Continuous Segment Bar */}
              <div className="w-full h-3.5 rounded-[2px] overflow-hidden flex border border-[#332e27] bg-[#181613]">
                <div
                  style={{
                    width: `${lnpForm.ionizableLipid}%`,
                    backgroundColor: tokens.colors.pigments.ochre,
                  }}
                  className="h-full transition-all"
                  title={`Ionizable lipid: ${lnpForm.ionizableLipid.toFixed(1)} mol%`}
                />
                <div
                  style={{
                    width: `${lnpForm.dspcHelper}%`,
                    backgroundColor: tokens.colors.pigments.ivory,
                  }}
                  className="h-full transition-all"
                  title={`DSPC helper lipid: ${lnpForm.dspcHelper.toFixed(1)} mol%`}
                />
                <div
                  style={{
                    width: `${effectiveCholesterol}%`,
                    backgroundColor: tokens.colors.pigments.terracotta,
                  }}
                  className="h-full transition-all"
                  title={`Cholesterol sterol: ${effectiveCholesterol.toFixed(1)} mol%`}
                />
                <div
                  style={{
                    width: `${lnpForm.pegLipid}%`,
                    backgroundColor: tokens.colors.pigments.petrol,
                  }}
                  className="h-full transition-all"
                  title={`PEG-lipid corona: ${lnpForm.pegLipid.toFixed(1)} mol%`}
                />
              </div>

              {/* Legend with Color Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] bg-[#181613] border border-[#24201b]">
                  <span
                    style={{ backgroundColor: tokens.colors.pigments.ochre }}
                    className="w-2 h-2 rounded-[1px] shrink-0"
                  />
                  <span className="text-[#a69b8d] truncate">Ionizable:</span>
                  <span className="text-[#e8dfd1] font-semibold ml-auto">
                    {lnpForm.ionizableLipid.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] bg-[#181613] border border-[#24201b]">
                  <span
                    style={{ backgroundColor: tokens.colors.pigments.ivory }}
                    className="w-2 h-2 rounded-[1px] shrink-0"
                  />
                  <span className="text-[#a69b8d] truncate">DSPC:</span>
                  <span className="text-[#e8dfd1] font-semibold ml-auto">
                    {lnpForm.dspcHelper.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] bg-[#181613] border border-[#24201b]">
                  <span
                    style={{ backgroundColor: tokens.colors.pigments.terracotta }}
                    className="w-2 h-2 rounded-[1px] shrink-0"
                  />
                  <span className="text-[#a69b8d] truncate">Chol (Bal):</span>
                  <span className="text-[#e8dfd1] font-semibold ml-auto">
                    {effectiveCholesterol.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[2px] bg-[#181613] border border-[#24201b]">
                  <span
                    style={{ backgroundColor: tokens.colors.pigments.petrol }}
                    className="w-2 h-2 rounded-[1px] shrink-0"
                  />
                  <span className="text-[#a69b8d] truncate">PEG-Lipid:</span>
                  <span className="text-[#e8dfd1] font-semibold ml-auto">
                    {lnpForm.pegLipid.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 4-Component Auto-Balancing Sliders with Stepper Nudge Buttons */}
            <div className="flex flex-col gap-3 text-xs">
              {/* 1. Ionizable Lipid */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#a69b8d] font-medium">Ionizable lipid molar ratio</span>
                  <span className="font-mono text-[#e8dfd1] font-semibold">
                    {lnpForm.ionizableLipid.toFixed(1)} mol%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleIonizableChange(lnpForm.ionizableLipid - 0.5)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Decrease by 0.5 mol%"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="35.0"
                    max="65.0"
                    step="0.5"
                    value={lnpForm.ionizableLipid}
                    onChange={(e) => handleIonizableChange(parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <button
                    onClick={() => handleIonizableChange(lnpForm.ionizableLipid + 0.5)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Increase by 0.5 mol%"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. DSPC Helper */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#a69b8d] font-medium">Helper lipid (DSPC) molar ratio</span>
                  <span className="font-mono text-[#e8dfd1] font-semibold">
                    {lnpForm.dspcHelper.toFixed(1)} mol%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDspcChange(lnpForm.dspcHelper - 0.5)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Decrease by 0.5 mol%"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="5.0"
                    max="20.0"
                    step="0.5"
                    value={lnpForm.dspcHelper}
                    onChange={(e) => handleDspcChange(parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <button
                    onClick={() => handleDspcChange(lnpForm.dspcHelper + 0.5)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Increase by 0.5 mol%"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. PEG Lipid */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#a69b8d] font-medium">PEG-lipid molar ratio</span>
                  <span className="font-mono text-[#e8dfd1] font-semibold">
                    {lnpForm.pegLipid.toFixed(1)} mol%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePegChange(lnpForm.pegLipid - 0.1)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Decrease by 0.1 mol%"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="0.3"
                    max="6.0"
                    step="0.1"
                    value={lnpForm.pegLipid}
                    onChange={(e) => handlePegChange(parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer"
                  />
                  <button
                    onClick={() => handlePegChange(lnpForm.pegLipid + 0.1)}
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Increase by 0.1 mol%"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Ionizable pKa */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#a69b8d] font-medium">Ionizable lipid apparent pKa</span>
                  <span className="font-mono text-[#e8dfd1] font-semibold">
                    {lnpForm.lipidPka.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setLnpForm((prev) => ({
                        ...prev,
                        lipidPka: Math.max(5.4, Number((prev.lipidPka - 0.05).toFixed(2))),
                      }))
                    }
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Decrease by 0.05"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="5.4"
                    max="7.4"
                    step="0.05"
                    value={lnpForm.lipidPka}
                    onChange={(e) =>
                      setLnpForm({ ...lnpForm, lipidPka: parseFloat(e.target.value) })
                    }
                    className="flex-1 cursor-pointer"
                  />
                  <button
                    onClick={() =>
                      setLnpForm((prev) => ({
                        ...prev,
                        lipidPka: Math.min(7.4, Number((prev.lipidPka + 0.05).toFixed(2))),
                      }))
                    }
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Increase by 0.05"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 5. N/P Charge Ratio */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#a69b8d] font-medium">Amine-to-phosphate (N/P) charge ratio</span>
                  <span className="font-mono text-[#e8dfd1] font-semibold">
                    {lnpForm.npRatio.toFixed(1)}:1
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setLnpForm((prev) => ({
                        ...prev,
                        npRatio: Math.max(3.0, Number((prev.npRatio - 0.5).toFixed(1))),
                      }))
                    }
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Decrease by 0.5"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="3.0"
                    max="10.0"
                    step="0.5"
                    value={lnpForm.npRatio}
                    onChange={(e) =>
                      setLnpForm({ ...lnpForm, npRatio: parseFloat(e.target.value) })
                    }
                    className="flex-1 cursor-pointer"
                  />
                  <button
                    onClick={() =>
                      setLnpForm((prev) => ({
                        ...prev,
                        npRatio: Math.min(10.0, Number((prev.npRatio + 0.5).toFixed(1))),
                      }))
                    }
                    className="w-6 h-6 rounded-[2px] bg-[#211e1a] hover:bg-[#2a2621] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] flex items-center justify-center font-mono text-xs transition cursor-pointer"
                    title="Increase by 0.5"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive SVG Henderson-Hasselbalch & H_II Phase Curve */}
            <HendersonHasselbalchCurve lipidPka={lnpForm.lipidPka} />
          </div>

          {/* Wet-Lab Batch Preparation Mass Calculator (Collapsible / Toggleable) */}
          {showBatchCalc && (
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
                <span className="text-[#e8dfd1]">{biophysics.stabilityStatus}</span>
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
      </main>
    </div>
  );
}
