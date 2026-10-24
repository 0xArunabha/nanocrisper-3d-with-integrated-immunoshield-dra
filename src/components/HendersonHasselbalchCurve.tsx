// src/components/HendersonHasselbalchCurve.tsx
import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import './HendersonHasselbalchCurve.css';

/**
 * Henderson-Hasselbalch ionization curve with the H_II phase boundary.
 *
 * Left axis: % of the ionizable lipid that is protonated (alpha). Right axis: the packing parameter
 * CPP = 1.08 + 0.58 * alpha that follows from it, so the dashed CPP = 1.45 line can be read off the
 * plot instead of from a legend. Above that line the particle packs as an inverted hexagonal (H_II,
 * fusogenic) phase, below it as a lamellar (L_alpha) bilayer; the part of the curve in the H_II regime
 * is drawn in the H_II color and everything else in ink. Color is used for those states and for the
 * four landmarks only.
 *
 * Landmarks (late endosome pH 5.5, apparent pKa, blood pH 7.4, and the pH where CPP reaches 1.45)
 * are named in a rail above the plot. Each name hangs from a dotted line that runs down through the
 * landmark's point on the curve. The names are stacked into rows so they can never overlap each
 * other, and they sit outside the plot, so they can never cover the curve. The hover readout lives in
 * the header, not on the plot, for the same reason. The SVG is drawn at its real pixel width, so text
 * stays 10 px on any screen.
 *
 * The packing constants mirror calculateAmbientLnpTelemetry in engines/nanotech/lnpSimulator.ts.
 */
const CPP_BASE = 1.08;
const CPP_SLOPE = 0.58;
const HII_CPP_THRESHOLD = 1.45;
/** Protonation (%) at which CPP reaches the H_II threshold. */
const HII_ALPHA_PCT = ((HII_CPP_THRESHOLD - CPP_BASE) / CPP_SLOPE) * 100;

const PH_MIN = 4.5;
const PH_MAX = 8.0;
const ENDOSOME_PH = 5.5;
const BLOOD_PH = 7.4;
const PH_TICKS = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
/** Right-axis CPP ticks; the 1.45 threshold is drawn separately, so 1.4 and 1.5 are left out. */
const CPP_TICKS = [1.1, 1.2, 1.3, 1.6];
/** On a short plot 1.3 would crowd the name of the L_alpha regime, so it is left out. */
const CPP_TICKS_SHORT = [1.1, 1.2, 1.6];
const SHORT_PLOT_H = 140;

// Plot size in CSS pixels. The plot height follows the width, within limits.
const DEFAULT_WIDTH = 520;
const MIN_WIDTH = 240;
const ASPECT = 0.36;
const MIN_PLOT_H = 104;
const MAX_PLOT_H = 194;
const PAD = { right: 50, bottom: 34, left: 42 };

// Label rail. Two rows are always reserved so the plot does not jump while the pKa slider is dragged.
const FLAG_ROW = 13;
const RESERVED_ROWS = 2;
const FLAG_GAP = 8;
/** Advance of one 10 px monospace glyph, rounded up a little so names never touch. */
const CHAR_W = 6.1;
const COMPACT_PLOT_W = 280;

type LandmarkId = 'endosome' | 'pka' | 'blood' | 'fusion';

interface Landmark {
  id: LandmarkId;
  ph: number;
  text: string;
}

interface Flag extends Landmark {
  x: number;
  textX: number;
  row: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getCpp = (alphaPct: number) => Number((CPP_BASE + (alphaPct / 100) * CPP_SLOPE).toFixed(2));

/**
 * Stacks the landmark names into rows (row 0 is the one next to the plot). Names are handled from right to left and
 * each starts just right of its own dotted line. A name goes into the first row where it neither overlaps a name
 * already there nor reaches over the dotted line of a name in a higher row (that line runs down through this row).
 * So no name overlaps another and no line runs through a name.
 */
function layoutFlags(
  landmarks: Landmark[],
  getX: (ph: number) => number,
  minX: number,
  maxX: number,
): { flags: Flag[]; rows: number } {
  const rowLeft: number[] = [];
  const flags: Flag[] = [];
  for (const mark of [...landmarks].sort((a, b) => b.ph - a.ph)) {
    const x = getX(mark.ph);
    const w = mark.text.length * CHAR_W;
    // Keep the name inside the figure if its line is very close to the right edge.
    const textX = Math.max(minX, Math.min(x + 4, maxX - w));
    const right = textX + w + FLAG_GAP;
    const fits = (row: number) =>
      right <= rowLeft[row] && flags.every((placed) => placed.row <= row || right <= placed.x);
    let row = rowLeft.findIndex((_, index) => fits(index));
    if (row === -1) {
      row = rowLeft.length;
      rowLeft.push(textX);
    } else {
      rowLeft[row] = textX;
    }
    flags.push({ ...mark, x, textX, row });
  }
  return { flags, rows: rowLeft.length };
}

export function HendersonHasselbalchCurve({ lipidPka }: { lipidPka: number }) {
  const [hoveredPh, setHoveredPh] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
  const plotRef = useRef<HTMLDivElement>(null);

  // Measure the plot so the SVG is drawn 1:1 instead of being scaled (which would scale its text too).
  useLayoutEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(MIN_WIDTH, Math.round(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = width - PAD.left - PAD.right;
  const plotH = Math.round(clamp(width * ASPECT - 46, MIN_PLOT_H, MAX_PLOT_H));
  const compact = plotW < COMPACT_PLOT_W;
  const plotLeft = PAD.left;
  const plotRight = width - PAD.right;

  const getX = (ph: number) => plotLeft + ((ph - PH_MIN) / (PH_MAX - PH_MIN)) * plotW;
  // Henderson-Hasselbalch: % protonated = 100 / (1 + 10^(pH - pKa))
  const getAlpha = (ph: number) => 100 / (1 + Math.pow(10, ph - lipidPka));

  // pH at which alpha, and so CPP, reaches the H_II threshold: pH = pKa + log10(100 / alpha - 1)
  const fusionPh = lipidPka + Math.log10(100 / HII_ALPHA_PCT - 1);
  const fusionInRange = fusionPh > PH_MIN && fusionPh < PH_MAX;

  const core = (
    [
      { id: 'endosome', ph: ENDOSOME_PH, text: `Endosome ${ENDOSOME_PH.toFixed(1)}` },
      { id: 'pka', ph: lipidPka, text: `pKa ${lipidPka.toFixed(2)}` },
      { id: 'blood', ph: BLOOD_PH, text: `Blood ${BLOOD_PH.toFixed(1)}` },
    ] satisfies Landmark[]
  ).filter((m) => m.ph >= PH_MIN && m.ph <= PH_MAX);
  // The fusion name is the longest and the least essential one. It is dropped on a narrow plot, and whenever it would
  // need a third row (the red curve, the ring and the right axis still show where the regime starts).
  const fusion: Landmark[] = fusionInRange && !compact ? [{ id: 'fusion', ph: fusionPh, text: `Fusion ≤ ${fusionPh.toFixed(2)}` }] : [];
  let layout = layoutFlags([...core, ...fusion], getX, 2, width - 2);
  if (layout.rows > RESERVED_ROWS) layout = layoutFlags(core, getX, 2, width - 2);
  const { flags, rows } = layout;

  const plotTop = Math.max(RESERVED_ROWS, rows) * FLAG_ROW + 6;
  const plotBottom = plotTop + plotH;
  const height = plotBottom + PAD.bottom;
  const getY = (alphaPct: number) => plotTop + (1 - alphaPct / 100) * plotH;
  const yOfCpp = (cpp: number) => getY(((cpp - CPP_BASE) / CPP_SLOPE) * 100);
  const yHii = getY(HII_ALPHA_PCT);
  const flagBaseline = (row: number) => plotTop - 6 - row * FLAG_ROW;

  // Curve, split where it crosses into the H_II regime
  const splitPh = clamp(fusionPh, PH_MIN, PH_MAX);
  const STEPS = 90;
  const pathBetween = (from: number, to: number) => {
    const n = Math.max(2, Math.ceil(((to - from) / (PH_MAX - PH_MIN)) * STEPS));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const ph = from + ((to - from) * i) / n;
      d += `${i === 0 ? 'M' : 'L'} ${getX(ph).toFixed(1)} ${getY(getAlpha(ph)).toFixed(1)} `;
    }
    return d.trim();
  };
  const hiiPath = splitPh > PH_MIN ? pathBetween(PH_MIN, splitPh) : null;
  const lamellarPath = splitPh < PH_MAX ? pathBetween(splitPh, PH_MAX) : null;

  const endosomeAlpha = getAlpha(ENDOSOME_PH);
  const bloodAlpha = getAlpha(BLOOD_PH);

  // A value label goes up and to the right of its point, where the falling curve leaves room. A point near the top of the
  // plot has no room above it, so its label goes down and to the left, which is under the curve there.
  const valueLabel = (ph: number, alpha: number) => {
    const x = getX(ph);
    const y = getY(alpha);
    return y - plotTop > 16
      ? { x: x + 7, y: y - 7, anchor: 'start' as const }
      : { x: x - 7, y: y + 15, anchor: 'end' as const };
  };
  const endosomeLabel = valueLabel(ENDOSOME_PH, endosomeAlpha);
  const bloodLabel = valueLabel(BLOOD_PH, bloodAlpha);

  const hover =
    hoveredPh === null
      ? null
      : (() => {
          const alpha = getAlpha(hoveredPh);
          const cpp = getCpp(alpha);
          return { ph: hoveredPh, alpha, cpp, x: getX(hoveredPh), y: getY(alpha), hii: cpp >= HII_CPP_THRESHOLD };
        })();

  const phAt = (clientX: number, rect: DOMRect) => {
    const x = clamp(((clientX - rect.left) / rect.width) * width, plotLeft, plotRight);
    return Number((PH_MIN + ((x - plotLeft) / plotW) * (PH_MAX - PH_MIN)).toFixed(2));
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width > 0) setHoveredPh(phAt(event.clientX, rect));
  };
  // Keyboard: arrows move the cursor 0.1 pH (Shift: 0.5), Home / End jump to the ends, Escape clears it.
  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 0.5 : 0.1;
    const current = hoveredPh ?? clamp(lipidPka, PH_MIN, PH_MAX);
    let next: number | null | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
    else if (event.key === 'Home') next = PH_MIN;
    else if (event.key === 'End') next = PH_MAX;
    else if (event.key === 'Escape') next = null;
    if (next === undefined) return;
    event.preventDefault();
    setHoveredPh(next === null ? null : Number(clamp(next, PH_MIN, PH_MAX).toFixed(2)));
  };

  // A pH tick label is skipped where a landmark's line would run through it.
  const tickCovered = (ph: number) => flags.some((flag) => Math.abs(flag.x - getX(ph)) < 11);

  const spoken = `Protonation against pH for an ionizable lipid with pKa ${lipidPka.toFixed(2)}. ${endosomeAlpha.toFixed(0)}% protonated at pH 5.5, ${bloodAlpha.toFixed(0)}% at pH 7.4. Packing parameter CPP reaches ${HII_CPP_THRESHOLD}, the hexagonal fusion regime, below pH ${fusionPh.toFixed(2)}. Use the arrow keys to read other pH values.`;

  return (
    <figure className="hh">
      <figcaption className="hh-head">
        <span className="hh-title">
          Ionization and H<sub>II</sub> phase transition
        </span>
        <span className="hh-readout" aria-hidden="true">
          {hover ? (
            <>
              <b>pH {hover.ph.toFixed(2)}</b>
              <span>α {hover.alpha.toFixed(1)}%</span>
              <span>CPP {hover.cpp.toFixed(2)}</span>
              <span className={hover.hii ? 'hh-readout__hii' : undefined}>
                {hover.hii ? (
                  <>
                    H<sub>II</sub> fusion
                  </>
                ) : (
                  <>
                    L<sub>α</sub> lamellar
                  </>
                )}
              </span>
            </>
          ) : (
            <span>
              pK<sub>a</sub> {lipidPka.toFixed(2)} · CPP = {CPP_BASE} + {CPP_SLOPE}·α
            </span>
          )}
        </span>
      </figcaption>

      <div className="hh-plot" ref={plotRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="hh-svg"
          role="img"
          tabIndex={0}
          aria-label={spoken}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredPh(null)}
          onKeyDown={handleKeyDown}
          onBlur={() => setHoveredPh(null)}
        >
          {/* H_II regime: CPP >= 1.45 */}
          <rect className="hh-zone" x={plotLeft} y={plotTop} width={plotW} height={Math.max(0, yHii - plotTop)} />

          {/* % protonation grid and left axis */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line className={pct === 50 ? 'hh-grid hh-grid--mid' : 'hh-grid'} x1={plotLeft} y1={getY(pct)} x2={plotRight} y2={getY(pct)} />
              <text className="hh-tick" x={plotLeft - 6} y={getY(pct) + 3.5} textAnchor="end">
                {pct}%
              </text>
            </g>
          ))}

          {/* CPP: right axis, with the H_II threshold line across the plot */}
          <line className="hh-threshold" x1={plotLeft} y1={yHii} x2={plotRight} y2={yHii} />
          {(plotH < SHORT_PLOT_H ? CPP_TICKS_SHORT : CPP_TICKS).map((cpp) => (
            <g key={cpp}>
              <line className="hh-tickmark" x1={plotRight} y1={yOfCpp(cpp)} x2={plotRight + 3} y2={yOfCpp(cpp)} />
              <text className="hh-tick" x={plotRight + 6} y={yOfCpp(cpp) + 3.5}>
                {cpp.toFixed(1)}
              </text>
            </g>
          ))}
          <line className="hh-tickmark hh-tickmark--hii" x1={plotRight} y1={yHii} x2={plotRight + 3} y2={yHii} />
          <text className="hh-tick hh-tick--hii" x={plotRight + 6} y={yHii + 3.5}>
            {HII_CPP_THRESHOLD.toFixed(2)}
          </text>
          <text className="hh-zone-name" x={plotRight + 6} y={yHii - 10}>
            H<tspan className="hh-sub" dy="2">II</tspan>
          </text>
          <text className="hh-zone-name hh-zone-name--lamellar" x={plotRight + 6} y={yHii + 19}>
            L<tspan className="hh-sub" dy="2">α</tspan>
          </text>

          {/* pH axis */}
          {PH_TICKS.map((ph) => (
            <g key={ph}>
              <line className="hh-tickmark" x1={getX(ph)} y1={plotBottom} x2={getX(ph)} y2={plotBottom + 3} />
              {!tickCovered(ph) && (
                <text className="hh-tick" x={getX(ph)} y={plotBottom + 15} textAnchor="middle">
                  {ph.toFixed(1)}
                </text>
              )}
            </g>
          ))}
          <line className="hh-axis" x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} />

          {/* Landmark lines run from the name above the plot, through the point, to the axis */}
          {flags.map((flag) => (
            <g key={flag.id} className={`hh-c-${flag.id}`}>
              <line className="hh-pole" x1={flag.x} y1={flagBaseline(flag.row) - 9} x2={flag.x} y2={plotBottom} />
              <text className="hh-tag" x={flag.textX} y={flagBaseline(flag.row)}>
                {flag.text}
              </text>
            </g>
          ))}

          {/* The curve: ink, with the H_II part in the H_II color */}
          {lamellarPath && <path className="hh-curve" d={lamellarPath} />}
          {hiiPath && <path className="hh-curve hh-curve--hii" d={hiiPath} />}

          {/* Points and their values */}
          {fusionInRange && <circle className="hh-ring hh-c-fusion" cx={getX(fusionPh)} cy={yHii} r="3.5" />}
          {lipidPka >= PH_MIN && lipidPka <= PH_MAX && <circle className="hh-dot hh-c-pka" cx={getX(lipidPka)} cy={getY(50)} r="3.5" />}
          <g className="hh-c-endosome">
            <circle className="hh-dot" cx={getX(ENDOSOME_PH)} cy={getY(endosomeAlpha)} r="4" />
            <text className="hh-val" x={endosomeLabel.x} y={endosomeLabel.y} textAnchor={endosomeLabel.anchor}>
              {endosomeAlpha.toFixed(0)}%
            </text>
          </g>
          <g className="hh-c-blood">
            <circle className="hh-dot" cx={getX(BLOOD_PH)} cy={getY(bloodAlpha)} r="4" />
            <text className="hh-val" x={bloodLabel.x} y={bloodLabel.y} textAnchor={bloodLabel.anchor}>
              {bloodAlpha.toFixed(0)}%
            </text>
          </g>

          {/* Cursor */}
          {hover && (
            <g className="hh-cursor">
              <line x1={hover.x} y1={plotTop} x2={hover.x} y2={plotBottom} />
              <circle cx={hover.x} cy={hover.y} r="4.5" />
            </g>
          )}

          {/* Axis titles */}
          <text className="hh-axis-title" x={plotLeft + plotW / 2} y={height - 4} textAnchor="middle">
            Ambient pH
          </text>
          <text className="hh-axis-title" transform="rotate(-90)" x={-(plotTop + plotH / 2)} y={11} textAnchor="middle">
            Protonated (α)
          </text>
          <text className="hh-axis-title" transform="rotate(90)" x={plotTop + plotH / 2} y={-(plotRight + 38)} textAnchor="middle">
            CPP
          </text>
        </svg>
        <span className="hh-sr" aria-live="polite">
          {hover
            ? `pH ${hover.ph.toFixed(2)}: ${hover.alpha.toFixed(1)}% protonated, CPP ${hover.cpp.toFixed(2)}, ${hover.hii ? 'hexagonal fusion regime' : 'lamellar regime'}.`
            : ''}
        </span>
      </div>
    </figure>
  );
}
