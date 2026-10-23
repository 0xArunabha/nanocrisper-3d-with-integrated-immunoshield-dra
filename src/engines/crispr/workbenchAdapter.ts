// src/engines/crispr/workbenchAdapter.ts
/**
 * Maps the engine's domain types onto the shapes SequenceWorkbench draws.
 * Geometry comes from the strand, not from the engine's PAM text: on the reverse
 * strand the PAM is the three bases to the left of the protospacer (read
 * reverse-complemented), on the forward strand the three to the right.
 */
import { BASE_EDITOR_DEFINITIONS, type GenePreset, type GuideCandidate } from '../types';
import type { Editor, Guide, Snp } from './sequenceModel';

/** Every Cas9 variant the scanner models reads a three-base PAM (NGG, NGN, NNN). */
const PAM_LEN = 3;

/**
 * The editor a preset uses, read from the engine's own definition so the window drawn on screen is
 * the window the scanner searched: ABE8e and BE4max act on positions 4 to 8, ABE9 on 5 to 6.
 * The display name is the editor type up to its first space ('ABE9 (A→G; window 5–6)' becomes 'ABE9').
 */
export function editorFor(preset: Pick<GenePreset, 'editorType'>): Editor {
  const definition = BASE_EDITOR_DEFINITIONS[preset.editorType];
  return {
    name: preset.editorType.split(' ')[0],
    from: definition.targetBase,
    to: definition.replacementBase,
    window: definition.editingWindow,
  };
}

export function toWorkbenchGuide(c: GuideCandidate): Guide {
  const protoStart = c.startIndex;
  const protoEnd = c.startIndex + c.spacer.length;
  const text = { label: `${c.id} · ${c.CompositeScore}`, detail: `Score ${c.CompositeScore} · ${c.verdict}` };
  if (c.strand === '+') {
    return { id: c.id, strand: '+', protoStart, protoEnd, pamStart: protoEnd, pamEnd: protoEnd + PAM_LEN, ...text };
  }
  return { id: c.id, strand: '-', protoStart, protoEnd, pamStart: Math.max(0, protoStart - PAM_LEN), pamEnd: protoStart, ...text };
}

export function toWorkbenchSnps(preset: GenePreset): Snp[] {
  // sasSnpId reads like 'rs10768683 (SAS Variant)'. Keep the rsID when there is one.
  const id = /rs\d+/.exec(preset.sasSnpId)?.[0] ?? preset.sasSnpId;
  return [{ id, pos: preset.sasSnpIndex, af: preset.sasAlleleFreq, pop: 'SAS' }];
}
