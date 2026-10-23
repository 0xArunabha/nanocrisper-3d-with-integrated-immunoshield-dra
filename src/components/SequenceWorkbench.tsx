// src/components/SequenceWorkbench.tsx
/**
 * Base-editor sequence view in the style of a genome browser: one position ruler
 * with stacked tracks under it (sequence, codons, edit outcome, guides, variants).
 * Pick a guide and its editing window is shaded across every track, with the
 * bystander edits it would make summarised underneath.
 *
 *   <SequenceWorkbench
 *     sequence={cds}                  // 5'→3', forward strand, from the ATG
 *     title="HBB (exon 1)"
 *     editor={{ name: 'ABE8e', from: 'A', to: 'G', window: [4, 8] }}
 *     guides={guides}                 // see Guide in engines/crispr/sequenceModel.ts
 *     snps={snps}                     // optional
 *     targetPos={19}                  // optional: 0-based index of the base to change
 *     audit="summary"                 // 'full' adds the spacer and a per-edit table
 *   />
 *
 * MHC-I epitopes are not drawn here on purpose. They sit in the editor protein
 * (Cas9 plus deaminase), not in this gene, so they need their own protein track.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import './SequenceWorkbench.css';
import {
  AA_NAMES,
  CONSEQUENCE_LABEL,
  analyzeGuide,
  codonsOf,
  guideSequences,
  packLanes,
} from '../engines/crispr/sequenceModel';
import type {
  CodonOutcome,
  Consequence,
  EditSite,
  Editor,
  Guide,
  GuideAnalysis,
  Snp,
} from '../engines/crispr/sequenceModel';

export interface SequenceWorkbenchProps {
  /** Coding sequence, 5'→3', forward strand. Anything other than A/C/G/T is shown as N. */
  sequence: string;
  title?: string;
  editor: Editor;
  guides: readonly Guide[];
  /** Variants to draw, for example South Asian SNPs. */
  snps?: readonly Snp[];
  /** 0-based index of the base you intend to change. Marked on the ruler and checked against every guide. */
  targetPos?: number | null;
  /** Index of the first full codon (0, 1 or 2). */
  frame?: 0 | 1 | 2;
  /** Added to residue numbers. HBB legacy numbering skips the initiator Met, so pass -1. */
  residueOffset?: number;
  /** Controlled selection. Leave undefined and the component keeps its own. */
  selectedGuideId?: string | null;
  onSelectGuide?: (id: string) => void;
  /** Starting zoom in pixels per nucleotide (8, 10, 12, 14, 16 or 20), or 'fit' to show the whole sequence when it fits. */
  defaultZoom?: number | 'fit';
  /** What to show under the tracks for the selected guide. */
  audit?: 'full' | 'summary' | 'none';
}

const NO_SNPS: readonly Snp[] = [];
const ZOOMS: readonly number[] = [8, 10, 12, 14, 16, 20];
const OVERSCAN = 40; // nucleotides drawn beyond each edge of the viewport
const GUTTER = 16; // empty space after the last base, in px
const ROW = { ruler: 30, seq: 26, codon: 24, residue: 16, outcome: 24, guideLane: 24, snpLane: 20, pad: 8 };

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Status = 'ok' | 'warn' | 'bad' | 'none';

/** Largest zoom step at which the whole sequence fits in `width`; the smallest step if none does. */
function fitZoomIndex(width: number, length: number): number {
  let best = 0;
  ZOOMS.forEach((z, i) => {
    if (length * z + GUTTER <= width) best = i;
  });
  return best;
}

function snpFreq(s: Snp): string {
  const af = s.af === undefined ? 'n/a' : `${(s.af * 100).toFixed(1)}%`;
  return `${s.pop ?? 'AF'} ${af}`;
}

function snpLabel(s: Snp): string {
  return `${s.id} · ${snpFreq(s)}`;
}

/** Colour role of an edit: the intended edit and silent edits are fine, anything else changes the protein. */
function editStatus(consequence: Consequence, isTarget: boolean): Status {
  if (isTarget) return 'ok';
  if (consequence === 'silent') return 'ok';
  if (consequence === 'noncoding') return 'none';
  return 'bad';
}

/** A codon that carries the target plus a bystander needs a look; otherwise follow the edit's own role. */
function outcomeStatus(o: CodonOutcome): Status {
  if (o.hasTarget) return o.edits > 1 ? 'warn' : 'ok';
  return editStatus(o.consequence, false);
}

/** 'V7→A missense', 'E23 silent'. Pass withLabel=false for the intended edit, where the label adds nothing. */
function editEffect(e: EditSite, residueOffset: number, withLabel = true): string {
  if (e.codonIndex === null || e.refAa === null || e.altAa === null) return 'outside a full codon';
  const n = e.codonIndex + 1 + residueOffset;
  if (e.refAa === e.altAa) return `${e.refAa}${n} silent`;
  const change = `${e.refAa}${n}→${e.altAa}`;
  return withLabel ? `${change} ${CONSEQUENCE_LABEL[e.consequence].toLowerCase()}` : change;
}

interface Row {
  key: string;
  label: string;
  height: number;
  top?: boolean;
  decorative?: boolean;
  content: ReactNode;
}

export function SequenceWorkbench({
  sequence,
  title,
  editor,
  guides,
  snps = NO_SNPS,
  targetPos = null,
  frame = 0,
  residueOffset = 0,
  selectedGuideId,
  onSelectGuide,
  defaultZoom = 'fit',
  audit = 'full',
}: SequenceWorkbenchProps) {
  const seq = useMemo(() => sequence.toUpperCase().replace(/[^ACGTN]/g, 'N'), [sequence]);
  const codons = useMemo(() => codonsOf(seq, frame), [seq, frame]);
  const visibleSnps = useMemo(() => snps.filter((s) => s.pos >= 0 && s.pos < seq.length), [snps, seq]);

  /* ---- selection: controlled when selectedGuideId is passed, internal otherwise ---- */
  const [innerSel, setInnerSel] = useState<string | null>(guides[0]?.id ?? null);
  const selId = selectedGuideId === undefined ? innerSel : selectedGuideId;
  const selected = useMemo(() => guides.find((g) => g.id === selId) ?? null, [guides, selId]);
  const select = (id: string) => {
    if (selectedGuideId === undefined) setInnerSel(id);
    onSelectGuide?.(id);
  };

  const analysis = useMemo(
    () => (selected ? analyzeGuide(seq, frame, selected, editor, { targetPos, snps: visibleSnps }) : null),
    [seq, frame, selected, editor, targetPos, visibleSnps],
  );
  const editAt = useMemo(() => {
    const m = new Map<number, EditSite>();
    analysis?.edits.forEach((e) => m.set(e.index, e));
    return m;
  }, [analysis]);

  /* ---- zoom: 'fit' follows the width of the panel until the user picks a zoom for this sequence ---- */
  const scrollRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  const [manual, setManual] = useState<{ seq: string; idx: number } | null>(null);
  const startIdx = typeof defaultZoom === 'number' && ZOOMS.includes(defaultZoom) ? ZOOMS.indexOf(defaultZoom) : 1;
  const zoomIdx =
    manual !== null && manual.seq === seq
      ? manual.idx
      : defaultZoom === 'fit'
        ? fitZoomIndex(boxW, seq.length)
        : startIdx;
  const ntW = ZOOMS[zoomIdx] ?? 10;
  const pendingCenter = useRef<number | null>(null);
  const changeZoom = (delta: number) => {
    const next = Math.min(ZOOMS.length - 1, Math.max(0, zoomIdx + delta));
    if (next === zoomIdx) return;
    const el = scrollRef.current;
    if (el) pendingCenter.current = (el.scrollLeft + el.clientWidth / 2) / ntW;
    setManual({ seq, idx: next });
  };

  /* ---- scrolling: draw only what is near the viewport ---- */
  const [view, setView] = useState({ start: 0, end: Math.min(seq.length, 320) });

  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) setBoxW(el.clientWidth);
  }, []);

  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pendingCenter.current !== null) {
      el.scrollLeft = pendingCenter.current * ntW - el.clientWidth / 2;
      pendingCenter.current = null;
    }
  }, [ntW]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const start = Math.floor(el.scrollLeft / ntW);
      const end = Math.ceil((el.scrollLeft + el.clientWidth) / ntW);
      setView((v) => (v.start === start && v.end === end ? v : { start, end }));
      setBoxW(el.clientWidth);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener('scroll', schedule, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', schedule);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ntW, seq.length]);

  /* bring a newly selected guide into view (a zoom or a data refresh must not move the view) */
  const lastScrolledTo = useRef<string | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !selected || lastScrolledTo.current === selected.id) return;
    const first = lastScrolledTo.current === null;
    lastScrolledTo.current = selected.id;
    const x0 = Math.min(selected.protoStart, selected.pamStart) * ntW;
    const x1 = Math.max(selected.protoEnd, selected.pamEnd) * ntW;
    const margin = 24;
    const alreadyVisible = x0 - margin >= el.scrollLeft && x1 + margin <= el.scrollLeft + el.clientWidth;
    if (alreadyVisible) return;
    const calm = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({
      left: Math.max(0, (x0 + x1) / 2 - el.clientWidth / 2),
      behavior: calm || first ? 'auto' : 'smooth',
    });
  }, [selected, ntW]);

  /* ---- hover readout ---- */
  const [hover, setHover] = useState<number | null>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left) / ntW);
    setHover(i >= 0 && i < seq.length ? i : null);
  };

  /* ---- copy buttons ---- */
  const [copied, setCopied] = useState<'sequence' | 'protein' | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const copy = async (what: 'sequence' | 'protein') => {
    const text = what === 'sequence' ? seq : codons.map((c) => c.aa).join('');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // no clipboard here: an insecure page, or the browser refused
    }
    setCopied(what);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 1600);
  };

  /* ---- lanes ---- */
  const guideLayout = useMemo(
    () =>
      packLanes(
        guides.map((g) => ({
          id: g.id,
          start: Math.min(g.protoStart, g.pamStart),
          end: Math.max(g.protoEnd, g.pamEnd),
        })),
      ),
    [guides],
  );
  const snpLayout = useMemo(
    () =>
      packLanes(
        visibleSnps.map((s) => ({
          id: `${s.id}:${s.pos}`,
          start: s.pos,
          end: s.pos + 1 + Math.ceil((snpLabel(s).length * 6.3 + 12) / ntW),
        })),
      ),
    [visibleSnps, ntW],
  );

  /* ---- what is on screen ---- */
  const lo = Math.max(0, view.start - OVERSCAN);
  const hi = Math.min(seq.length, view.end + OVERSCAN);
  const targetIn = targetPos !== null && targetPos >= 0 && targetPos < seq.length;

  const ticks: ReactNode[] = [];
  if (lo === 0 && seq.length > 0) {
    ticks.push(
      <span key="p1" className="sw-tick" style={{ left: ntW / 2 }}>
        1
      </span>,
    );
  }
  for (let p = Math.max(10, Math.ceil((lo + 1) / 10) * 10); p <= hi; p += 10) {
    ticks.push(
      <span key={p} className="sw-tick" style={{ left: (p - 1) * ntW + ntW / 2 }}>
        {p}
      </span>,
    );
  }

  const bases: ReactNode[] = [];
  for (let i = lo; i < hi; i++) {
    const b = seq.charAt(i);
    const edit = editAt.get(i);
    const cls = ['sw-nt', `sw-nt--${b}`, edit ? 'is-edit' : '', i === targetPos ? 'is-target' : '']
      .filter(Boolean)
      .join(' ');
    bases.push(
      <span
        key={i}
        className={cls}
        data-status={edit ? editStatus(edit.consequence, edit.isTarget) : undefined}
        style={{ left: i * ntW, width: ntW }}
      >
        {b}
      </span>,
    );
  }

  const codonCells: ReactNode[] = [];
  const resNums: ReactNode[] = [];
  const c0 = Math.max(0, Math.floor((lo - frame) / 3));
  const c1 = Math.min(codons.length, Math.ceil((hi - frame) / 3));
  for (let ci = c0; ci < c1; ci++) {
    const c = codons[ci];
    if (!c) continue;
    const n = ci + 1 + residueOffset;
    codonCells.push(
      <span
        key={ci}
        className={`sw-codon ${ci % 2 === 0 ? 'even' : 'odd'}`}
        style={{ left: c.start * ntW + 1, width: 3 * ntW - 2 }}
        title={`${c.seq} · ${AA_NAMES[c.aa] ?? c.aa} · residue ${n}`}
      >
        {c.aa}
      </span>,
    );
    if (n === 1 || (n > 0 && n % 5 === 0)) {
      resNums.push(
        <span key={ci} className="sw-resnum" style={{ left: c.start * ntW + 1.5 * ntW }}>
          {n}
        </span>,
      );
    }
  }

  const outcomeCells = (analysis?.outcomes ?? [])
    .filter((o) => o.start + 3 > lo && o.start < hi)
    .map((o) => {
      const effect = `${o.refCodon} → ${o.altCodon} · ${AA_NAMES[o.refAa] ?? o.refAa} → ${AA_NAMES[o.altAa] ?? o.altAa} · ${CONSEQUENCE_LABEL[o.consequence].toLowerCase()}`;
      const mixed = o.edits > 1 ? ` (${o.edits} edits in this codon${o.hasTarget ? ', one is the target' : ''})` : '';
      return (
        <span
          key={o.start}
          className="sw-codon sw-outcome"
          data-status={outcomeStatus(o)}
          style={{ left: o.start * ntW + 1, width: 3 * ntW - 2 }}
          title={effect + mixed}
        >
          <i className="sw-dot" aria-hidden="true" />
          {o.altAa}
        </span>
      );
    });

  const guideBars = guides.map((g) => {
    const lane = guideLayout.lanes.get(g.id) ?? 0;
    const { spacer, pam } = guideSequences(seq, g);
    const side = g.strand === '+' ? 'forward' : 'reverse';
    return (
      <button
        key={g.id}
        type="button"
        className="sw-guide"
        data-strand={g.strand}
        aria-pressed={g.id === selId}
        aria-label={`${g.id}, ${side} strand, protospacer ${spacer}, PAM ${pam}${g.detail ? `, ${g.detail}` : ''}`}
        onClick={() => select(g.id)}
        style={{ left: Math.min(g.protoStart, g.pamStart) * ntW, top: 4 + lane * ROW.guideLane }}
        title={`${g.id} · ${side} strand · ${spacer} ${pam}${g.detail ? ` · ${g.detail}` : ''}`}
      >
        <span className="sw-guide__spacer" style={{ width: (g.protoEnd - g.protoStart) * ntW }}>
          {g.strand === '+' ? `${g.label ?? g.id} →` : `← ${g.label ?? g.id}`}
        </span>
        <span className="sw-guide__pam" style={{ width: Math.max(0, g.pamEnd - g.pamStart) * ntW }}>
          {pam}
        </span>
      </button>
    );
  });

  const snpMarks = visibleSnps.map((s) => {
    const key = `${s.id}:${s.pos}`;
    const lane = snpLayout.lanes.get(key) ?? 0;
    const hit = analysis?.snpHits.some((h) => h.id === s.id && h.pos === s.pos) ?? false;
    const change = s.ref && s.alt ? ` · ${s.ref}>${s.alt}` : '';
    return (
      <div
        key={key}
        className={`sw-snp${hit ? ' is-hit' : ''}`}
        style={{ left: s.pos * ntW, top: 4 + lane * ROW.snpLane }}
        title={`${s.id}${change} · position ${s.pos + 1} · ${snpFreq(s)}`}
      >
        <span className="sw-snp__mark" style={{ width: ntW }}>
          <i />
        </span>
        <span className="sw-snp__label">{snpLabel(s)}</span>
      </div>
    );
  });

  const rows: Row[] = [
    {
      key: 'ruler',
      label: 'Position',
      height: ROW.ruler,
      decorative: true,
      content: (
        <>
          {ticks}
          {targetIn && <span className="sw-target-caret" style={{ left: targetPos * ntW + ntW / 2 }} />}
        </>
      ),
    },
    { key: 'seq', label: "Sequence 5'→3'", height: ROW.seq, decorative: true, content: bases },
    { key: 'codon', label: 'Codon', height: ROW.codon, decorative: true, content: codonCells },
    { key: 'residue', label: 'Residue', height: ROW.residue, decorative: true, content: resNums },
    { key: 'outcome', label: 'Edit outcome', height: ROW.outcome, decorative: true, content: outcomeCells },
    {
      key: 'guides',
      label: 'Guides',
      height: guideLayout.count * ROW.guideLane + ROW.pad,
      top: true,
      content: guideBars,
    },
  ];
  if (visibleSnps.length > 0) {
    rows.push({
      key: 'snps',
      label: 'Variants',
      height: snpLayout.count * ROW.snpLane + ROW.pad,
      top: true,
      content: snpMarks,
    });
  }

  const readout = (() => {
    if (hover === null) return 'Hover the sequence for coordinates';
    const ci = hover >= frame ? Math.floor((hover - frame) / 3) : -1;
    const c = ci >= 0 ? codons[ci] : undefined;
    const parts = [`Position ${hover + 1}`, seq.charAt(hover)];
    if (c) parts.push(`codon ${c.index + 1 + residueOffset} ${c.seq} · ${AA_NAMES[c.aa] ?? c.aa} (${c.aa})`);
    if (hover === targetPos) parts.push('target base');
    const v = visibleSnps.find((s) => s.pos === hover);
    if (v) parts.push(v.id);
    return parts.join(' · ');
  })();

  const [w0, w1] = editor.window;

  return (
    <section className="sw" aria-label={`Sequence workbench, ${title ?? 'sequence'}`}>
      <header className="sw-head">
        <h2 className="sw-title">{title ?? 'Sequence'}</h2>
        <span className="sw-meta">
          {seq.length} nt · {codons.length} codons · {editor.name} ({editor.from}→{editor.to}), window {w0}–{w1}
        </span>
        <div className="sw-tools">
          <div className="sw-group" role="group" aria-label="Copy">
            <button type="button" className="sw-btn sw-btn--text" title="Copy the coding sequence, 5'→3'" onClick={() => void copy('sequence')}>
              {copied === 'sequence' ? 'Copied' : 'Copy CDS'}
            </button>
            <button type="button" className="sw-btn sw-btn--text" title="Copy the translated protein" onClick={() => void copy('protein')}>
              {copied === 'protein' ? 'Copied' : 'Copy protein'}
            </button>
            <span className="sw-sr" role="status">
              {copied === null ? '' : `${copied === 'sequence' ? 'Sequence' : 'Protein'} copied to the clipboard`}
            </span>
          </div>
          <div className="sw-group" role="group" aria-label="Zoom">
            <button type="button" className="sw-btn" aria-label="Zoom out" disabled={zoomIdx === 0} onClick={() => changeZoom(-1)}>
              −
            </button>
            <span className="sw-zoom">{ntW} px/nt</span>
            <button
              type="button"
              className="sw-btn"
              aria-label="Zoom in"
              disabled={zoomIdx === ZOOMS.length - 1}
              onClick={() => changeZoom(1)}
            >
              +
            </button>
          </div>
        </div>
      </header>

      <div className="sw-body">
        <div className="sw-labels" aria-hidden="true">
          {rows.map((r) => (
            <div key={r.key} className="sw-label" data-top={r.top ? '' : undefined} style={{ height: r.height }}>
              {r.label}
            </div>
          ))}
        </div>

        <div className="sw-scroll" ref={scrollRef} tabIndex={0} role="region" aria-label="Sequence tracks, scrollable">
          <div
            className="sw-canvas"
            style={{ width: seq.length * ntW + GUTTER }}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          >
            {rows.map((r) => (
              <div
                key={r.key}
                className={`sw-row sw-row--${r.key}`}
                aria-hidden={r.decorative ? true : undefined}
                style={
                  r.key === 'ruler'
                    ? { height: r.height, backgroundSize: `${ntW}px 5px`, backgroundPosition: `${ntW / 2 - 0.5}px 100%` }
                    : { height: r.height }
                }
              >
                {r.content}
              </div>
            ))}
            {analysis && (
              <div
                className="sw-window"
                aria-hidden="true"
                style={{
                  left: analysis.windowFrom * ntW,
                  width: (analysis.windowTo - analysis.windowFrom + 1) * ntW,
                }}
              />
            )}
            {hover !== null && <div className="sw-hover" aria-hidden="true" style={{ left: hover * ntW, width: ntW }} />}
          </div>
        </div>
      </div>

      <footer className="sw-foot">
        <span className="sw-readout" aria-live="off">
          {readout}
        </span>
        <div className="sw-legend" aria-hidden="true">
          <span>
            <i className="sw-key sw-key--window" />
            Editing window
          </span>
          <span>
            <i className="sw-key sw-key--edit" />
            Editable base
          </span>
          {targetIn && (
            <span>
              <i className="sw-key sw-key--target" />
              Target base
            </span>
          )}
        </div>
      </footer>

      {audit !== 'none' && (
        <GuideAudit
          full={audit === 'full'}
          guide={selected}
          analysis={analysis}
          editor={editor}
          targetPos={targetPos}
          residueOffset={residueOffset}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ audit */

function Dot({ status }: { status: Status }) {
  return <i className="sw-dot" data-status={status} aria-hidden="true" />;
}

interface Check {
  status: Status;
  text: string;
}

function targetCheck(analysis: GuideAnalysis, editor: Editor, targetPos: number, residueOffset: number): Check | null {
  const t = analysis.target;
  const [w0, w1] = editor.window;
  const where = `Target base (position ${targetPos + 1})`;
  switch (t.kind) {
    case 'none':
      return null;
    case 'not-in-spacer':
      return { status: 'warn', text: `${where} is outside this guide's protospacer.` };
    case 'outside-window':
      return {
        status: 'warn',
        text: `${where} is at protospacer position ${t.protoPos}, outside the editing window (${w0}–${w1}).`,
      };
    case 'wrong-base':
      return {
        status: 'warn',
        text: `${where} is in the window at protospacer position ${t.protoPos}, but reads ${t.base} on the guide strand and ${editor.name} converts ${editor.from}.`,
      };
    case 'in-window': {
      const e = analysis.edits.find((x) => x.isTarget);
      const change = e ? `: ${editEffect(e, residueOffset, false)}` : '';
      const others = e ? e.codonEdits - 1 : 0;
      const shared = others > 0 ? ` (this codon carries ${others} other edit${others > 1 ? 's' : ''}, applied together)` : '';
      return { status: 'ok', text: `${where} is in the editing window, at protospacer position ${t.protoPos}${change}${shared}.` };
    }
  }
}

function positions(list: readonly EditSite[]): string {
  return `guide position${list.length > 1 ? 's' : ''} ${list.map((e) => e.protoPos).join(', ')}`;
}

/** Edits that share a codon are read together, so describe each codon once. */
function editCheck(analysis: GuideAnalysis, editor: Editor, residueOffset: number): Check {
  const [w0, w1] = editor.window;
  if (analysis.edits.length === 0) {
    return { status: 'warn', text: `No ${editor.from} in guide positions ${w0}–${w1}, so ${editor.name} makes no edit with this guide.` };
  }
  const groups: EditSite[][] = [];
  const byCodon = new Map<number, EditSite[]>();
  for (const e of analysis.edits) {
    if (e.codonIndex === null) {
      groups.push([e]);
      continue;
    }
    let g = byCodon.get(e.codonIndex);
    if (!g) {
      g = [];
      byCodon.set(e.codonIndex, g);
      groups.push(g);
    }
    g.push(e);
  }
  const targetGroup = groups.find((g) => g.some((e) => e.isTarget));
  const withTarget = targetGroup ? targetGroup.filter((e) => !e.isTarget) : [];
  const others = groups.filter((g) => g !== targetGroup);

  if (targetGroup && others.length === 0 && withTarget.length === 0) {
    return { status: 'ok', text: 'No bystander edits: the target is the only editable base in the window.' };
  }
  const parts = others.map((g) => `${positions(g)} (${editEffect(g[0]!, residueOffset)})`);
  if (withTarget.length > 0) parts.push(`${positions(withTarget)} (same codon as the target)`);
  const harmful = others.some((g) => editStatus(g[0]!.consequence, false) === 'bad');
  const status: Status = harmful ? 'bad' : withTarget.length > 0 ? 'warn' : 'ok';
  return { status, text: `${targetGroup ? 'Bystander edits' : 'Edits in the window'}: ${parts.join('; ')}.` };
}

interface AuditProps {
  full: boolean;
  guide: Guide | null;
  analysis: GuideAnalysis | null;
  editor: Editor;
  targetPos: number | null;
  residueOffset: number;
}

function GuideAudit({ full, guide, analysis, editor, targetPos, residueOffset }: AuditProps) {
  if (!guide || !analysis) {
    return <div className="sw-audit sw-audit--empty">Select a guide to see its editing window and the bases it would change.</div>;
  }
  const [w0, w1] = editor.window;
  const checks: Check[] = [];
  if (targetPos !== null) {
    const t = targetCheck(analysis, editor, targetPos, residueOffset);
    if (t) checks.push(t);
  }
  checks.push(editCheck(analysis, editor, residueOffset));
  checks.push(
    analysis.snpHits.length === 0
      ? { status: 'ok', text: 'No variants in the protospacer or PAM.' }
      : {
          status: 'warn',
          text: `Variants in the protospacer or PAM: ${analysis.snpHits
            .map((s) => `${s.id} (position ${s.pos + 1}, ${snpFreq(s)})`)
            .join('; ')}.`,
        },
  );
  const editPositions = new Set(analysis.edits.map((e) => e.protoPos));

  return (
    <div className="sw-audit">
      <div className="sw-audit__head">
        <strong className="sw-audit__id">{guide.id}</strong>
        <span className="sw-kv">{guide.strand === '+' ? 'Forward strand' : 'Reverse strand'}</span>
        <span className="sw-kv">
          Protospacer{' '}
          <b className="num">
            {guide.protoStart + 1}–{guide.protoEnd}
          </b>
        </span>
        <span className="sw-kv">
          PAM{' '}
          <b className="num">
            {guide.pamStart + 1}–{guide.pamEnd}
          </b>{' '}
          <b className="mono">{analysis.pam}</b>
        </span>
      </div>

      {full && (
        <div className="sw-seqline">
          <span className="sw-kv">5′</span>
          <code className="sw-spacer">
            {analysis.spacer.split('').map((b, i) => {
              const p = i + 1;
              const cls = [p >= w0 && p <= w1 ? 'in-window' : '', editPositions.has(p) ? 'is-edit' : ''].filter(Boolean).join(' ');
              return (
                <span key={i} className={cls || undefined}>
                  {b}
                </span>
              );
            })}
          </code>
          <span className="sw-kv">3′</span>
        </div>
      )}

      <ul className="sw-checks">
        {checks.map((c, i) => (
          <li key={i}>
            <Dot status={c.status} />
            <span>{c.text}</span>
          </li>
        ))}
      </ul>

      {full && analysis.edits.length > 0 && (
        <>
          <table className="sw-table">
            <thead>
              <tr>
                <th className="num">Guide pos</th>
                <th className="num">Seq pos</th>
                <th>Codon</th>
                <th>Residue</th>
                <th>Consequence</th>
              </tr>
            </thead>
            <tbody>
              {analysis.edits.map((e) => (
                <tr key={e.index}>
                  <td className="num">{e.protoPos}</td>
                  <td className="num">{e.index + 1}</td>
                  <td className="mono">{e.refCodon ? `${e.refCodon} → ${e.altCodon}` : '—'}</td>
                  <td className="mono">
                    {e.codonIndex === null ? '—' : `${e.refAa}${e.codonIndex + 1 + residueOffset} → ${e.altAa}`}
                  </td>
                  <td>
                    <Dot status={editStatus(e.consequence, e.isTarget)} />
                    {CONSEQUENCE_LABEL[e.consequence]}
                    {e.isTarget ? ' · intended' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analysis.edits.some((e) => e.codonEdits > 1) && (
            <p className="sw-note">Rows that share a codon share one outcome, because every edit in the window is applied together.</p>
          )}
        </>
      )}
    </div>
  );
}

export default SequenceWorkbench;
