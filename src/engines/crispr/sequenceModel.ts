// src/engines/crispr/sequenceModel.ts
/**
 * Pure helpers behind SequenceWorkbench: strand maths, editing-window analysis
 * and lane packing. No React, no DOM, no network, so it can be tested on its own.
 *
 * Coordinates
 *  - Indices are 0-based on the forward (+) strand of the sequence you pass in.
 *  - Spans are end-exclusive: [start, end).
 *  - "Protospacer position" is 1-based from the guide's own 5' end, the way editing
 *    windows are quoted (ABE8e: positions 4-8).
 *  - Codon 0 is assumed to be the start codon when deciding whether an edit loses
 *    it, so pass the CDS from the ATG.
 */
import { CODON_TABLE, reverseComplement } from './guideScanner';

export type Strand = '+' | '-';

export interface Editor {
  /** Display name, for example 'ABE8e'. */
  name: string;
  /** Base converted on the protospacer strand: 'A' for adenine editors, 'C' for cytosine editors. */
  from: 'A' | 'C';
  to: 'G' | 'T';
  /** Inclusive editing window in protospacer positions, for example [4, 8]. */
  window: readonly [number, number];
}

export interface Guide {
  id: string;
  strand: Strand;
  /** Forward-strand span of the protospacer. */
  protoStart: number;
  protoEnd: number;
  /** Forward-strand span of the PAM. On the reverse strand the PAM sits left of the protospacer. */
  pamStart: number;
  pamEnd: number;
  /** Text on the guide bar. Defaults to the id. */
  label?: string;
  /** Extra text for the bar's tooltip, for example a score. */
  detail?: string;
}

export interface Snp {
  id: string;
  /** 0-based index in the sequence. */
  pos: number;
  ref?: string;
  alt?: string;
  /** Alt-allele frequency, 0 to 1. Leave undefined when unknown. */
  af?: number;
  /** Population label shown beside the frequency, for example 'SAS'. */
  pop?: string;
}

/* ---------------------------------------------------------------- strands */

const COMPLEMENT: Record<string, string> = { A: 'T', C: 'G', G: 'C', T: 'A', N: 'N' };

export function complement(base: string): string {
  return COMPLEMENT[base] ?? 'N';
}

/* ----------------------------------------------------------- genetic code */

/** One-letter residue for a codon, or 'X' when the codon has anything but A, C, G, T in it. */
export function translateCodon(codon: string): string {
  return CODON_TABLE[codon] ?? 'X';
}

export const AA_NAMES: Record<string, string> = {
  A: 'Ala', R: 'Arg', N: 'Asn', D: 'Asp', C: 'Cys', E: 'Glu', Q: 'Gln', G: 'Gly', H: 'His', I: 'Ile',
  L: 'Leu', K: 'Lys', M: 'Met', F: 'Phe', P: 'Pro', S: 'Ser', T: 'Thr', W: 'Trp', Y: 'Tyr', V: 'Val',
  '*': 'Stop', X: 'Unknown',
};

export interface Codon {
  /** 0-based codon number. */
  index: number;
  /** Forward-strand index of the codon's first base. */
  start: number;
  seq: string;
  aa: string;
}

export function codonsOf(seq: string, frame = 0): Codon[] {
  const out: Codon[] = [];
  for (let start = frame, index = 0; start + 3 <= seq.length; start += 3, index++) {
    const s = seq.slice(start, start + 3);
    out.push({ index, start, seq: s, aa: translateCodon(s) });
  }
  return out;
}

function codonAt(seq: string, frame: number, index: number): Codon | null {
  if (index < frame) return null;
  const ci = Math.floor((index - frame) / 3);
  const start = frame + ci * 3;
  if (start + 3 > seq.length) return null;
  const s = seq.slice(start, start + 3);
  return { index: ci, start, seq: s, aa: translateCodon(s) };
}

/* --------------------------------------------------------- guide geometry */

/** Forward-strand index of protospacer position p (1-based from the guide's 5' end). */
export function protoPosToIndex(g: Guide, p: number): number {
  return g.strand === '+' ? g.protoStart + p - 1 : g.protoEnd - p;
}

/** Inverse of protoPosToIndex. Null when the index lies outside the protospacer. */
export function indexToProtoPos(g: Guide, i: number): number | null {
  if (i < g.protoStart || i >= g.protoEnd) return null;
  return g.strand === '+' ? i - g.protoStart + 1 : g.protoEnd - i;
}

/** Protospacer and PAM as the guide reads them, 5'→3', whatever the strand. */
export function guideSequences(seq: string, g: Guide): { spacer: string; pam: string } {
  const spacer = seq.slice(g.protoStart, g.protoEnd);
  const pam = seq.slice(Math.max(0, g.pamStart), Math.max(0, g.pamEnd));
  return g.strand === '+' ? { spacer, pam } : { spacer: reverseComplement(spacer), pam: reverseComplement(pam) };
}

/* ---------------------------------------------------------- edit analysis */

export type Consequence = 'silent' | 'missense' | 'nonsense' | 'start-loss' | 'stop-loss' | 'noncoding';

export const CONSEQUENCE_LABEL: Record<Consequence, string> = {
  silent: 'Silent',
  missense: 'Missense',
  nonsense: 'Nonsense',
  'start-loss': 'Start lost',
  'stop-loss': 'Stop lost',
  noncoding: 'Non-coding',
};

export function classify(codonIndex: number, refAa: string, altAa: string): Consequence {
  if (refAa === 'X' || altAa === 'X') return 'noncoding';
  if (refAa === altAa) return 'silent';
  if (codonIndex === 0 && refAa === 'M') return 'start-loss';
  if (altAa === '*') return 'nonsense';
  if (refAa === '*') return 'stop-loss';
  return 'missense';
}

export interface EditSite {
  /** Position in the protospacer, 1-based from its 5' end. */
  protoPos: number;
  /** Forward-strand index of the base. */
  index: number;
  /** Forward-strand base before and after the edit. */
  ref: string;
  alt: string;
  /** Null when the base falls outside a full codon in the reading frame. */
  codonIndex: number | null;
  /**
   * The codon this base sits in and what it becomes once every edit in the window has
   * landed (processive editing). Bases that share a codon therefore share one result.
   */
  refCodon: string | null;
  altCodon: string | null;
  refAa: string | null;
  altAa: string | null;
  consequence: Consequence;
  /** How many edited bases share this codon, this one included. 0 outside a full codon. */
  codonEdits: number;
  /** True when this base is the one the user wants to change. */
  isTarget: boolean;
}

/** What a codon becomes when every edit in the window lands together. */
export interface CodonOutcome {
  codonIndex: number;
  start: number;
  refCodon: string;
  altCodon: string;
  refAa: string;
  altAa: string;
  consequence: Consequence;
  /** How many edited bases sit in this codon. */
  edits: number;
  /** True when one of them is the intended target base. */
  hasTarget: boolean;
}

export type TargetStatus =
  | { kind: 'none' }
  | { kind: 'not-in-spacer' }
  | { kind: 'outside-window'; protoPos: number }
  | { kind: 'wrong-base'; protoPos: number; base: string }
  | { kind: 'in-window'; protoPos: number };

export interface GuideAnalysis {
  spacer: string;
  pam: string;
  /** Forward-strand index range covered by the editing window, inclusive. */
  windowFrom: number;
  windowTo: number;
  edits: EditSite[];
  outcomes: CodonOutcome[];
  target: TargetStatus;
  /** Variants that fall inside the protospacer or PAM. */
  snpHits: Snp[];
}

export interface AnalyzeOptions {
  /** 0-based index of the base the user intends to change. */
  targetPos?: number | null;
  snps?: readonly Snp[];
}

/**
 * Which bases would this guide edit, and what do those edits do to the protein?
 * An editor converts `from` → `to` on the protospacer strand, so on a reverse-strand
 * guide the forward strand sees the complement (A→G becomes T→C).
 *
 * Every convertible base in the window is assumed to be edited together, and each codon
 * is judged by what it becomes with all of those edits applied. This is the same rule
 * the guide scanner uses for its bystander table.
 */
export function analyzeGuide(
  seq: string,
  frame: number,
  guide: Guide,
  editor: Editor,
  opts: AnalyzeOptions = {},
): GuideAnalysis {
  const [first, last] = editor.window;
  const protoLen = guide.protoEnd - guide.protoStart;
  const lo = Math.max(1, Math.min(first, last));
  const hi = Math.min(protoLen, Math.max(first, last));
  const { spacer, pam } = guideSequences(seq, guide);
  const altForward = guide.strand === '+' ? editor.to : complement(editor.to);
  const targetPos = opts.targetPos ?? null;

  // 1. Convertible bases inside the window, and the codon each one sits in.
  const sites: { protoPos: number; index: number; codon: Codon | null }[] = [];
  for (let p = lo; p <= hi; p++) {
    if (spacer.charAt(p - 1) !== editor.from) continue;
    const index = protoPosToIndex(guide, p);
    sites.push({ protoPos: p, index, codon: codonAt(seq, frame, index) });
  }

  // 2. Apply every edit that falls in a codon, then read the codon once.
  const sharing = new Map<number, number[]>();
  for (const s of sites) {
    if (!s.codon) continue;
    const list = sharing.get(s.codon.index);
    if (list) list.push(s.index);
    else sharing.set(s.codon.index, [s.index]);
  }
  const outcomeByCodon = new Map<number, CodonOutcome>();
  sharing.forEach((indices, codonIndex) => {
    const start = frame + codonIndex * 3;
    const refCodon = seq.slice(start, start + 3);
    const chars = refCodon.split('');
    for (const i of indices) chars[i - start] = altForward;
    const altCodon = chars.join('');
    const refAa = translateCodon(refCodon);
    const altAa = translateCodon(altCodon);
    outcomeByCodon.set(codonIndex, {
      codonIndex,
      start,
      refCodon,
      altCodon,
      refAa,
      altAa,
      consequence: classify(codonIndex, refAa, altAa),
      edits: indices.length,
      hasTarget: targetPos !== null && indices.includes(targetPos),
    });
  });

  // 3. One row per edited base, carrying the outcome of its codon.
  const edits: EditSite[] = sites.map((s) => {
    const o = s.codon ? outcomeByCodon.get(s.codon.index) : undefined;
    return {
      protoPos: s.protoPos,
      index: s.index,
      ref: seq.charAt(s.index),
      alt: altForward,
      codonIndex: o ? o.codonIndex : null,
      refCodon: o ? o.refCodon : null,
      altCodon: o ? o.altCodon : null,
      refAa: o ? o.refAa : null,
      altAa: o ? o.altAa : null,
      consequence: o ? o.consequence : 'noncoding',
      codonEdits: o ? o.edits : 0,
      isTarget: targetPos === s.index,
    };
  });
  const outcomes = [...outcomeByCodon.values()].sort((a, b) => a.start - b.start);

  const a = protoPosToIndex(guide, lo);
  const b = protoPosToIndex(guide, hi);

  let target: TargetStatus = { kind: 'none' };
  if (targetPos !== null) {
    const p = indexToProtoPos(guide, targetPos);
    if (p === null) target = { kind: 'not-in-spacer' };
    else if (p < lo || p > hi) target = { kind: 'outside-window', protoPos: p };
    else if (spacer.charAt(p - 1) !== editor.from) target = { kind: 'wrong-base', protoPos: p, base: spacer.charAt(p - 1) };
    else target = { kind: 'in-window', protoPos: p };
  }

  const spanStart = Math.min(guide.protoStart, guide.pamStart);
  const spanEnd = Math.max(guide.protoEnd, guide.pamEnd);
  const snpHits = (opts.snps ?? []).filter((s) => s.pos >= spanStart && s.pos < spanEnd);

  return { spacer, pam, windowFrom: Math.min(a, b), windowTo: Math.max(a, b), edits, outcomes, target, snpHits };
}

/* ------------------------------------------------------------ lane packing */

export interface LaneSpan {
  id: string;
  start: number;
  end: number;
}

/** First-fit interval packing: overlapping spans go to different lanes. */
export function packLanes(spans: readonly LaneSpan[], gap = 1): { lanes: Map<string, number>; count: number } {
  const sorted = [...spans].sort((x, y) => x.start - y.start || x.end - y.end);
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const s of sorted) {
    let lane = laneEnds.findIndex((end) => end + gap <= s.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(s.end);
    } else {
      laneEnds[lane] = s.end;
    }
    lanes.set(s.id, lane);
  }
  return { lanes, count: Math.max(1, laneEnds.length) };
}
