// src/components/GenomicSequenceViewer.tsx
import { useState, useMemo } from 'react';
import {
  BASE_EDITOR_DEFINITIONS,
  type BystanderEdit,
  type GenePreset,
  type GuideCandidate,
} from '../engines/types';
import { tokens } from '../styles/tokens';
import { Copy, Check, Info, Crosshair, ArrowRight, ArrowLeft, Download } from 'lucide-react';

interface GenomicSequenceViewerProps {
  preset: GenePreset;
  selectedGuide?: GuideCandidate;
  wildTypeProtein: string;
  onSelectGuideIdx?: (idx: number) => void;
}

// 3-letter and full name amino acid dictionary
const AA_DICTIONARY: Record<string, { code3: string; name: string }> = {
  A: { code3: 'Ala', name: 'Alanine' },
  R: { code3: 'Arg', name: 'Arginine' },
  N: { code3: 'Asn', name: 'Asparagine' },
  D: { code3: 'Asp', name: 'Aspartic Acid' },
  C: { code3: 'Cys', name: 'Cysteine' },
  E: { code3: 'Glu', name: 'Glutamic Acid' },
  Q: { code3: 'Gln', name: 'Glutamine' },
  G: { code3: 'Gly', name: 'Glycine' },
  H: { code3: 'His', name: 'Histidine' },
  I: { code3: 'Ile', name: 'Isoleucine' },
  L: { code3: 'Leu', name: 'Leucine' },
  K: { code3: 'Lys', name: 'Lysine' },
  M: { code3: 'Met', name: 'Methionine' },
  F: { code3: 'Phe', name: 'Phenylalanine' },
  P: { code3: 'Pro', name: 'Proline' },
  S: { code3: 'Ser', name: 'Serine' },
  T: { code3: 'Thr', name: 'Threonine' },
  W: { code3: 'Trp', name: 'Tryptophan' },
  Y: { code3: 'Tyr', name: 'Tyrosine' },
  V: { code3: 'Val', name: 'Valine' },
  '*': { code3: 'Stop', name: 'Stop Codon' },
  '?': { code3: 'Unk', name: 'Unknown' },
};

// Base color styling (vintage scientific pigment scheme)
const getBaseLetterColor = (base: string): string => {
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

const BASE_WIDTH_PX = 22; // Exact cell width for monospace character grid

export function GenomicSequenceViewer({
  preset,
  selectedGuide,
  wildTypeProtein,
}: GenomicSequenceViewerProps) {
  const [hoveredBaseIdx, setHoveredBaseIdx] = useState<number | null>(null);
  const [copiedType, setCopiedType] = useState<'cds' | 'protein' | 'fasta' | null>(null);

  const sequence = preset.sequence.toUpperCase();
  const seqLength = sequence.length;
  const numCodons = Math.ceil(seqLength / 3);
  const totalTrackWidth = seqLength * BASE_WIDTH_PX;
  const editorDefinition = BASE_EDITOR_DEFINITIONS[preset.editorType];
  const [windowStartPosition, windowEndPosition] = editorDefinition.editingWindow;
  const editorWindowLabel = `${windowStartPosition}–${windowEndPosition}`;
  const editorWindowWidth = windowEndPosition - windowStartPosition + 1;

  // Active guide geometry calculations
  const guideMetrics = useMemo(() => {
    if (!selectedGuide) return null;

    const isSense = selectedGuide.strand === '+';
    const spacerStart = selectedGuide.startIndex;
    const spacerEnd = selectedGuide.startIndex + 19;

    // Deaminase window from the selected editor's 5' spacer positions.
    const windowStart = isSense
      ? spacerStart + (windowStartPosition - 1)
      : spacerStart + (20 - windowEndPosition);
    const windowEnd = isSense
      ? spacerStart + (windowEndPosition - 1)
      : spacerStart + (20 - windowStartPosition);

    // 3' PAM motif coordinates for the selected guide.
    const pamStart = isSense ? spacerStart + 20 : spacerStart - 3;
    const pamEnd = isSense ? spacerStart + 22 : spacerStart - 1;

    return {
      isSense,
      spacerStart,
      spacerEnd,
      windowStart,
      windowEnd,
      pamStart,
      pamEnd,
    };
  }, [selectedGuide, windowStartPosition, windowEndPosition]);

  // Map codon index -> post-edit outcome from selectedGuide.bystanders
  const codonDiffMap = useMemo(() => {
    const map = new Map<
      number,
      {
        editedCodon: string;
        originalAA: string;
        editedAA: string;
        classification: BystanderEdit['classification'];
      }
    >();

    if (!selectedGuide) return map;

    for (const edit of selectedGuide.bystanders) {
      const cIdx = Math.floor(edit.genomicIndex / 3);
      const existing = map.get(cIdx);
      // Prioritize Target Edit or pathogenic classifications if multiple bases in the same codon edit
      if (
        !existing ||
        edit.classification === 'Target Edit' ||
        edit.classification === 'Nonsense (Premature Stop)'
      ) {
        map.set(cIdx, {
          editedCodon: edit.editedCodon,
          originalAA: edit.originalAA,
          editedAA: edit.editedAA,
          classification: edit.classification,
        });
      }
    }
    return map;
  }, [selectedGuide]);

  // Construct co-edited CDS and edited protein string for FASTA export
  const { coEditedCds, editedProtein } = useMemo(() => {
    const cdsCodons: string[] = [];
    const aaChars: string[] = [];

    for (let cIdx = 0; cIdx < numCodons; cIdx++) {
      const wtCodon = sequence.slice(cIdx * 3, cIdx * 3 + 3);
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

    return {
      coEditedCds: cdsCodons.join(''),
      editedProtein: aaChars.join(''),
    };
  }, [numCodons, sequence, wildTypeProtein, codonDiffMap]);

  // Copy sequence handlers
  const handleCopy = (text: string, type: 'cds' | 'protein') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }).catch((err) => {
      console.warn('Clipboard write failed:', err);
    });
  };

  // Export Multi-Record FASTA file
  const handleExportFasta = () => {
    const guideHeader = selectedGuide
      ? `\n>${preset.id}_${selectedGuide.id}_Spacer_${selectedGuide.strand}Strand_PAM_${selectedGuide.pam}\n${selectedGuide.spacer}`
      : '';

    const fastaContent = `>${preset.id}_WildType_CDS | ${preset.name} (${preset.disease})
${sequence}
>${preset.id}_CoEdited_CDS | Editor=${preset.editorType} Guide=${selectedGuide?.id ?? 'None'}
${coEditedCds}
>${preset.id}_WildType_Protein | Frame=+1 (${wildTypeProtein.length} aa)
${wildTypeProtein}
>${preset.id}_CoEdited_Protein | Editor=${preset.editorType} Guide=${selectedGuide?.id ?? 'None'}
${editedProtein}${guideHeader}
`;

    const blob = new Blob([fastaContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.id.toLowerCase()}_${selectedGuide?.id ?? 'locus'}.fasta`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedType('fasta');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Hover telemetry resolution
  const hoverTelemetry = useMemo(() => {
    const idx = hoveredBaseIdx !== null ? hoveredBaseIdx : preset.mutationIndex;
    if (idx < 0 || idx >= seqLength) return null;

    const base = sequence[idx];
    const codonIdx = Math.floor(idx / 3);
    const codonStart = codonIdx * 3;
    const codonTriad = sequence.slice(codonStart, codonStart + 3);
    const aaLetter = wildTypeProtein[codonIdx] || '?';
    const aaInfo = AA_DICTIONARY[aaLetter] || { code3: '???', name: 'Unknown' };

    const isTarget = idx === preset.mutationIndex;
    const isSnp = idx === preset.sasSnpIndex;

    let guideContext = 'Flanking Reference Sequence';
    let inWindow = false;
    let guidePos: number | null = null;

    if (selectedGuide && guideMetrics) {
      if (idx >= guideMetrics.spacerStart && idx <= guideMetrics.spacerEnd) {
        guidePos = guideMetrics.isSense
          ? idx - guideMetrics.spacerStart + 1
          : guideMetrics.spacerEnd - idx + 1;

        inWindow = idx >= guideMetrics.windowStart && idx <= guideMetrics.windowEnd;
        guideContext = `${selectedGuide.id} • Spacer pos ${guidePos} (Strand ${selectedGuide.strand})${
          inWindow ? ` • Deaminase Catalytic Window (pos ${editorWindowLabel})` : ''
        }`;
      } else if (idx >= guideMetrics.pamStart && idx <= guideMetrics.pamEnd) {
        guideContext = `${selectedGuide.id} • PAM Binding Motif (${selectedGuide.pam})`;
      }
    }

    // Bystander lookup
    const bystander = selectedGuide?.bystanders.find(
      (b: BystanderEdit) => b.genomicIndex === idx
    );

    return {
      idx,
      base,
      codonIdx,
      codonTriad,
      aaLetter,
      aaInfo,
      isTarget,
      isSnp,
      guideContext,
      inWindow,
      bystander,
    };
  }, [
    hoveredBaseIdx,
    preset,
    sequence,
    seqLength,
    wildTypeProtein,
    selectedGuide,
    guideMetrics,
    editorWindowLabel,
  ]);

  return (
    <div
      style={{
        backgroundColor: tokens.colors.surface,
        borderColor: tokens.colors.border,
        borderRadius: tokens.radius,
      }}
      className="border p-3 flex flex-col gap-2.5 shadow-sm"
    >
      {/* Header Bar: Title, Clinical Context & Action Utilities */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#24201b]">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1] flex items-center gap-1.5">
            Coding sequence (5&apos; → 3&apos;) &amp; reading frame architecture
          </h2>
          {selectedGuide && (
            <span className="text-[10px] font-mono-seq px-1.5 py-0.5 rounded-[2px] bg-[#4d828f]/15 border border-[#4d828f]/40 text-[#98c2cc]">
              {selectedGuide.id} ({selectedGuide.strand === '+' ? 'Sense +' : 'Antisense -'})
            </span>
          )}
        </div>

        {/* Legend & Export Utilities */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#a69b8d]">
          <span className="flex items-center gap-1.5" title="Pathogenic base edit target">
            <span className="w-2 h-2 rounded-full bg-[#bd5142] ring-1 ring-[#e27b6c]/60" />
            Target (bp {preset.mutationIndex + 1})
          </span>
          <span className="flex items-center gap-1.5" title="South Asian polymorphism marker">
            <span className="w-2 h-2 rotate-45 bg-[#c98a3b] ring-1 ring-[#df9e51]/60" />
            SAS SNP (bp {preset.sasSnpIndex + 1})
          </span>
          <span
            className="flex items-center gap-1.5"
            title={`Deaminase processive editing window (positions ${editorWindowLabel})`}
          >
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#c98a3b]/40 border border-[#c98a3b]" />
            Deaminase window ({editorWindowLabel})
          </span>
          <span className="flex items-center gap-1.5" title="Active 20-nt protospacer guide">
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#4d828f]/30 border border-[#4d828f]" />
            Protospacer (20 nt)
          </span>
          <span className="flex items-center gap-1.5" title="3' Adjacent Protospacer Adjacent Motif">
            <span className="w-2.5 h-1.5 rounded-[1px] bg-[#cfa052]/20 border border-[#cfa052]/60" />
            PAM ({selectedGuide?.pam ?? '—'})
          </span>

          {/* Quick Copy & FASTA Export Buttons */}
          <div className="flex items-center gap-1 pl-2 border-l border-[#24201b]">
            <button
              onClick={() => handleCopy(sequence, 'cds')}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[#1c1a16] hover:bg-[#25221c] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] transition flex items-center gap-1 cursor-pointer"
              title="Copy 5' to 3' CDS sequence"
            >
              {copiedType === 'cds' ? (
                <Check className="w-2.5 h-2.5 text-[#5e946c]" />
              ) : (
                <Copy className="w-2.5 h-2.5" />
              )}
              {copiedType === 'cds' ? 'Copied' : 'CDS'}
            </button>
            <button
              onClick={() => handleCopy(wildTypeProtein, 'protein')}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[#1c1a16] hover:bg-[#25221c] border border-[#332e27] text-[#a69b8d] hover:text-[#e8dfd1] transition flex items-center gap-1 cursor-pointer"
              title="Copy translated polypeptide sequence"
            >
              {copiedType === 'protein' ? (
                <Check className="w-2.5 h-2.5 text-[#5e946c]" />
              ) : (
                <Copy className="w-2.5 h-2.5" />
              )}
              {copiedType === 'protein' ? 'Copied' : 'Protein'}
            </button>
            <button
              onClick={handleExportFasta}
              className="px-1.5 py-0.5 text-[10px] rounded-[2px] bg-[#1c1a16] hover:bg-[#25221c] border border-[#332e27] text-[#98c2cc] hover:text-[#e8dfd1] transition flex items-center gap-1 cursor-pointer"
              title="Export Wild-Type & Co-Edited CDS/Protein as multi-record FASTA"
            >
              {copiedType === 'fasta' ? (
                <Check className="w-2.5 h-2.5 text-[#5e946c]" />
              ) : (
                <Download className="w-2.5 h-2.5 text-[#4d828f]" />
              )}
              {copiedType === 'fasta' ? 'Saved' : '.FASTA'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Multi-Track Horizontal Scroll Canvas */}
      <div
        style={{
          backgroundColor: tokens.colors.canvas,
          borderColor: tokens.colors.borderMuted,
          borderRadius: tokens.radius,
        }}
        className="p-3 border font-mono-seq text-xs overflow-x-auto select-none transition-colors"
      >
        <div
          style={{ width: `${totalTrackWidth}px`, minWidth: '100%' }}
          className="relative flex flex-col"
        >
          {/* TRACK 1: GENOMIC COORDINATE RULER (Scale ticks every 5 bp, labels every 10 bp) */}
          <div className="flex items-end h-5 text-[9px] text-[#70675c] border-b border-[#24201b]/80 pb-0.5">
            {Array.from({ length: seqLength }).map((_, idx) => {
              const isTen = (idx + 1) % 10 === 0 || idx === 0;
              const isFive = (idx + 1) % 5 === 0 && !isTen;
              return (
                <div
                  key={idx}
                  style={{ width: `${BASE_WIDTH_PX}px` }}
                  className="shrink-0 flex flex-col items-center justify-end relative"
                >
                  {isTen && (
                    <span className="absolute -top-1 font-mono-seq text-[9px] text-[#a69b8d] tracking-tighter">
                      {idx + 1}
                    </span>
                  )}
                  <div
                    className={`w-[1px] ${
                      isTen
                        ? 'h-2.5 bg-[#54493b]'
                        : isFive
                        ? 'h-1.5 bg-[#332e27]'
                        : 'h-0.5 bg-[#24201b]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* TRACK 2: WILD-TYPE AMINO ACID TRANSLATION RIBBON (Codon-aligned reading frame) */}
          <div className="flex items-center h-6 mt-1">
            {Array.from({ length: numCodons }).map((_, codonIdx) => {
              const codonStart = codonIdx * 3;
              const codonBases = Math.min(3, seqLength - codonStart);
              const codonWidth = codonBases * BASE_WIDTH_PX;
              const isPartial = codonBases < 3;
              const aa = wildTypeProtein[codonIdx] || (isPartial ? '' : '?');
              const hasTarget = Math.floor(preset.mutationIndex / 3) === codonIdx;
              const hasSnp = Math.floor(preset.sasSnpIndex / 3) === codonIdx;
              const codonSeq = sequence.slice(codonStart, codonStart + codonBases);
              const isEven = codonIdx % 2 === 0;

              return (
                <div
                  key={codonIdx}
                  style={{ width: `${codonWidth}px` }}
                  className={`shrink-0 h-full flex items-center justify-center relative transition-colors ${
                    isEven ? 'bg-[#181613]/40' : 'bg-transparent'
                  }`}
                  title={
                    isPartial
                      ? `Partial Codon ${codonIdx + 1}: ${codonSeq} (${codonBases} bp)`
                      : `Wild-Type Codon ${codonIdx + 1}: ${codonSeq} (${
                          AA_DICTIONARY[aa]?.name || aa
                        })`
                  }
                >
                  <div className="absolute top-0 right-0 w-[1px] h-1.5 bg-[#24201b]" />
                  <div className="flex items-baseline gap-0.5 select-none">
                    <span
                      className={`text-[11px] font-semibold tracking-tight ${
                        hasTarget
                          ? 'text-[#e27b6c]'
                          : hasSnp
                          ? 'text-[#df9e51]'
                          : 'text-[#a69b8d]'
                      }`}
                    >
                      {isPartial ? `+${codonBases}` : aa}
                    </span>
                    {!isPartial && (
                      <span className="text-[8px] text-[#54493b] font-mono-seq">
                        {codonIdx + 1}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: NUCLEOTIDE SEQUENCE (Continuous Highlight Architecture) */}
          <div className="flex items-center h-7 py-0.5">
            {sequence.split('').map((base, idx) => {
              const codonIdx = Math.floor(idx / 3);
              const isTarget = idx === preset.mutationIndex;
              const isSnp = idx === preset.sasSnpIndex;

              const inSpacer =
                guideMetrics &&
                idx >= guideMetrics.spacerStart &&
                idx <= guideMetrics.spacerEnd;

              const isSpacerStart = guideMetrics && idx === guideMetrics.spacerStart;
              const isSpacerEnd = guideMetrics && idx === guideMetrics.spacerEnd;

              const inWindow =
                guideMetrics &&
                idx >= guideMetrics.windowStart &&
                idx <= guideMetrics.windowEnd;

              const isWindowStart = guideMetrics && idx === guideMetrics.windowStart;
              const isWindowEnd = guideMetrics && idx === guideMetrics.windowEnd;

              const inPam =
                guideMetrics &&
                idx >= guideMetrics.pamStart &&
                idx <= guideMetrics.pamEnd;

              const isPamStart = guideMetrics && idx === guideMetrics.pamStart;
              const isPamEnd = guideMetrics && idx === guideMetrics.pamEnd;

              let bg = 'transparent';
              let borderTop = '1px solid transparent';
              let borderBottom = '1px solid transparent';
              let borderLeft = 'none';
              let borderRight = 'none';
              let roundedClass = 'rounded-none';
              let cellBoxShadow: string | undefined = undefined;

              if (inWindow) {
                bg = tokens.colors.sequence.deaminaseWindowBg;
                borderTop = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                borderBottom = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                if (isWindowStart) {
                  borderLeft = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isWindowEnd) {
                  borderRight = `1.5px solid ${tokens.colors.sequence.deaminaseWindowBorder}`;
                  roundedClass = isWindowStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              } else if (inSpacer) {
                bg = tokens.colors.sequence.guideWindowBg;
                borderTop = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                borderBottom = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                if (isSpacerStart) {
                  borderLeft = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isSpacerEnd) {
                  borderRight = `1px solid ${tokens.colors.sequence.guideWindowBorder}`;
                  roundedClass = isSpacerStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              } else if (inPam) {
                bg = tokens.colors.sequence.pamBg;
                borderTop = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                borderBottom = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                if (isPamStart) {
                  borderLeft = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                  roundedClass = 'rounded-l-[2px]';
                }
                if (isPamEnd) {
                  borderRight = `1px dashed ${tokens.colors.sequence.pamBorder}`;
                  roundedClass = isPamStart ? 'rounded-[2px]' : 'rounded-r-[2px]';
                }
              }

              if (isTarget) {
                cellBoxShadow = 'inset 0 0 0 1.5px #bd5142, 0 0 8px rgba(189, 81, 66, 0.4)';
                bg = 'rgba(189, 81, 66, 0.28)';
              } else if (isSnp) {
                cellBoxShadow = 'inset 0 0 0 1.5px #c98a3b, 0 0 6px rgba(201, 138, 59, 0.35)';
                bg = 'rgba(201, 138, 59, 0.24)';
              }

              const isHovered = hoveredBaseIdx === idx;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredBaseIdx(idx)}
                  onMouseLeave={() => setHoveredBaseIdx(null)}
                  style={{
                    width: `${BASE_WIDTH_PX}px`,
                    backgroundColor: bg,
                    borderTop,
                    borderBottom,
                    borderLeft,
                    borderRight,
                    boxShadow: cellBoxShadow,
                  }}
                  className={`h-full shrink-0 flex items-center justify-center relative cursor-pointer transition-all ${roundedClass} ${
                    isHovered ? 'ring-1 ring-[#e8dfd1]/80 z-20' : ''
                  }`}
                  title={`bp ${idx + 1} (${base}) • Codon ${codonIdx + 1}`}
                >
                  {isTarget && (
                    <div className="absolute -top-1 text-[7px] text-[#e27b6c] select-none leading-none">
                      ▼
                    </div>
                  )}

                  {isSnp && !isTarget && (
                    <div className="absolute -top-1 text-[6px] text-[#df9e51] select-none leading-none">
                      ◆
                    </div>
                  )}

                  <span
                    className={`font-mono-seq text-xs font-semibold ${
                      isTarget
                        ? 'text-[#ffc7be] font-bold'
                        : isSnp
                        ? 'text-[#ffe2b8] font-bold'
                        : getBaseLetterColor(base)
                    }`}
                  >
                    {base}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 3B: POST-EDIT POLYPEPTIDE DIFF RIBBON (Co-Edited Reading Frame) */}
          <div className="flex items-center h-6 mb-0.5 border-t border-[#24201b]/50">
            {Array.from({ length: numCodons }).map((_, codonIdx) => {
              const codonStart = codonIdx * 3;
              const codonBases = Math.min(3, seqLength - codonStart);
              const codonWidth = codonBases * BASE_WIDTH_PX;
              const isPartial = codonBases < 3;
              const wtAA = wildTypeProtein[codonIdx] || (isPartial ? `+${codonBases}` : '?');
              const diff = codonDiffMap.get(codonIdx);

              if (!diff) {
                return (
                  <div
                    key={codonIdx}
                    style={{ width: `${codonWidth}px` }}
                    className="shrink-0 h-full flex items-center justify-center text-[10px] text-[#332e27] border-r border-[#24201b]/40 last:border-r-0"
                    title={
                      isPartial
                        ? `Partial Codon ${codonIdx + 1} (${codonBases} bp)`
                        : `Codon ${codonIdx + 1}: Unchanged (${wtAA})`
                    }
                  >
                    ·
                  </div>
                );
              }

              const isTargetEdit = diff.classification === 'Target Edit';
              const isSilent = diff.classification === 'Silent (Synonymous)';
              const badgeBg = isTargetEdit
                ? '#059669'
                : isSilent
                ? '#0d9488'
                : '#dc2626';
              const badgeBorder = 'rgba(255, 255, 255, 0.15)';
              const badgeText = '#FFFFFF';

              return (
                <div
                  key={codonIdx}
                  style={{ width: `${codonWidth}px` }}
                  className="shrink-0 h-full flex items-center justify-center border-r border-[#24201b]/40 last:border-r-0 px-0.5"
                  title={`Post-Edit Codon ${codonIdx + 1}: ${diff.editedCodon} (${diff.originalAA} → ${diff.editedAA}) • ${diff.classification}`}
                >
                  <span
                    style={{
                      backgroundColor: badgeBg,
                      borderColor: badgeBorder,
                      color: badgeText,
                    }}
                    className="px-1.5 py-0.5 rounded-[2px] border text-[9px] font-sans font-semibold leading-none tracking-tight shadow-xs"
                  >
                    {isSilent
                      ? `=${diff.editedAA} (Syn)`
                      : `${diff.originalAA}${codonIdx + 1}${diff.editedAA}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 4: DEDICATED CRISPR FEATURE ARCHITECTURE RIBBON */}
          <div className="relative h-11 mt-1 border-t border-[#24201b]/80 pt-1">
            {guideMetrics && selectedGuide && (
              <>
                {/* 20-nt Protospacer Directional Vector Banner */}
                <div
                  style={{
                    left: `${guideMetrics.spacerStart * BASE_WIDTH_PX}px`,
                    width: `${20 * BASE_WIDTH_PX}px`,
                  }}
                  className="absolute top-1 h-5 rounded-[2px] bg-[#4d828f]/20 border border-[#4d828f]/60 flex items-center justify-between px-1.5 text-[9px] text-[#98c2cc] select-none shadow-xs"
                >
                  {guideMetrics.isSense ? (
                    <>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3]">5&apos;</span>
                      <span className="font-mono-seq truncate font-medium text-center flex-1 px-1">
                        {selectedGuide.id} (20 nt spacer)
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-[#98c2cc] shrink-0" />
                      <span className="font-mono-seq text-[8px] text-[#5e96a3] ml-0.5">3&apos;</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3] mr-0.5">3&apos;</span>
                      <ArrowLeft className="w-2.5 h-2.5 text-[#98c2cc] shrink-0" />
                      <span className="font-mono-seq truncate font-medium text-center flex-1 px-1">
                        {selectedGuide.id} (20 nt antisense)
                      </span>
                      <span className="font-mono-seq text-[8px] text-[#5e96a3]">5&apos;</span>
                    </>
                  )}
                </div>

                {/* Nested deaminase catalytic-window overlay */}
                <div
                  style={{
                    left: `${guideMetrics.windowStart * BASE_WIDTH_PX}px`,
                    width: `${editorWindowWidth * BASE_WIDTH_PX}px`,
                  }}
                  className="absolute top-1 h-5 rounded-[2px] bg-[#c98a3b]/30 border border-[#c98a3b]/90 flex items-center justify-center text-[8px] font-mono-seq font-semibold text-[#f0ba65] select-none shadow-xs pointer-events-none"
                  title={`Deaminase Catalytic Window (spacer positions ${editorWindowLabel})`}
                >
                  Window {editorWindowLabel}
                </div>

                {/* 3-nt Adjacent PAM Motif Tag */}
                {guideMetrics.pamStart >= 0 && guideMetrics.pamEnd < seqLength && (
                  <div
                    style={{
                      left: `${guideMetrics.pamStart * BASE_WIDTH_PX}px`,
                      width: `${3 * BASE_WIDTH_PX}px`,
                    }}
                    className="absolute top-1 h-5 rounded-[2px] bg-[#cfa052]/20 border border-[#cfa052]/70 flex items-center justify-center text-[9px] font-mono-seq font-semibold text-[#e0ad5a] select-none shadow-xs"
                    title={`PAM Motif: ${selectedGuide.pam} (positions ${guideMetrics.pamStart + 1}–${guideMetrics.pamEnd + 1})`}
                  >
                    PAM
                  </div>
                )}
              </>
            )}

            {/* Target Mutation Landmark Pin */}
            <div
              style={{
                left: `${preset.mutationIndex * BASE_WIDTH_PX}px`,
                width: `${BASE_WIDTH_PX}px`,
              }}
              className="absolute top-6.5 flex flex-col items-center select-none"
              title={`Pathogenic Mutation Target: bp ${preset.mutationIndex + 1}`}
            >
              <span className="text-[8px] text-[#e27b6c] leading-none">▲</span>
              <span className="text-[7.5px] font-mono-seq text-[#e27b6c] font-semibold tracking-tighter whitespace-nowrap mt-0.5">
                Target
              </span>
            </div>

            {/* SAS Population SNP Landmark Pin */}
            {preset.sasSnpIndex >= 0 && preset.sasSnpIndex < seqLength && (
              <div
                style={{
                  left: `${preset.sasSnpIndex * BASE_WIDTH_PX}px`,
                  width: `${BASE_WIDTH_PX}px`,
                }}
                className="absolute top-6.5 flex flex-col items-center select-none"
                title={`SAS Polymorphism: ${preset.sasSnpId} (bp ${preset.sasSnpIndex + 1})`}
              >
                <span className="text-[7px] text-[#df9e51] leading-none">◆</span>
                <span className="text-[7.5px] font-mono-seq text-[#df9e51] font-semibold tracking-tighter whitespace-nowrap mt-0.5">
                  SNP
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRACK 5: REAL-TIME INTERACTIVE TELEMETRY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-[3px] bg-[#151310] border border-[#24201b] text-[11px] font-mono-seq">
        {hoverTelemetry ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#a69b8d]">
            <span className="flex items-center gap-1.5 text-[#e8dfd1]">
              <Crosshair className="w-3 h-3 text-[#4d828f]" />
              <span>
                bp <strong className="text-[#e8dfd1]">{hoverTelemetry.idx + 1}</strong> of{' '}
                {seqLength}
              </span>
              <span className="px-1 py-0.2 rounded-[2px] bg-[#211e1a] text-[10px] font-bold text-[#e8dfd1]">
                {hoverTelemetry.base}
              </span>
            </span>

            <span>
              Codon <strong className="text-[#e8dfd1]">#{hoverTelemetry.codonIdx + 1}</strong> (
              {hoverTelemetry.codonTriad} →{' '}
              <span className="text-[#e8dfd1] font-semibold">{hoverTelemetry.aaInfo.code3}</span> /{' '}
              {hoverTelemetry.aaLetter})
            </span>

            <span className="text-[#98c2cc]">{hoverTelemetry.guideContext}</span>

            {hoverTelemetry.isTarget && (
              <span className="text-[#e27b6c] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#bd5142]" />
                Pathogenic target nucleotide
              </span>
            )}

            {hoverTelemetry.isSnp && (
              <span className="text-[#df9e51] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rotate-45 bg-[#c98a3b]" />
                {preset.sasSnpId} (MAF: {(preset.sasAlleleFreq * 100).toFixed(1)}%)
              </span>
            )}

            {hoverTelemetry.bystander && (
              <span className="text-[#e0ad5a] flex items-center gap-1">
                <Info className="w-3 h-3" />
                Co-edit: {hoverTelemetry.bystander.originalCodon} (
                {hoverTelemetry.bystander.originalAA}) → {hoverTelemetry.bystander.editedCodon} (
                {hoverTelemetry.bystander.editedAA}) [{hoverTelemetry.bystander.classification}]
              </span>
            )}
          </div>
        ) : (
          <div className="text-[#70675c] flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>
              Hover over any nucleotide to inspect genomic coordinates, codon translation, and guide
              positions.
            </span>
          </div>
        )}

        <div className="text-[10px] text-[#70675c] ml-auto">
          {preset.editorType} • CDS {seqLength} bp • Frame +1
        </div>
      </div>
    </div>
  );
}
