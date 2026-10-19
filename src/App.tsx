// src/App.tsx
import { useState, useMemo } from 'react';
import {
  GENE_PRESETS,
  scanForGuides,
  simulateLnpBiophysics,
  translateSequence,
  generateCloningOligos,
  calculateBatchMasses,
  CAS9_EPITOPE_HOTSPOTS,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset
} from './engines/bioEngines';
import { NanoViewport3D } from './components/NanoViewport3D';
import { tokens } from './styles/tokens';

type SortField = 'id' | 'strand' | 'gcContent' | 'CompositeScore' | 'pam';
type SortOrder = 'asc' | 'desc';

export default function App() {
  // Preset or Custom Mode
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('HBB');
  const [customPreset, setCustomPreset] = useState<GenePreset>({
    id: 'CUSTOM',
    symbol: 'Custom Target',
    name: 'User-Defined Sequence',
    disease: 'Investigational Gene Target',
    targetOrgan: 'Liver',
    editorType: 'ABE8e (A→G)',
    sequence: 'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
    mutationIndex: 18,
    sasSnpIndex: 40,
    sasSnpId: 'Novel / Unmapped Variant',
    sasAlleleFreq: 0.05,
    clinicalNote: 'Custom sequence evaluation for protospacer discovery and bystander deamination.'
  });

  const [selectedGuideIdx, setSelectedGuideIdx] = useState<number>(0);
  const [deimmunized, setDeimmunized] = useState<boolean>(true);

  // Table filtering and sorting
  const [sortField, setSortField] = useState<SortField>('CompositeScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStrand, setFilterStrand] = useState<'all' | '+' | '-'>('all');
  const [hideSnpCollisions, setHideSnpCollisions] = useState<boolean>(false);
  const [canonicalPamOnly, setCanonicalPamOnly] = useState<boolean>(false);

  // Copy feedback state for oligos
  const [copiedOligo, setCopiedOligo] = useState<'fwd' | 'rev' | null>(null);

  // Formulation parameters
  const [lnpForm, setLnpForm] = useState<LnpFormulation>({
    ionizableLipid: 50.0,
    dspcHelper: 10.0,
    cholesterol: 38.5,
    pegLipid: 1.5,
    lipidPka: 6.35,
    npRatio: 6.0
  });

  // Wet-lab batch calculator parameters
  const [batchVolumeMl, setBatchVolumeMl] = useState<number>(10.0);
  const [batchMrnaConcMgMl, setBatchMrnaConcMgMl] = useState<number>(1.0);
  const [showBatchCalc, setShowBatchCalc] = useState<boolean>(false);

  // Active target preset
  const activePreset: GenePreset = useMemo(() => {
    if (isCustomMode) return customPreset;
    return GENE_PRESETS.find((p) => p.id === selectedPresetId) || GENE_PRESETS[0];
  }, [isCustomMode, customPreset, selectedPresetId]);

  // Dual-strand guide candidates
  const allGuides = useMemo(() => scanForGuides(activePreset), [activePreset]);

  // Filtered and sorted guides
  const processedGuides = useMemo(() => {
    return allGuides
      .filter((g) => {
        if (filterStrand !== 'all' && g.strand !== filterStrand) return false;
        if (hideSnpCollisions && g.hasSasSnpCollision) return false;
        if (canonicalPamOnly && !(g.pam[1] === 'G' && g.pam[2] === 'G')) return false;
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortOrder === 'asc'
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }
        return sortOrder === 'asc'
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
  }, [allGuides, filterStrand, hideSnpCollisions, canonicalPamOnly, sortField, sortOrder]);

  const selectedGuide: GuideCandidate | undefined =
    processedGuides[selectedGuideIdx] || processedGuides[0] || allGuides[0];

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Dynamic Cholesterol balancing to strictly lock stoichiometry at 100.0%
  const effectiveCholesterol = useMemo(() => {
    return Math.max(0, Number((100 - lnpForm.ionizableLipid - lnpForm.dspcHelper - lnpForm.pegLipid).toFixed(1)));
  }, [lnpForm.ionizableLipid, lnpForm.dspcHelper, lnpForm.pegLipid]);

  const activeFormulation = useMemo<LnpFormulation>(() => ({
    ...lnpForm,
    cholesterol: effectiveCholesterol
  }), [lnpForm, effectiveCholesterol]);

  const biophysics = useMemo(() => simulateLnpBiophysics(activeFormulation), [activeFormulation]);
  const batchCalculation = useMemo(
    () => calculateBatchMasses(activeFormulation, batchVolumeMl, batchMrnaConcMgMl),
    [activeFormulation, batchVolumeMl, batchMrnaConcMgMl]
  );

  const wildTypeProtein = useMemo(
    () => translateSequence(activePreset.sequence),
    [activePreset.sequence]
  );

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Copy oligo to clipboard
  const handleCopyOligo = (text: string, type: 'fwd' | 'rev') => {
    navigator.clipboard.writeText(text);
    setCopiedOligo(type);
    setTimeout(() => setCopiedOligo(null), 1800);
  };

  // Formulation presets
  const applyClinicalLnp = (name: 'Onpattro' | 'Moderna' | 'LungSORT') => {
    if (name === 'Onpattro') {
      setLnpForm({ ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.4, npRatio: 6.0 });
    } else if (name === 'Moderna') {
      setLnpForm({ ionizableLipid: 50.0, dspcHelper: 10.0, cholesterol: 38.5, pegLipid: 1.5, lipidPka: 6.55, npRatio: 6.0 });
    } else {
      setLnpForm({ ionizableLipid: 55.0, dspcHelper: 12.0, cholesterol: 31.5, pegLipid: 1.5, lipidPka: 7.1, npRatio: 8.0 });
    }
  };

  // Export regulatory pre-IND summary in Markdown format
  const downloadDraDossier = () => {
    const content = `# Pre-IND CMC and Preclinical Evaluation Report
Generated by NanoCRISPR-3D Evaluation Workbench

## 1. Target Locus and Genome Editing Strategy
- Gene symbol: ${activePreset.symbol}
- Gene name: ${activePreset.name}
- Clinical indication: ${activePreset.disease}
- Target tissue: ${activePreset.targetOrgan}
- Base editor architecture: ${activePreset.editorType}
- Selected protospacer: ${selectedGuide?.id || 'sgRNA-1'} (5'-${selectedGuide?.spacer || ''}-3')
- Target strand: ${selectedGuide?.strand === '+' ? 'Sense (+)' : 'Antisense (-)'}
- PAM: ${selectedGuide?.pam || ''}
- Protospacer on-target score: ${selectedGuide?.CompositeScore || 0} / 100
- Assessment verdict: ${selectedGuide?.verdict || 'N/A'}
- South Asian population variant: ${selectedGuide?.hasSasSnpCollision ? 'Collision flagged with ' + activePreset.sasSnpId : 'Clear of common SAS polymorphisms (' + activePreset.sasSnpId + ', MAF: ' + (activePreset.sasAlleleFreq * 100).toFixed(1) + '%)'}

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
- De Gennes polymer brush ratio (RF/D): ${biophysics.deGennesRfOverD ? `${biophysics.deGennesRfOverD} (${biophysics.deGennesRfOverD >= 1.0 ? 'Dense Brush' : 'Mushroom'})` : 'N/A'}
- Critical Packing Parameter (CPP at pH 5.5): ${biophysics.criticalPackingParam ? `${biophysics.criticalPackingParam} (${biophysics.criticalPackingParam >= 1.45 ? 'Inverted Hexagonal HII' : 'Lamellar La'})` : 'N/A'}
- SAXS Bragg q1 repeat spacing (dSAXS): ${biophysics.saxsBraggSpacingNm ? `${biophysics.saxsBraggSpacingNm} nm` : 'N/A'}
- Predicted organ biodistribution: Liver ${biophysics.organTropism.liver}% | Spleen ${biophysics.organTropism.spleen}% | Lungs ${biophysics.organTropism.lungs}%
- Formulation classification: ${biophysics.stabilityStatus}

## 3. Wet-Lab Batch Preparation Mass Scale (${batchVolumeMl} mL at ${batchMrnaConcMgMl} mg/mL mRNA)
- Total mRNA to weigh: ${batchCalculation.totalMrnaMassMg} mg
- Total lipids to weigh: ${batchCalculation.totalLipidMassMg} mg (Lipid:mRNA ratio ${(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w)
${batchCalculation.components.map((c) => `- ${c.name}: ${c.massMg} mg (${c.molarConcMm} mM)`).join('\n')}

## 4. Immunogenicity and De-immunization Profile
- Backbone status: ${deimmunized ? 'De-immunized (L240T, K836R, L1020G, F421A, L675S active)' : 'Wild-type SpCas9 sequence'}
- Catalytic residue integrity (D10 / H840): Intact
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pre_ind_evaluation_${activePreset.id.toLowerCase()}.md`;
    a.click();
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
      className="min-h-screen flex flex-col text-xs antialiased selection:bg-[#3f6d8c]/30 selection:text-white"
    >
      {/* Top Application Header / Menu Bar */}
      <header
        style={{
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
        }}
        className="border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: tokens.colors.accent,
                borderRadius: tokens.radius,
              }}
              className="w-2 h-3.5 inline-block"
            />
            <span className="font-display font-bold text-sm tracking-tight text-[#e1e4e8]">
              NanoCRISPR-3D
            </span>
            <span className="text-[#686e74] text-xs">/</span>
            <span className="text-[#9aa0a6] text-xs hidden sm:inline">
              Base editor & lipid nanoparticle evaluation workbench
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
            {GENE_PRESETS.map((preset) => {
              const active = !isCustomMode && preset.id === activePreset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedPresetId(preset.id);
                    setSelectedGuideIdx(0);
                  }}
                  style={{
                    backgroundColor: active ? tokens.colors.surfaceRaised : 'transparent',
                    color: active ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                    borderRadius: tokens.radius,
                  }}
                  className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    active ? 'border border-[#383d44]' : 'border border-transparent hover:text-[#e1e4e8]'
                  }`}
                >
                  {preset.symbol}
                </button>
              );
            })}

            {/* Custom Sequence Mode Toggle */}
            <button
              onClick={() => {
                setIsCustomMode(true);
                setSelectedGuideIdx(0);
              }}
              style={{
                backgroundColor: isCustomMode ? tokens.colors.surfaceRaised : 'transparent',
                color: isCustomMode ? tokens.colors.textPrimary : tokens.colors.textSecondary,
                borderRadius: tokens.radius,
              }}
              className={`px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                isCustomMode ? 'border border-[#383d44]' : 'border border-transparent hover:text-[#e1e4e8]'
              }`}
            >
              + Custom sequence
            </button>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchCalc(!showBatchCalc)}
            style={{
              backgroundColor: showBatchCalc ? tokens.colors.accentSubdued : tokens.colors.surfaceRaised,
              borderColor: showBatchCalc ? tokens.colors.accentBorder : tokens.colors.border,
              borderRadius: tokens.radius,
              color: showBatchCalc ? '#e1e4e8' : tokens.colors.textSecondary,
            }}
            className="px-2.5 py-1 text-xs font-medium border hover:text-[#e1e4e8] hover:border-[#383d44] transition cursor-pointer"
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
            className="px-3 py-1 text-xs font-medium border hover:bg-[#282b2f] hover:border-[#383d44] transition cursor-pointer"
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
            <span className="font-display font-semibold text-xs tracking-tight text-[#e1e4e8]">
              Custom target sequence configuration
            </span>
            <span className="text-[11px] text-[#686e74]">
              Dual-strand scanning will search both (+) and (-) orientations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
                Coding DNA sequence (5' → 3')
              </label>
              <textarea
                rows={2}
                value={customPreset.sequence}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    sequence: e.target.value.toUpperCase().replace(/[^ATCGN]/g, '')
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-2 border font-mono-seq text-[11px] text-[#e1e4e8] outline-none focus:border-[#3f6d8c]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
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
                    mutationIndex: Math.max(0, parseInt(e.target.value || '1', 10) - 1)
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
              />

              <label className="text-[11px] text-[#9aa0a6] block mt-2 mb-1">
                Base editor architecture
              </label>
              <select
                value={customPreset.editorType}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    editorType: e.target.value as 'ABE8e (A→G)' | 'BE4max (C→T)'
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e1e4e8] outline-none"
              >
                <option value="ABE8e (A→G)">ABE8e (A→G deaminase)</option>
                <option value="BE4max (C→T)">BE4max (C→T deaminase)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#9aa0a6] block mb-1">
                Target organ / tissue
              </label>
              <select
                value={customPreset.targetOrgan}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    targetOrgan: e.target.value as 'Liver' | 'Bone Marrow (HSPC)' | 'Lung'
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e1e4e8] outline-none"
              >
                <option value="Liver">Liver (Hepatocytes)</option>
                <option value="Bone Marrow (HSPC)">Bone Marrow (HSPC)</option>
                <option value="Lung">Lung (Endothelium)</option>
              </select>

              <label className="text-[11px] text-[#9aa0a6] block mt-2 mb-1">
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
                    sasSnpIndex: Math.max(0, parseInt(e.target.value || '0', 10) - 1)
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#24272a] pb-2 mb-2">
              <div>
                <span className="font-semibold text-sm text-[#e1e4e8] mr-2">
                  {activePreset.symbol}
                </span>
                <span className="text-[#9aa0a6] text-xs">
                  {activePreset.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9aa0a6]">
                <span>
                  Target tissue: <strong className="text-[#e1e4e8] font-medium">{activePreset.targetOrgan}</strong>
                </span>
                <span>•</span>
                <span>
                  Editor: <strong className="text-[#e1e4e8] font-medium">{activePreset.editorType}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[#686e74] block text-[11px]">Indication</span>
                <span className="text-[#e1e4e8]">{activePreset.disease}</span>
              </div>
              <div>
                <span className="text-[#686e74] block text-[11px]">Pathogenic target position</span>
                <span className="font-mono-seq text-[#e1e4e8]">
                  bp {activePreset.mutationIndex + 1} (CDS frame offset: {activePreset.mutationIndex % 3})
                </span>
              </div>
              <div>
                <span className="text-[#686e74] block text-[11px]">South Asian population variant</span>
                <span className="font-mono-seq text-[#e1e4e8]">
                  {activePreset.sasSnpId} (MAF: {(activePreset.sasAlleleFreq * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sequence & Reading Frame Track */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Coding sequence (5' → 3') and reading frame
              </h2>
              <div className="flex items-center gap-4 text-[11px] text-[#9aa0a6]">
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.status.danger }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  Target nucleotide (bp {activePreset.mutationIndex + 1})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.status.warning }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  SAS SNP (bp {activePreset.sasSnpIndex + 1})
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    style={{ backgroundColor: tokens.colors.accent }}
                    className="w-2 h-2 rounded-full inline-block"
                  />
                  Active spacer ({selectedGuide?.strand === '+' ? 'sense' : 'antisense'})
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="p-2.5 border font-mono-seq text-xs overflow-x-auto leading-relaxed select-all"
            >
              <div className="text-[10px] text-[#686e74] mb-1 font-mono-seq">
                Translated protein: {wildTypeProtein.slice(0, 31)}
              </div>
              <div className="tracking-[0.14em] text-[#c5c8cc]">
                {activePreset.sequence.split('').map((base, idx) => {
                  const isTarget = idx === activePreset.mutationIndex;
                  const isSnp = idx === activePreset.sasSnpIndex;
                  const inActiveGuide =
                    selectedGuide &&
                    idx >= selectedGuide.startIndex &&
                    idx < selectedGuide.startIndex + 20;

                  let bg = 'transparent';
                  let color = '#c5c8cc';
                  let border = 'transparent';

                  if (isTarget) {
                    bg = tokens.colors.sequence.targetBg;
                    color = tokens.colors.sequence.targetText;
                  } else if (isSnp) {
                    bg = tokens.colors.sequence.snpBg;
                    color = tokens.colors.sequence.snpText;
                  } else if (inActiveGuide) {
                    bg = tokens.colors.sequence.guideWindowBg;
                    color = tokens.colors.sequence.guideWindowText;
                    border = tokens.colors.sequence.protospacerUnderline;
                  }

                  return (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: bg,
                        color: color,
                        borderBottom: border !== 'transparent' ? `2px solid ${border}` : 'none',
                        borderRadius: tokens.radius,
                      }}
                      className="px-0.5"
                      title={`Position ${idx + 1}`}
                    >
                      {base}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Protospacer Candidates Table with Sorting & Filters */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Protospacer candidates (dual-strand discovery)
              </h2>

              {/* Table Filters */}
              <div className="flex items-center gap-2 text-[11px] text-[#9aa0a6]">
                <div className="flex items-center border border-[#2c3035] rounded-[3px] p-0.5 bg-[#141618]">
                  <button
                    onClick={() => setFilterStrand('all')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === 'all' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    All strands
                  </button>
                  <button
                    onClick={() => setFilterStrand('+')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === '+' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    Sense (+)
                  </button>
                  <button
                    onClick={() => setFilterStrand('-')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition ${
                      filterStrand === '-' ? 'bg-[#212427] text-[#e1e4e8]' : 'hover:text-[#e1e4e8]'
                    }`}
                  >
                    Antisense (-)
                  </button>
                </div>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideSnpCollisions}
                    onChange={(e) => setHideSnpCollisions(e.target.checked)}
                    className="accent-[#3f6d8c]"
                  />
                  <span>Clear of SNP</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canonicalPamOnly}
                    onChange={(e) => setCanonicalPamOnly(e.target.checked)}
                    className="accent-[#3f6d8c]"
                  />
                  <span>NGG only</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#9aa0a6] text-[11px]"
                  >
                    <th
                      onClick={() => handleSort('id')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('strand')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      Strand {sortField === 'strand' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Spacer sequence (positions 4–8 underlined)</th>
                    <th
                      onClick={() => handleSort('pam')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e1e4e8]"
                    >
                      PAM {sortField === 'pam' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('gcContent')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e1e4e8]"
                    >
                      GC% {sortField === 'gcContent' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Population SNP</th>
                    <th
                      onClick={() => handleSort('CompositeScore')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e1e4e8]"
                    >
                      Score {sortField === 'CompositeScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Evaluation verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {processedGuides.map((g, idx) => {
                    const isSelected = idx === selectedGuideIdx;
                    const verdictColor = getVerdictStatusColor(g.verdict);

                    return (
                      <tr
                        key={g.id}
                        onClick={() => setSelectedGuideIdx(idx)}
                        style={{
                          backgroundColor: isSelected ? tokens.colors.surfaceSelected : 'transparent',
                          borderLeftWidth: '2px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isSelected ? tokens.colors.accent : 'transparent',
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: tokens.colors.borderMuted,
                        }}
                        className="hover:bg-[#202326] cursor-pointer transition"
                      >
                        <td className="py-1 px-2 font-medium text-[#e1e4e8]">
                          {g.id}
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px] text-[#9aa0a6]">
                          {g.strand === '+' ? '+' : '-'}
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px] text-[#9aa0a6]">
                          <span>{g.spacer.slice(0, 3)}</span>
                          <span
                            style={{
                              backgroundColor: tokens.colors.sequence.guideWindowBg,
                              color: tokens.colors.sequence.guideWindowText,
                              borderRadius: tokens.radius,
                            }}
                            className="px-1 font-semibold text-[#e1e4e8]"
                          >
                            {g.spacer.slice(3, 8)}
                          </span>
                          <span>{g.spacer.slice(8)}</span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[#9aa0a6]">
                          {g.pam}
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq text-[#9aa0a6]">
                          {g.gcContent}%
                        </td>
                        <td className="py-1 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{
                                backgroundColor: g.hasSasSnpCollision
                                  ? tokens.colors.status.warning
                                  : tokens.colors.status.success,
                              }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="text-[11px] text-[#9aa0a6]">
                              {g.hasSasSnpCollision ? 'Collision' : 'Clear'}
                            </span>
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq font-semibold text-[#e1e4e8]">
                          {g.CompositeScore}
                        </td>
                        <td className="py-1 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: verdictColor }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="text-[11px] text-[#c5c8cc] truncate">
                              {g.verdict}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Oligonucleotide Synthesis Generator Card */}
          {selectedGuide && cloningOligos && (
            <div
              style={{
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius,
              }}
              className="border p-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                  Oligonucleotide cloning order sheet ({cloningOligos.overhangSystem})
                </h2>
                <span className="text-[11px] text-[#686e74]">
                  Lead guide: {selectedGuide.id} (strand {selectedGuide.strand})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.borderMuted,
                    borderRadius: tokens.radius,
                  }}
                  className="p-2 border flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#9aa0a6]">Top oligo (CACC-G-spacer)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.forwardOligo, 'fwd')}
                      className="text-[10px] text-[#3f6d8c] hover:text-[#4b7f9f] cursor-pointer"
                    >
                      {copiedOligo === 'fwd' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] text-[#e1e4e8] select-all break-all">
                    {cloningOligos.forwardOligo}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: tokens.colors.canvas,
                    borderColor: tokens.colors.borderMuted,
                    borderRadius: tokens.radius,
                  }}
                  className="p-2 border flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#9aa0a6]">Bottom oligo (AAAC-spacerRC)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.reverseOligo, 'rev')}
                      className="text-[10px] text-[#3f6d8c] hover:text-[#4b7f9f] cursor-pointer"
                    >
                      {copiedOligo === 'rev' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] text-[#e1e4e8] select-all break-all">
                    {cloningOligos.reverseOligo}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Deaminase Codon Audit Table */}
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                  Deaminase window (positions 4–8) codon translation for {selectedGuide.id}
                </h2>
                <span className="text-[11px] text-[#686e74]">
                  Base conversion: {activePreset.editorType}
                </span>
              </div>

              {selectedGuide.bystanders.length === 0 ? (
                <p className="text-xs text-[#686e74] py-1">
                  No editable target base detected within deaminase positions 4–8.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr
                        style={{ borderColor: tokens.colors.border }}
                        className="border-b text-[#9aa0a6] text-[11px]"
                      >
                        <th className="py-1 px-2 font-medium">Spacer pos</th>
                        <th className="py-1 px-2 font-medium">Genomic idx</th>
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
                            <td className="py-1 px-2 font-mono-seq text-[#9aa0a6]">
                              {b.guidePos}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#9aa0a6]">
                              bp {b.genomicIndex + 1}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e1e4e8]">
                              {b.originalCodon}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e1e4e8]">
                              {b.originalAA}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e1e4e8]">
                              {b.editedCodon}
                            </td>
                            <td className="py-1 px-2 font-mono-seq text-[#e1e4e8]">
                              {b.editedAA}
                            </td>
                            <td className="py-1 px-2">
                              <span className="flex items-center gap-1.5">
                                <span
                                  style={{ backgroundColor: statusColor }}
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                />
                                <span className="text-[#c5c8cc]">{b.classification}</span>
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

          {/* Cas9 Epitope Immunogenicity Section (Expanded 5 South Asian Alleles) */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Cas9 surface epitope immunogenicity (South Asian HLA alleles)
              </h2>
              <button
                onClick={() => setDeimmunized(!deimmunized)}
                style={{
                  backgroundColor: tokens.colors.surfaceRaised,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-0.5 text-xs font-medium border hover:bg-[#282b2f] transition cursor-pointer flex items-center gap-1.5"
              >
                <span
                  style={{
                    backgroundColor: deimmunized
                      ? tokens.colors.status.success
                      : tokens.colors.status.danger,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                />
                <span className="text-[#e1e4e8]">
                  {deimmunized ? 'Stealth mutations: Enabled' : 'Wild-type Cas9 backbone'}
                </span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr
                    style={{ borderColor: tokens.colors.border }}
                    className="border-b text-[#9aa0a6] text-[11px]"
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
                  {CAS9_EPITOPE_HOTSPOTS.map((ep, i) => (
                    <tr
                      key={i}
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-2 font-mono-seq font-semibold text-[#e1e4e8]">
                        {ep.peptide}
                      </td>
                      <td className="py-1 px-2 font-mono-seq text-[#9aa0a6]">
                        {ep.residueRange}
                      </td>
                      <td className="py-1 px-2 text-[#9aa0a6]">
                        {ep.domain}
                      </td>
                      <td className="py-1 px-2 text-[#9aa0a6]">
                        {ep.hlaAllele}
                      </td>
                      <td className="py-1 px-2 text-right font-mono-seq">
                        {deimmunized ? (
                          <span className="text-[#686e74]">&lt;10</span>
                        ) : (
                          <span style={{ color: tokens.colors.status.danger }} className="font-semibold">
                            {ep.bindingScore} / 100
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        {deimmunized ? (
                          <span className="flex items-center gap-1.5 text-[#c5c8cc]">
                            <span
                              style={{ backgroundColor: tokens.colors.status.success }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            {ep.stealthMutation}
                          </span>
                        ) : (
                          <span className="text-[#686e74]">Unmodified wild-type</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Nanoparticle structural cutaway
              </h2>
              <span className="text-[11px] text-[#686e74]">
                Interactive 3D representation
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
            className="border p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Lipid formulation parameters
              </h2>
              {/* Preset Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyClinicalLnp('Onpattro')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  Onpattro
                </button>
                <button
                  onClick={() => applyClinicalLnp('Moderna')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  SM-102
                </button>
                <button
                  onClick={() => applyClinicalLnp('LungSORT')}
                  style={{
                    backgroundColor: tokens.colors.surfaceRaised,
                    borderColor: tokens.colors.border,
                    borderRadius: tokens.radius,
                  }}
                  className="px-2 py-0.5 text-[11px] text-[#9aa0a6] hover:text-[#e1e4e8] border hover:bg-[#282b2f] transition cursor-pointer"
                >
                  Lung-SORT
                </button>
              </div>
            </div>

            {/* 4-Component Auto-Balancing Sliders */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Ionizable lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.ionizableLipid.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="35.0"
                  max="65.0"
                  step="0.5"
                  value={lnpForm.ionizableLipid}
                  onChange={(e) => setLnpForm({ ...lnpForm, ionizableLipid: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Helper lipid (DSPC) molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.dspcHelper.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="20.0"
                  step="0.5"
                  value={lnpForm.dspcHelper}
                  onChange={(e) => setLnpForm({ ...lnpForm, dspcHelper: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">PEG-lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.pegLipid.toFixed(1)} mol%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="6.0"
                  step="0.1"
                  value={lnpForm.pegLipid}
                  onChange={(e) => setLnpForm({ ...lnpForm, pegLipid: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Ionizable lipid apparent pKa</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.lipidPka.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="5.4"
                  max="7.4"
                  step="0.05"
                  value={lnpForm.lipidPka}
                  onChange={(e) => setLnpForm({ ...lnpForm, lipidPka: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#9aa0a6]">Amine-to-phosphate (N/P) charge ratio</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{lnpForm.npRatio.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={lnpForm.npRatio}
                  onChange={(e) => setLnpForm({ ...lnpForm, npRatio: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Molar Composition Summary (Guaranteed 100.0%) */}
            <div
              style={{
                backgroundColor: tokens.colors.canvas,
                borderColor: tokens.colors.borderMuted,
                borderRadius: tokens.radius,
              }}
              className="p-2 border font-mono-seq text-[11px] text-[#9aa0a6] flex justify-between"
            >
              <span>Molar sum: 100.0%</span>
              <span className="text-[#c5c8cc]">
                {lnpForm.ionizableLipid.toFixed(1)}% ionizable • {lnpForm.dspcHelper.toFixed(1)}% DSPC • {effectiveCholesterol.toFixed(1)}% chol • {lnpForm.pegLipid.toFixed(1)}% PEG
              </span>
            </div>
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                  Wet-lab batch preparation calculator
                </h2>
                <span className="text-[11px] text-[#686e74]">
                  Microfluidic mixing protocol
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-[#9aa0a6] block mb-0.5">
                    Target batch volume (mL)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={batchVolumeMl}
                    onChange={(e) => setBatchVolumeMl(Math.max(0.1, parseFloat(e.target.value) || 10))}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#9aa0a6] block mb-0.5">
                    mRNA concentration (mg/mL)
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={batchMrnaConcMgMl}
                    onChange={(e) => setBatchMrnaConcMgMl(Math.max(0.05, parseFloat(e.target.value) || 1))}
                    style={{
                      backgroundColor: tokens.colors.canvas,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.radius,
                    }}
                    className="w-full p-1 border font-mono-seq text-xs text-[#e1e4e8] outline-none"
                  />
                </div>
              </div>

              {/* Mass Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr
                      style={{ borderColor: tokens.colors.border }}
                      className="border-b text-[#9aa0a6] text-[11px]"
                    >
                      <th className="py-1 px-1.5 font-medium">Component</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Molar %</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Mass to weigh</th>
                      <th className="py-1 px-1.5 font-medium text-right font-mono-seq">Conc (mM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      style={{ borderColor: tokens.colors.borderMuted }}
                      className="border-b text-[11px]"
                    >
                      <td className="py-1 px-1.5 font-semibold text-[#e1e4e8]">mRNA payload</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">—</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq font-semibold text-[#e1e4e8]">
                        {batchCalculation.totalMrnaMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                        {batchMrnaConcMgMl.toFixed(2)} mg/mL
                      </td>
                    </tr>
                    {batchCalculation.components.map((c, i) => (
                      <tr
                        key={i}
                        style={{ borderColor: tokens.colors.borderMuted }}
                        className="border-b text-[11px]"
                      >
                        <td className="py-1 px-1.5 text-[#c5c8cc]">{c.name}</td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                          {c.molarPct.toFixed(1)}%
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq font-medium text-[#e1e4e8]">
                          {c.massMg} mg
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                          {c.molarConcMm} mM
                        </td>
                      </tr>
                    ))}
                    <tr className="text-[11px] font-semibold text-[#e1e4e8]">
                      <td className="py-1 px-1.5">Total Lipids</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">100.0%</td>
                      <td className="py-1 px-1.5 text-right font-mono-seq">
                        {batchCalculation.totalLipidMassMg} mg
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono-seq text-[#9aa0a6]">
                        Ratio: {(batchCalculation.totalLipidMassMg / batchCalculation.totalMrnaMassMg).toFixed(1)}:1 w/w
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calculated Biophysical Properties */}
          <div
            style={{
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius,
            }}
            className="border p-3 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Calculated biophysical properties
              </h2>
              {/* Stability status indicator */}
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
                <span className="text-[#c5c8cc]">{biophysics.stabilityStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.borderMuted,
                  borderRadius: tokens.radius,
                }}
                className="p-2 border"
              >
                <div className="text-[#686e74] text-[11px]">Hydrodynamic diameter (Dh)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.diameterNm} nm
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  PDI: {biophysics.pdi}
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
                <div className="text-[#686e74] text-[11px]">Zeta potential (pH 7.4)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.zetaPotentialMv} mV
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Blood ionization: {biophysics.bloodProtonationPct}%
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
                <div className="text-[#686e74] text-[11px]">Endosomal ionization (pH 5.5)</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.endosomalProtonationPct}%
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Henderson-Hasselbalch model
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
                <div className="text-[#686e74] text-[11px]">ApoE cellular uptake score</div>
                <div className="font-mono-seq text-sm font-semibold text-[#e1e4e8]">
                  {biophysics.cellularUptakeScore} / 100
                </div>
                <div className="text-[10px] text-[#9aa0a6] font-mono-seq">
                  Endosomal escape: {biophysics.endosomalEscapeEfficiency}%
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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e1e4e8]">
                Predicted organ biodistribution (SORT model)
              </h2>
              <span className="text-[11px] text-[#686e74]">
                Apparent charge partitioning
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#9aa0a6]">Liver (hepatocytes)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.liver}%</span>
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
                  <span className="text-[#9aa0a6]">Spleen (lymphoid / immune cells)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.spleen}%</span>
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
                      backgroundColor: '#526371',
                    }}
                    className="h-full transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-0.5 text-[11px]">
                  <span className="text-[#9aa0a6]">Lungs (endothelial beds)</span>
                  <span className="font-mono-seq text-[#e1e4e8]">{biophysics.organTropism.lungs}%</span>
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
                      backgroundColor: '#6b7280',
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
