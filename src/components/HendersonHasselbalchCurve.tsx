// src/components/HendersonHasselbalchCurve.tsx
import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import './HendersonHasselbalchCurve.css';

/**
 * Interactive Henderson-Hasselbalch ionization curve with the H_II phase boundary.
 * Plots % protonation from pH 4.5 to 8.0 and marks the late endosome (pH 5.5), the apparent pKa
 * (50 %), systemic blood (pH 7.4) and the CPP >= 1.45 line where lamellar (L_alpha) packing gives
 * way to inverted hexagonal (H_II) fusion. Hover the plot to read any pH.
 *
 * The plot only draws markers and ticks. Everything that needs words (landmarks, the two phase
 * regimes) sits in a legend above it, so labels can never collide with the curve or get clipped.
 * The SVG is drawn at its real pixel width, so tick labels stay 10 px on any screen.
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

// Pigments used for the same landmark in the plot and in the legend.
const COLOR = {
  endosome: '#5e946c',
  pka: '#cfa052',
  blood: '#4d828f',
  hii: '#b85b46',
  lamellar: '#a69b8d',
};

// Plot size in CSS pixels. The height follows the width, within limits.
const DEFAULT_WIDTH = 520;
const MIN_WIDTH = 240;
const ASPECT = 0.36;
const MIN_HEIGHT = 150;
const MAX_HEIGHT = 240;
const PAD = { top: 14, right: 18, bottom: 32, left: 42 };

const getCpp = (alphaPct: number) => Number((CPP_BASE + (alphaPct / 100) * CPP_SLOPE).toFixed(2));

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

  const height = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, width * ASPECT)));
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const yBottom = height - PAD.bottom;

  const getX = (ph: number) => PAD.left + ((ph - PH_MIN) / (PH_MAX - PH_MIN)) * plotW;
  const getY = (alphaPct: number) => PAD.top + (1 - alphaPct / 100) * plotH;
  // Henderson-Hasselbalch: % protonated = 100 / (1 + 10^(pH - pKa))
  const getAlpha = (ph: number) => 100 / (1 + Math.pow(10, ph - lipidPka));

  const yHii = getY(HII_ALPHA_PCT);

  const steps = 80;
  const curve: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const ph = PH_MIN + (i / steps) * (PH_MAX - PH_MIN);
    curve.push([getX(ph), getY(getAlpha(ph))]);
  }
  const linePath = curve.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${getX(PH_MAX).toFixed(1)} ${getY(0).toFixed(1)} L ${getX(PH_MIN).toFixed(1)} ${getY(0).toFixed(1)} Z`;

  const endosomeAlpha = getAlpha(ENDOSOME_PH);
  const bloodAlpha = getAlpha(BLOOD_PH);

  const hover =
    hoveredPh === null
      ? null
      : (() => {
          const alpha = getAlpha(hoveredPh);
          const cpp = getCpp(alpha);
          return { ph: hoveredPh, alpha, cpp, x: getX(hoveredPh), y: getY(alpha), hii: cpp >= HII_CPP_THRESHOLD };
        })();

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(PAD.left, Math.min(width - PAD.right, ((event.clientX - rect.left) / rect.width) * width));
    setHoveredPh(Number((PH_MIN + ((x - PAD.left) / plotW) * (PH_MAX - PH_MIN)).toFixed(2)));
  };

  // The readout is centred on the cursor, but shifted so it never leaves the plot (it is about 270 px wide).
  const tipHalf = Math.min(136, (width - 8) / 2);
  const tipLeft = hover ? Math.min(width - tipHalf - 4, Math.max(tipHalf + 4, hover.x)) : 0;

  return (
    <figure className="hh">
      <figcaption className="hh-head">
        <span className="hh-title">
          Ionization and H<sub>II</sub> phase transition
        </span>
        <span className="hh-eq">
          pK<sub>a</sub> {lipidPka.toFixed(2)} • CPP = 1.08 + 0.58·α
        </span>
      </figcaption>

      <ul className="hh-legend" aria-label="Plot legend">
        <li>
          <i style={{ backgroundColor: COLOR.blood }} />
          <span>Blood, pH 7.4</span>
          <b>{bloodAlpha.toFixed(0)}%</b>
        </li>
        <li>
          <i style={{ backgroundColor: COLOR.pka }} />
          <span>
            pK<sub>a</sub> {lipidPka.toFixed(2)}
          </span>
          <b>50%</b>
        </li>
        <li>
          <i style={{ backgroundColor: COLOR.endosome }} />
          <span>Late endosome, pH 5.5</span>
          <b>{endosomeAlpha.toFixed(0)}%</b>
        </li>
        <li>
          <i className="hh-legend__band" style={{ backgroundColor: COLOR.hii }} />
          <span>
            H<sub>II</sub> fusion: CPP ≥ {HII_CPP_THRESHOLD} (α ≥ {Math.round(HII_ALPHA_PCT)}%)
          </span>
        </li>
        <li>
          <i className="hh-legend__band" style={{ backgroundColor: COLOR.lamellar }} />
          <span>
            L<sub>α</sub> lamellar: CPP &lt; {HII_CPP_THRESHOLD}
          </span>
        </li>
      </ul>

      <div className="hh-plot" ref={plotRef}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="hh-svg"
          role="img"
          aria-label={`Protonation against pH for an ionizable lipid with pKa ${lipidPka.toFixed(2)}. ${endosomeAlpha.toFixed(0)}% protonated at pH 5.5, ${bloodAlpha.toFixed(0)}% at pH 7.4.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoveredPh(null)}
        >
          <defs>
            <linearGradient id="hhFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR.blood} stopOpacity="0.32" />
              <stop offset="70%" stopColor={COLOR.blood} stopOpacity="0.08" />
              <stop offset="100%" stopColor={COLOR.blood} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hhStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={COLOR.endosome} />
              <stop offset="45%" stopColor={COLOR.pka} />
              <stop offset="85%" stopColor={COLOR.blood} />
            </linearGradient>
          </defs>

          {/* H_II regime: CPP >= 1.45 */}
          <rect x={PAD.left} y={PAD.top} width={plotW} height={Math.max(0, yHii - PAD.top)} fill={COLOR.hii} fillOpacity="0.08" />
          <line
            x1={PAD.left}
            y1={yHii}
            x2={width - PAD.right}
            y2={yHii}
            stroke={COLOR.hii}
            strokeDasharray="4 3"
            strokeOpacity="0.75"
          />

          {/* % protonation grid */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD.left}
                y1={getY(pct)}
                x2={width - PAD.right}
                y2={getY(pct)}
                stroke="#24201b"
                strokeDasharray={pct === 50 ? '3 3' : undefined}
              />
              <text x={PAD.left - 6} y={getY(pct) + 3.5} textAnchor="end" fontSize="10" fontFamily="monospace" fill="#a69b8d">
                {pct}%
              </text>
            </g>
          ))}

          {/* pH grid */}
          {PH_TICKS.map((ph) => {
            const landmark = ph === ENDOSOME_PH;
            return (
              <g key={ph}>
                <line
                  x1={getX(ph)}
                  y1={PAD.top}
                  x2={getX(ph)}
                  y2={yBottom}
                  stroke="#24201b"
                  strokeDasharray={landmark ? '2 2' : undefined}
                />
                <text
                  x={getX(ph)}
                  y={yBottom + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={landmark ? '#e8dfd1' : '#a69b8d'}
                  fontWeight={landmark ? 'bold' : 'normal'}
                >
                  {ph.toFixed(1)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#hhFill)" />
          <path d={linePath} fill="none" stroke="url(#hhStroke)" strokeWidth="2" strokeLinecap="round" />

          {/* Landmarks: late endosome, pKa, blood */}
          <line x1={getX(ENDOSOME_PH)} y1={getY(endosomeAlpha)} x2={getX(ENDOSOME_PH)} y2={yBottom} stroke={COLOR.endosome} strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx={getX(ENDOSOME_PH)} cy={getY(endosomeAlpha)} r="4" fill={COLOR.endosome} stroke="#181613" strokeWidth="1.5" />

          <line x1={getX(lipidPka)} y1={getY(50)} x2={getX(lipidPka)} y2={yBottom} stroke={COLOR.pka} strokeDasharray="2 2" />
          <line x1={PAD.left} y1={getY(50)} x2={getX(lipidPka)} y2={getY(50)} stroke={COLOR.pka} strokeDasharray="2 2" />
          <circle cx={getX(lipidPka)} cy={getY(50)} r="3.5" fill={COLOR.pka} stroke="#181613" strokeWidth="1.5" />

          <line x1={getX(BLOOD_PH)} y1={getY(bloodAlpha)} x2={getX(BLOOD_PH)} y2={yBottom} stroke={COLOR.blood} strokeWidth="1.2" strokeDasharray="3 2" />
          <circle cx={getX(BLOOD_PH)} cy={getY(bloodAlpha)} r="4" fill={COLOR.blood} stroke="#181613" strokeWidth="1.5" />

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={yBottom} stroke="#e8dfd1" strokeDasharray="2 2" strokeOpacity="0.8" />
              <circle cx={hover.x} cy={hover.y} r="4.5" fill="#e8dfd1" stroke="#12110f" strokeWidth="2" />
            </g>
          )}

          <text x={PAD.left + plotW / 2} y={height - 3} textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#a69b8d">
            Ambient pH
          </text>
          <text
            transform="rotate(-90)"
            x={-(PAD.top + plotH / 2)}
            y={11}
            textAnchor="middle"
            fontSize="10"
            fontFamily="sans-serif"
            fill="#a69b8d"
          >
            Protonated (α)
          </text>
        </svg>

        {hover && (
          <div className="hh-tip" style={{ left: tipLeft }}>
            <b>pH {hover.ph.toFixed(2)}</b>
            <span>{hover.alpha.toFixed(1)}% ionized</span>
            <span>CPP {hover.cpp}</span>
            <span className={hover.hii ? 'hh-tip__hii' : undefined}>{hover.hii ? 'HII fusion' : 'Lα phase'}</span>
          </div>
        )}
      </div>
    </figure>
  );
}
