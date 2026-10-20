// src/App.tsx
import { useState, useMemo } from 'react';
import {
  GENE_PRESETS,
  bioEngineService,
  calculateHlaRiskScore,
  type LnpFormulation,
  type GuideCandidate,
  type GenePreset,
} from './engines/bioEngines';
import { NanoViewport3D } from './components/NanoViewport3D';
import { GenomicSequenceViewer } from './components/GenomicSequenceViewer';
import { tokens } from './styles/tokens';

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
    sequence:
      'ATGGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTC',
    mutationIndex: 18,
    sasSnpIndex: 40,
    sasSnpId: 'Novel / Unmapped Variant',
    sasAlleleFreq: 0.05,
    clinicalNote: 'Custom sequence evaluation for protospacer discovery and bystander deamination.',
  });

  const [selectedGuideIdx, setSelectedGuideIdx] = useState<number>(0);

  // Per-epitope stealth mutation state (indices 0..4 active by default)
  const epitopeCatalog = useMemo(() => bioEngineService.getEpitopeHotspots(), []);
  const [activeStealthMutations, setActiveStealthMutations] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(epitopeCatalog.map((ep) => [ep.peptide, true]))
  );

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
    npRatio: 6.0,
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

  // Dual-strand guide candidates via hexagonal bioEngineService
  const allGuides = useMemo(() => bioEngineService.scanGuides(activePreset), [activePreset]);

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
  }, [allGuides, filterStrand, hideSnpCollisions, canonicalPamOnly, sortField, sortOrder]);

  const selectedGuide: GuideCandidate | undefined =
    processedGuides[selectedGuideIdx] || processedGuides[0] || allGuides[0];

  // Cloning oligos for selected guide
  const cloningOligos = useMemo(() => {
    if (!selectedGuide) return null;
    return bioEngineService.generateCloningOligos(selectedGuide.spacer);
  }, [selectedGuide]);

  // Dynamic Cholesterol balancing to strictly lock stoichiometry at 100.0%
  const effectiveCholesterol = useMemo(() => {
    return Math.max(
      0,
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

  // ImmunoShield residual HLA risk calculation
  const allStealthEnabled = useMemo(
    () => epitopeCatalog.every((ep) => activeStealthMutations[ep.peptide]),
    [epitopeCatalog, activeStealthMutations]
  );

  const residualHlaRisk = useMemo(() => {
    const unshielded = epitopeCatalog.filter((ep) => !activeStealthMutations[ep.peptide]);
    if (unshielded.length === 0) return 6;
    const rawAvg = calculateHlaRiskScore(unshielded);
    const coverageWeight = unshielded.length / epitopeCatalog.length;
    return Math.max(8, Math.round(rawAvg * (0.35 + 0.65 * coverageWeight)));
  }, [epitopeCatalog, activeStealthMutations]);

  const toggleAllStealth = () => {
    const nextState = !allStealthEnabled;
    setActiveStealthMutations(
      Object.fromEntries(epitopeCatalog.map((ep) => [ep.peptide, nextState]))
    );
  };

  const toggleSingleEpitope = (peptide: string) => {
    setActiveStealthMutations((prev) => ({
      ...prev,
      [peptide]: !prev[peptide],
    }));
  };

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
      setLnpForm({
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.4,
        npRatio: 6.0,
      });
    } else if (name === 'Moderna') {
      setLnpForm({
        ionizableLipid: 50.0,
        dspcHelper: 10.0,
        cholesterol: 38.5,
        pegLipid: 1.5,
        lipidPka: 6.55,
        npRatio: 6.0,
      });
    } else {
      setLnpForm({
        ionizableLipid: 55.0,
        dspcHelper: 12.0,
        cholesterol: 31.5,
        pegLipid: 1.5,
        lipidPka: 7.1,
        npRatio: 8.0,
      });
    }
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
        : '| — | — | — | — | No editable bases in window 4–8 |';

    const epitopeRows = epitopeCatalog
      .map((ep) => {
        const isShielded = activeStealthMutations[ep.peptide];
        return `| \`${ep.peptide}\` | ${ep.residueRange} | ${ep.domain} | ${ep.hlaAllele} | ${
          isShielded ? '<10 / 100' : `${ep.bindingScore} / 100`
        } | ${isShielded ? ep.stealthMutation : 'Wild-type (Unmodified)'} |`;
      })
      .join('\n');

    const content = `# Pre-IND CMC and Preclinical Evaluation Report
Generated by NanoCRISPR-3D Evaluation Workbench

## 1. Target Locus and Genome Editing Strategy
- Gene symbol: ${activePreset.symbol}
- Gene name: ${activePreset.name}
- Clinical indication: ${activePreset.disease}
- Target tissue: ${activePreset.targetOrgan}
- Base editor architecture: ${activePreset.editorType}
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

### Deaminase Window (Positions 4–8) Codon Consequence Audit
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
- Composite residual HLA risk score: ${residualHlaRisk} / 100
- Catalytic residue integrity (D10 / H840): Intact

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
        <div className="flex items-center gap-4">
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
                    active
                      ? 'border border-[#332e27]'
                      : 'border border-transparent hover:text-[#e8dfd1]'
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
                isCustomMode
                  ? 'border border-[#332e27]'
                  : 'border border-transparent hover:text-[#e8dfd1]'
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
                    mutationIndex: Math.max(0, parseInt(e.target.value || '1', 10) - 1),
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
                value={customPreset.editorType}
                onChange={(e) =>
                  setCustomPreset({
                    ...customPreset,
                    editorType: e.target.value as 'ABE8e (A→G)' | 'BE4max (C→T)',
                  })
                }
                style={{
                  backgroundColor: tokens.colors.canvas,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="w-full p-1.5 border text-xs text-[#e8dfd1] outline-none"
              >
                <option value="ABE8e (A→G)">ABE8e (A→G deaminase)</option>
                <option value="BE4max (C→T)">BE4max (C→T deaminase)</option>
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
                    sasSnpIndex: Math.max(0, parseInt(e.target.value || '0', 10) - 1),
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
              <div className="flex items-center gap-3 text-xs text-[#a69b8d]">
                <span>
                  Target tissue:{' '}
                  <strong className="text-[#e8dfd1] font-medium">
                    {activePreset.targetOrgan}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Editor:{' '}
                  <strong className="text-[#e8dfd1] font-medium">
                    {activePreset.editorType}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[#70675c] block text-[11px]">Indication</span>
                <span className="text-[#e8dfd1]">{activePreset.disease}</span>
              </div>
              <div>
                <span className="text-[#70675c] block text-[11px]">Pathogenic target position</span>
                <span className="font-mono-seq text-[#e8dfd1]">
                  bp {activePreset.mutationIndex + 1} (Codon{' '}
                  {Math.floor(activePreset.mutationIndex / 3) + 1}, frame offset:{' '}
                  {activePreset.mutationIndex % 3})
                </span>
              </div>
              <div>
                <span className="text-[#70675c] block text-[11px]">
                  South Asian population variant
                </span>
                <span className="font-mono-seq text-[#e8dfd1]">
                  {activePreset.sasSnpId} (MAF: {(activePreset.sasAlleleFreq * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Sequence & Reading Frame Track (Humanistic Multi-Track Viewer) */}
          <GenomicSequenceViewer
            preset={activePreset}
            selectedGuide={selectedGuide}
            wildTypeProtein={wildTypeProtein}
          />

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
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                Protospacer candidates (dual-strand discovery)
              </h2>

              {/* Table Filters */}
              <div className="flex items-center gap-2 text-[11px] text-[#a69b8d]">
                <div className="flex items-center border border-[#332e27] rounded-[3px] p-0.5 bg-[#12110f]">
                  <button
                    onClick={() => setFilterStrand('all')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === 'all'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
                    }`}
                  >
                    All strands
                  </button>
                  <button
                    onClick={() => setFilterStrand('+')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === '+'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
                    }`}
                  >
                    Sense (+)
                  </button>
                  <button
                    onClick={() => setFilterStrand('-')}
                    className={`px-1.5 py-0.5 rounded-[2px] transition cursor-pointer ${
                      filterStrand === '-'
                        ? 'bg-[#211e1a] text-[#e8dfd1]'
                        : 'hover:text-[#e8dfd1]'
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
                    className="accent-[#4d828f]"
                  />
                  <span>Clear of SNP</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canonicalPamOnly}
                    onChange={(e) => setCanonicalPamOnly(e.target.checked)}
                    className="accent-[#4d828f]"
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
                    className="border-b text-[#a69b8d] text-[11px]"
                  >
                    <th
                      onClick={() => handleSort('id')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      ID {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('strand')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      Strand {sortField === 'strand' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">
                      Spacer sequence (positions 4–8 underlined)
                    </th>
                    <th
                      onClick={() => handleSort('pam')}
                      className="py-1 px-2 font-medium cursor-pointer hover:text-[#e8dfd1]"
                    >
                      PAM {sortField === 'pam' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('gcContent')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e8dfd1]"
                    >
                      GC% {sortField === 'gcContent' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="py-1 px-2 font-medium">Population SNP</th>
                    <th
                      onClick={() => handleSort('CompositeScore')}
                      className="py-1 px-2 font-medium text-right font-mono-seq cursor-pointer hover:text-[#e8dfd1]"
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
                    const isCanonicalPam = g.pam[1] === 'G' && g.pam[2] === 'G';

                    return (
                      <tr
                        key={g.id}
                        onClick={() => setSelectedGuideIdx(idx)}
                        style={{
                          backgroundColor: isSelected
                            ? tokens.colors.surfaceSelected
                            : 'transparent',
                          borderLeftWidth: '2px',
                          borderLeftStyle: 'solid',
                          borderLeftColor: isSelected ? tokens.colors.accent : 'transparent',
                          borderBottomWidth: '1px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: tokens.colors.borderMuted,
                        }}
                        className="hover:bg-[#2a2621] cursor-pointer transition"
                      >
                        <td className="py-1 px-2 font-medium text-[#e8dfd1]">{g.id}</td>
                        <td className="py-1 px-2 font-mono-seq text-[11px] font-semibold">
                          <span className={g.strand === '-' ? 'text-[#6699a8]' : 'text-[#a69b8d]'}>
                            {g.strand === '+' ? '+' : '-'}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq text-[11px]">
                          <span>
                            {g.spacer
                              .slice(0, 3)
                              .split('')
                              .map((b, i) => (
                                <span key={i} className={getBaseColorClass(b)}>
                                  {b}
                                </span>
                              ))}
                          </span>
                          <span
                            style={{ borderRadius: tokens.radius }}
                            className="px-1 font-semibold text-[#e0ad5a] bg-[#c98a3b]/15 border-b border-[#c98a3b]"
                          >
                            {g.spacer.slice(3, 8)}
                          </span>
                          <span>
                            {g.spacer
                              .slice(8)
                              .split('')
                              .map((b, i) => (
                                <span key={i} className={getBaseColorClass(b)}>
                                  {b}
                                </span>
                              ))}
                          </span>
                        </td>
                        <td className="py-1 px-2 font-mono-seq font-semibold">
                          <span className={isCanonicalPam ? 'text-[#d4a359]' : 'text-[#cc6b5a]'}>
                            {g.pam}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq text-[#a69b8d]">
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
                            <span className="text-[11px] text-[#a69b8d]">
                              {g.hasSasSnpCollision ? 'Collision' : 'Clear'}
                            </span>
                          </span>
                        </td>
                        <td className="py-1 px-2 text-right font-mono-seq font-semibold text-[#e8dfd1]">
                          {g.CompositeScore}
                        </td>
                        <td className="py-1 px-2">
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: verdictColor }}
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                            />
                            <span className="text-[11px] text-[#a69b8d] truncate">{g.verdict}</span>
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Oligonucleotide cloning order sheet ({cloningOligos.overhangSystem})
                </h2>
                <span className="text-[11px] text-[#70675c]">
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
                    <span className="text-[11px] text-[#a69b8d]">Top oligo (CACC-G-spacer)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.forwardOligo, 'fwd')}
                      className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                    >
                      {copiedOligo === 'fwd' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] select-all break-all tracking-wider">
                    {cloningOligos.forwardOligo.split('').map((b, i) => (
                      <span key={i} className={getBaseColorClass(b)}>
                        {b}
                      </span>
                    ))}
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
                    <span className="text-[11px] text-[#a69b8d]">Bottom oligo (AAAC-spacerRC)</span>
                    <button
                      onClick={() => handleCopyOligo(cloningOligos.reverseOligo, 'rev')}
                      className="text-[10px] text-[#4d828f] hover:text-[#5e96a3] cursor-pointer"
                    >
                      {copiedOligo === 'rev' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono-seq text-[11px] select-all break-all tracking-wider">
                    {cloningOligos.reverseOligo.split('').map((b, i) => (
                      <span key={i} className={getBaseColorClass(b)}>
                        {b}
                      </span>
                    ))}
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
                <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
                  Deaminase window (positions 4–8) codon translation for {selectedGuide.id}
                </h2>
                <span className="text-[11px] text-[#70675c]">
                  Base conversion: {activePreset.editorType}
                </span>
              </div>

              {selectedGuide.bystanders.length === 0 ? (
                <p className="text-xs text-[#70675c] py-1">
                  No editable target base detected within deaminase positions 4–8.
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

          {/* Cas9 Epitope Immunogenicity Section (Interactive 5 South Asian Alleles) */}
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
                      residualHlaRisk <= 20
                        ? tokens.colors.status.successSubtle
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warningSubtle
                        : tokens.colors.status.dangerSubtle,
                    color:
                      residualHlaRisk <= 20
                        ? tokens.colors.status.success
                        : residualHlaRisk <= 55
                        ? tokens.colors.status.warning
                        : tokens.colors.status.danger,
                    borderRadius: tokens.radius,
                  }}
                  className="px-1.5 py-0.5 font-mono-seq text-[10px] font-semibold"
                >
                  CTL Risk: {residualHlaRisk} / 100
                </span>
              </div>

              <button
                onClick={toggleAllStealth}
                style={{
                  backgroundColor: tokens.colors.surfaceRaised,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius,
                }}
                className="px-2.5 py-0.5 text-xs font-medium border hover:bg-[#2a2621] transition cursor-pointer flex items-center gap-1.5"
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
                  {allStealthEnabled ? 'All 5 stealth mutations: Active' : 'Restore all stealth mutations'}
                </span>
              </button>
            </div>

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
                    <th className="py-1 px-2 font-medium">
                      De-immunization mutation (click row to toggle)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {epitopeCatalog.map((ep, i) => {
                    const isShielded = activeStealthMutations[ep.peptide];
                    return (
                      <tr
                        key={i}
                        onClick={() => toggleSingleEpitope(ep.peptide)}
                        style={{ borderColor: tokens.colors.borderMuted }}
                        className="border-b text-[11px] hover:bg-[#2a2621] cursor-pointer transition"
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
                          {isShielded ? (
                            <span className="flex items-center gap-1.5 text-[#e8dfd1]">
                              <span
                                style={{ backgroundColor: tokens.colors.status.success }}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                              />
                              {ep.stealthMutation}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[#70675c]">
                              <span
                                style={{ backgroundColor: tokens.colors.status.danger }}
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                              />
                              Wild-type (Unmodified anchor residue)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
            className="border p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
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
                  className="px-2 py-0.5 text-[11px] text-[#a69b8d] hover:text-[#e8dfd1] border hover:bg-[#2a2621] transition cursor-pointer"
                >
                  Lung-SORT
                </button>
              </div>
            </div>

            {/* 4-Component Auto-Balancing Sliders */}
            <div className="flex flex-col gap-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Ionizable lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.ionizableLipid.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="35.0"
                  max="65.0"
                  step="0.5"
                  value={lnpForm.ionizableLipid}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, ionizableLipid: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Helper lipid (DSPC) molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.dspcHelper.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="20.0"
                  step="0.5"
                  value={lnpForm.dspcHelper}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, dspcHelper: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">PEG-lipid molar ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.pegLipid.toFixed(1)} mol%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="6.0"
                  step="0.1"
                  value={lnpForm.pegLipid}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, pegLipid: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Ionizable lipid apparent pKa</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.lipidPka.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5.4"
                  max="7.4"
                  step="0.05"
                  value={lnpForm.lipidPka}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, lipidPka: parseFloat(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#a69b8d]">Amine-to-phosphate (N/P) charge ratio</span>
                  <span className="font-mono-seq text-[#e8dfd1]">
                    {lnpForm.npRatio.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="10.0"
                  step="0.5"
                  value={lnpForm.npRatio}
                  onChange={(e) =>
                    setLnpForm({ ...lnpForm, npRatio: parseFloat(e.target.value) })
                  }
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
              className="p-2 border font-mono-seq text-[11px] text-[#a69b8d] flex justify-between"
            >
              <span>Molar sum: 100.0%</span>
              <span className="text-[#e8dfd1]">
                {lnpForm.ionizableLipid.toFixed(1)}% ionizable • {lnpForm.dspcHelper.toFixed(1)}%
                DSPC • {effectiveCholesterol.toFixed(1)}% chol • {lnpForm.pegLipid.toFixed(1)}% PEG
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