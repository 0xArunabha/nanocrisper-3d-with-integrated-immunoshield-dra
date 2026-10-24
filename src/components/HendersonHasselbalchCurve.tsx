// src/components/HendersonHasselbalchCurve.tsx
import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import './HendersonHasselbalchCurve.css';

/**
 * Interactive Henderson-Hasselbalch ionization curve with the H_II phase boundary.
 * Rendered in Vintage Tektronix oscilloscope graticule aesthetic.
 */
const CPP_BASE = 1.08;
const CPP_SLOPE = 0.58;
const HII_CPP_THRESHOLD = 1.45;
/** Protonation (%) at which CPP reaches the H_II threshold (~63.8%). */
const HII_ALPHA_PCT = ((HII_CPP_THRESHOLD - CPP_BASE) / CPP_SLOPE) * 100;

const PH_MIN = 4.5;
const PH_MAX = 8.0;
const ENDOSOME_PH = 5.5;
const BLOOD_PH = 7.4;
const PH_TICKS = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

// Tektronix & Braun Clinical Color Channels
const COLOR = {
  endosome: '#38D399',  // Phosphor Green (Late endosome pH 5.5 / HII escape)
  pka: '#38BDF8',       // Optical Cyan (pKa intersection)
  blood: '#98A1A6',     // Archival Steel
  curve: '#F5A623',     // Tektronix Amber CRT
  hiiFill: 'rgba(56, 211, 153, 0.08)',
  grid: '#1C2226',      // Graticule gridline
};

// Plot size in CSS pixels
const DEFAULT_WIDTH = 520;
const MIN_WIDTH = 240;
const ASPECT = 0.28;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 175;
const PAD = { top: 12, right: 18, bottom: 28, left: 38 };

const getCpp = (alphaPct: number) => Number((CPP_BASE + (alphaPct / 100) * CPP_SLOPE).toFixed(2));

export function HendersonHasselbalchCurve({ lipidPka }: { lipidPka: number }) {
  const [hoveredPh, setHoveredPh] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
  const plotRef = useRef<HTMLDivElement>(null);

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
          <i className="hh-legend__band" style={{ backgroundColor: COLOR.endosome }} />
          <span>
            H<sub>II</sub> fusion: CPP ≥ {HII_CPP_THRESHOLD} (α ≥ {Math.round(HII_ALPHA_PCT)}%)
          </span>
        </li>
      </ul>

      <div className="hh-plot viewport-recessed" ref={plotRef}>
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
            <linearGradient id="hhAmberArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#F5A623" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#F5A623" stopOpacity="0.0" />
            </linearGradient>
            <filter id="amberGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#F5A623" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* H_II Endosomal Escape Zone: CPP >= 1.45 (between pH 5.5 and ~6.35) */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={Math.max(0, yHii - PAD.top)}
            fill={COLOR.hiiFill}
          />
          <line
            x1={PAD.left}
            y1={yHii}
            x2={width - PAD.right}
            y2={yHii}
            stroke={COLOR.endosome}
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />
          <text
            x={width - PAD.right - 4}
            y={yHii - 4}
            textAnchor="end"
            fontSize="9"
            fontFamily="monospace"
            fill={COLOR.endosome}
            opacity="0.9"
          >
            HII Fusion Threshold (CPP ≥ 1.45)
          </text>

          {/* % protonation graticule */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <g key={pct}>
              <line
                x1={PAD.left}
                y1={getY(pct)}
                x2={width - PAD.right}
                y2={getY(pct)}
                stroke={COLOR.grid}
                strokeDasharray={pct === 50 ? '3 3' : undefined}
              />
              <text x={PAD.left - 6} y={getY(pct) + 3.5} textAnchor="end" fontSize="10" fontFamily="monospace" fill="#98A1A6">
                {pct}%
              </text>
            </g>
          ))}

          {/* pH graticule */}
          {PH_TICKS.map((ph) => {
            const landmark = ph === ENDOSOME_PH;
            return (
              <g key={ph}>
                <line
                  x1={getX(ph)}
                  y1={PAD.top}
                  x2={getX(ph)}
                  y2={yBottom}
                  stroke={COLOR.grid}
                  strokeDasharray={landmark ? '2 2' : undefined}
                />
                <text
                  x={getX(ph)}
                  y={yBottom + 14}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={landmark ? '#EAE6DF' : '#98A1A6'}
                  fontWeight={landmark ? 'bold' : 'normal'}
                >
                  {ph.toFixed(1)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#hhAmberArea)" />
          {/* Tektronix Amber Protonation Curve */}
          <path d={linePath} fill="none" stroke={COLOR.curve} strokeWidth="2" strokeLinecap="round" filter="url(#amberGlow)" />

          {/* Callout Lines: Late Endosome pH 5.5 (88%) */}
          <line
            x1={getX(ENDOSOME_PH)}
            y1={getY(endosomeAlpha)}
            x2={getX(ENDOSOME_PH)}
            y2={yBottom}
            stroke={COLOR.endosome}
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <circle cx={getX(ENDOSOME_PH)} cy={getY(endosomeAlpha)} r="4.5" fill={COLOR.endosome} stroke="#0A0C0E" strokeWidth="1.5" />

          {/* Callout Lines: pKa (50%) */}
          <line
            x1={getX(lipidPka)}
            y1={getY(50)}
            x2={getX(lipidPka)}
            y2={yBottom}
            stroke={COLOR.pka}
            strokeDasharray="2 2"
          />
          <line
            x1={PAD.left}
            y1={getY(50)}
            x2={getX(lipidPka)}
            y2={getY(50)}
            stroke={COLOR.pka}
            strokeDasharray="2 2"
          />
          <circle cx={getX(lipidPka)} cy={getY(50)} r="4" fill={COLOR.pka} stroke="#0A0C0E" strokeWidth="1.5" />

          {/* Callout Lines: Blood pH 7.4 (8%) */}
          <line
            x1={getX(BLOOD_PH)}
            y1={getY(bloodAlpha)}
            x2={getX(BLOOD_PH)}
            y2={yBottom}
            stroke={COLOR.blood}
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <circle cx={getX(BLOOD_PH)} cy={getY(bloodAlpha)} r="4" fill={COLOR.blood} stroke="#0A0C0E" strokeWidth="1.5" />

          {/* Hover crosshair */}
          {hover && (
            <g>
              <line x1={hover.x} y1={PAD.top} x2={hover.x} y2={yBottom} stroke="#EAE6DF" strokeDasharray="2 2" strokeOpacity="0.8" />
              <circle cx={hover.x} cy={hover.y} r="5" fill="#EAE6DF" stroke="#0A0C0E" strokeWidth="2" />
            </g>
          )}

          <text x={PAD.left + plotW / 2} y={height - 3} textAnchor="middle" fontSize="10" fontFamily="sans-serif" fill="#98A1A6">
            Ambient pH
          </text>
          <text
            transform="rotate(-90)"
            x={-(PAD.top + plotH / 2)}
            y={11}
            textAnchor="middle"
            fontSize="10"
            fontFamily="sans-serif"
            fill="#98A1A6"
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
