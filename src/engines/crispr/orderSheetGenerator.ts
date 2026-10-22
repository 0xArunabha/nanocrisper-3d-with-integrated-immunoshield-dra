// src/engines/crispr/orderSheetGenerator.ts
/**
 * Ready-to-Order Oligonucleotide Sheet Generator for IDT and GenScript.
 * Formats Golden Gate assembly oligos (BsmBI / Esp3I / BpiI overhangs)
 * for commercial synthesis portals with rigorous IUPAC compliance.
 *
 * Author: Arunabha Ghosh (MAKAUT)
 * License: Apache-2.0
 */

import type { GenePreset, GuideCandidate } from '../types';
import { reverseComplement } from './guideScanner';

export interface OligoOrderItem {
  name: string;
  sequence: string;
  length: number;
  strand: 'Top (Sense)' | 'Bottom (Antisense)';
  overhang: string;
  scale: string;
  purification: string;
  fivePrimeMod: string;
  threePrimeMod: string;
  notes: string;
}

/**
 * Computes exact 5'-to-3' nucleotide sequence for Golden Gate BsmBI oligos.
 * Ensures a 5'-G for transcription initiation under the human U6 Pol III promoter.
 */
export function getGoldenGateOligos(spacer: string): {
  fwdSeq: string;
  revSeq: string;
  needsU6G: boolean;
} {
  const cleanSpacer = spacer.trim().toUpperCase().replace(/[^ACGT]/g, '');
  const needsU6G = cleanSpacer[0] !== 'G';
  const fwdCore = (needsU6G ? 'G' : '') + cleanSpacer;
  const fwdSeq = `CACC${fwdCore}`;
  const revSeq = `AAAC${reverseComplement(fwdCore)}`;
  return { fwdSeq, revSeq, needsU6G };
}

/**
 * Builds structured oligo order items for a list of guide candidates.
 */
export function buildOligoOrderItems(
  guides: GuideCandidate[],
  preset: GenePreset,
  options?: { phosphorylated?: boolean; scale?: string }
): OligoOrderItem[] {
  const isPhos = options?.phosphorylated ?? false;
  const scale = options?.scale ?? '25nm';
  const items: OligoOrderItem[] = [];

  for (const guide of guides) {
    const { fwdSeq, revSeq, needsU6G } = getGoldenGateOligos(guide.spacer);
    const baseName = `${preset.symbol}_${guide.id}`;

    // Top / Forward Oligo
    items.push({
      name: `${baseName}_BsmBI_Top`,
      sequence: isPhos ? `/5Phos/${fwdSeq}` : fwdSeq,
      length: fwdSeq.length,
      strand: 'Top (Sense)',
      overhang: 'CACC (5\')',
      scale,
      purification: 'Standard Desalt',
      fivePrimeMod: isPhos ? '5\' Phosphorylation' : 'None',
      threePrimeMod: 'None',
      notes: `Golden Gate BsmBI top oligo for ${preset.disease} (Score ${guide.CompositeScore}/100)${
        needsU6G ? ' [prepended U6 5\'-G]' : ''
      }`,
    });

    // Bottom / Reverse Oligo
    items.push({
      name: `${baseName}_BsmBI_Bottom`,
      sequence: isPhos ? `/5Phos/${revSeq}` : revSeq,
      length: revSeq.length,
      strand: 'Bottom (Antisense)',
      overhang: 'AAAC (5\')',
      scale,
      purification: 'Standard Desalt',
      fivePrimeMod: isPhos ? '5\' Phosphorylation' : 'None',
      threePrimeMod: 'None',
      notes: `Golden Gate BsmBI bottom oligo for ${preset.disease} (Score ${guide.CompositeScore}/100)`,
    });
  }

  return items;
}

/**
 * Generates an IDT-compliant Bulk Order CSV file format.
 * IDT accepts standard column formats:
 * "Sequence Name,Sequence,Scale,Purification"
 */
export function generateIdtCsv(
  guides: GuideCandidate[],
  preset: GenePreset,
  options?: { phosphorylated?: boolean; scale?: string }
): string {
  const items = buildOligoOrderItems(guides, preset, options);
  const rows = [
    'Sequence Name,Sequence,Scale,Purification',
    ...items.map(
      (item) => `"${item.name}","${item.sequence}","${item.scale}","STD"`
    ),
  ];
  return rows.join('\r\n');
}

/**
 * Generates a GenScript-compliant Oligo Order CSV file format.
 * GenScript standard format requires:
 * Oligo Name,Sequence (5'-3'),Length,Synthesis Scale,Purification,5' Modification,3' Modification,Remarks
 */
export function generateGenScriptCsv(
  guides: GuideCandidate[],
  preset: GenePreset,
  options?: { phosphorylated?: boolean; scale?: string }
): string {
  const items = buildOligoOrderItems(guides, preset, options);
  const rows = [
    'Oligo Name,Sequence (5\'-3\'),Length (bp),Synthesis Scale,Purification,5\' Modification,3\' Modification,Remarks',
    ...items.map(
      (item) =>
        `"${item.name}","${item.sequence.replace(/\/5Phos\//g, '')}",${item.length},"${
          item.scale === '25nm' ? '50 nmol' : item.scale
        }","Desalt","${item.fivePrimeMod}","None","${item.notes.replace(/"/g, '""')}"`
    ),
  ];
  return rows.join('\r\n');
}

/**
 * Helper to trigger browser download of CSV string.
 */
export function triggerCsvDownload(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * One-click IDT Order Sheet Download for selected guide or full panel.
 */
export function downloadIdtOrderSheet(
  guides: GuideCandidate[],
  preset: GenePreset,
  isSingleGuide: boolean = true,
  options?: { phosphorylated?: boolean }
): void {
  const csv = generateIdtCsv(guides, preset, options);
  const prefix = isSingleGuide ? guides[0]?.id.toLowerCase() : 'all_candidates';
  triggerCsvDownload(
    csv,
    `IDT_Order_${preset.symbol.toUpperCase()}_${prefix}_BsmBI.csv`
  );
}

/**
 * One-click GenScript Order Sheet Download for selected guide or full panel.
 */
export function downloadGenScriptOrderSheet(
  guides: GuideCandidate[],
  preset: GenePreset,
  isSingleGuide: boolean = true,
  options?: { phosphorylated?: boolean }
): void {
  const csv = generateGenScriptCsv(guides, preset, options);
  const prefix = isSingleGuide ? guides[0]?.id.toLowerCase() : 'all_candidates';
  triggerCsvDownload(
    csv,
    `GenScript_Order_${preset.symbol.toUpperCase()}_${prefix}_BsmBI.csv`
  );
}
