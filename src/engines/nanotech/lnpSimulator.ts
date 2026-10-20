// src/engines/nanotech/lnpSimulator.ts
import type { LnpFormulation, LnpBiophysicsResult } from '../types';

export interface AmbientLnpTelemetry {
  floryRadiusNm: number;
  graftingDistanceNm: string;
  deGennesRatio: number;
  liveIonizationPct: number;
  liveProtonationFraction: number;
  cpp: number;
  stokesDiffusivity: number;
  saxsSpacing: number;
  phaseState: 'Inverted Hexagonal (HII Fusion)' | 'Lamellar / Micellar (Lα)';
}

/**
 * Computes real-time ambient pH titration & polymer scaling telemetry for the 3D viewport HUD.
 * Keeps all Henderson-Hasselbalch, De Gennes, Israelachvili CPP, and Stokes-Einstein math
 * strictly inside the nanotech engine layer.
 */
export function calculateAmbientLnpTelemetry(
  form: LnpFormulation,
  biophysics: LnpBiophysicsResult,
  ambientPh: number
): AmbientLnpTelemetry {
  // Flory radius of PEG-2000 (N ~ 45 monomers, monomer length a ~ 0.35 nm): R_F = a * N^(3/5) ~ 3.43 nm
  const floryRadiusNm = 3.43;
  const pegMolFraction = Math.max(0.002, form.pegLipid / 100);
  const graftingDistanceVal = Math.sqrt(0.65 / pegMolFraction);
  const deGennesRatio =
    biophysics.deGennesRfOverD ?? Number((floryRadiusNm / graftingDistanceVal).toFixed(2));

  // Live Henderson-Hasselbalch ionization at user-selected ambient pH
  const liveProtonationFraction = 1 / (1 + Math.pow(10, ambientPh - form.lipidPka));
  const liveIonizationPct = Math.round(liveProtonationFraction * 100);

  // Israelachvili Critical Packing Parameter (CPP = v / (a0 * lc))
  const cpp = Number((1.08 + (liveIonizationPct / 100) * 0.58).toFixed(2));

  // Stokes-Einstein diffusivity in blood at 37°C (D0 = kB*T / (3*pi*eta*Dh))
  const stokesDiffusivity = Number((458 / Math.max(1, biophysics.diameterNm)).toFixed(1));
  const saxsSpacing = biophysics.saxsBraggSpacingNm ?? 6.1;

  return {
    floryRadiusNm,
    graftingDistanceNm: graftingDistanceVal.toFixed(1),
    deGennesRatio,
    liveIonizationPct,
    liveProtonationFraction,
    cpp,
    stokesDiffusivity,
    saxsSpacing,
    phaseState: cpp >= 1.45 ? 'Inverted Hexagonal (HII Fusion)' : 'Lamellar / Micellar (Lα)',
  };
}

/**
 * Nanotech LNP Biophysical & CMC Simulation Engine.
 * Models 4-component lipid nanoparticle assembly, Henderson-Hasselbalch ionization,
 * De Gennes polymer brush scaling, Israelachvili Critical Packing Parameter (CPP),
 * SAXS Bragg repeat distance, and SORT organ biodistribution.
 */
export function simulateLnpBiophysics(form: LnpFormulation): LnpBiophysicsResult {
  const rawTotal = form.ionizableLipid + form.dspcHelper + form.cholesterol + form.pegLipid;
  const total = rawTotal > 0 ? rawTotal : 100;

  const normDspc = (form.dspcHelper / total) * 100;
  const normChol = (form.cholesterol / total) * 100;
  const normPeg = Math.max(0.1, (form.pegLipid / total) * 100);

  // 1. Hydrodynamic diameter (Dh in nm): Higher PEG-lipid increases surface curvature -> smaller particle
  const rawDiameter =
    135 -
    24 * Math.log(Math.max(0.3, normPeg * 2.2)) +
    (6 - form.npRatio) * 3.5 +
    (normDspc - 10) * 0.45;
  const diameterNm = Math.round(Math.max(42, Math.min(210, rawDiameter)));

  // 2. Polydispersity Index (PDI)
  const cholDeviation = Math.abs(normChol - 38.5) * 0.004;
  const dspcDeviation = Math.abs(normDspc - 10.0) * 0.0025;
  const lowPegPenalty = normPeg < 1.0 ? 0.12 : 0;
  const pdi = Number(Math.min(0.45, 0.06 + cholDeviation + dspcDeviation + lowPegPenalty).toFixed(2));

  // 3. Henderson-Hasselbalch Ionization: % = 100 / (1 + 10^(pH - pKa))
  const endosomalProtonationPct = Math.round(100 / (1 + Math.pow(10, 5.5 - form.lipidPka)));
  const bloodProtonationPct = Math.round(100 / (1 + Math.pow(10, 7.4 - form.lipidPka)));

  // 4. Zeta Potential at physiological pH 7.4 (mV)
  const zetaPotentialMv = Number(((bloodProtonationPct * 0.35) - (normPeg * 2.1)).toFixed(1));

  // 5. The "PEG Dilemma" & Cellular Uptake
  const pegPenalty = normPeg > 2.2 ? Math.max(10, 100 - Math.pow(normPeg - 2.0, 1.8) * 18) : 95;
  const cellularUptakeScore = Math.round(Math.min(98, Math.max(8, pegPenalty)));

  // 6. Endosomal Escape combines protonation at pH 5.5 + pKa sweet spot + low PEG barrier
  const pkaSweetSpotBonus = Math.max(0, 100 - Math.abs(form.lipidPka - 6.35) * 55);
  const endosomalEscapeEfficiency = Math.round(
    Math.min(
      99,
      Math.max(5, endosomalProtonationPct * 0.4 + pkaSweetSpotBonus * 0.35 + cellularUptakeScore * 0.25)
    )
  );

  // 7. Organ Tropism (SORT - Selective Organ Targeting model with strict non-negative conservation)
  let liver = 78;
  let spleen = 15;
  let lungs = 7;

  if (form.lipidPka > 6.7 || zetaPotentialMv > 8) {
    const pkaShift = Math.max(0, (form.lipidPka - 6.5) * 45);
    const zetaShift = Math.max(0, (zetaPotentialMv - 5) * 2.2);
    lungs = Math.min(68, Math.max(12, Math.round(15 + pkaShift + zetaShift)));
    liver = Math.max(20, 78 - lungs);
    spleen = Math.max(4, 100 - liver - lungs);
    liver = 100 - lungs - spleen;
  } else if (form.lipidPka < 6.0 || zetaPotentialMv < -5) {
    const pkaShift = Math.max(0, (6.2 - form.lipidPka) * 50);
    const anionicShift = Math.max(0, (-4 - zetaPotentialMv) * 3.5);
    spleen = Math.min(62, Math.max(18, Math.round(20 + pkaShift + anionicShift)));
    liver = Math.max(25, 82 - spleen);
    lungs = Math.max(4, 100 - liver - spleen);
    liver = 100 - spleen - lungs;
  }

  let stabilityStatus: LnpBiophysicsResult['stabilityStatus'] = 'Optimal Clinical LNP';
  if (normPeg > 3.2) {
    stabilityStatus = 'PEG Stealth Dilemma (Low Uptake)';
  } else if (diameterNm > 140 || normPeg < 0.8) {
    stabilityStatus = 'Aggregation Risk (Too Large)';
  } else if (endosomalEscapeEfficiency < 58) {
    stabilityStatus = 'Poor Endosomal Escape';
  }

  // De Gennes PEG2000 Brush Ratio: R_F (3.43 nm) / D (sqrt(0.65 / X_peg))
  const pegMolFraction = Math.max(0.002, normPeg / 100);
  const graftingDist = Math.sqrt(0.65 / pegMolFraction);
  const deGennesRfOverD = Number((3.43 / graftingDist).toFixed(2));

  // Israelachvili Critical Packing Parameter (CPP) in late endosome (pH 5.5)
  const criticalPackingParam = Number((1.08 + (endosomalProtonationPct / 100) * 0.58).toFixed(2));

  // SAXS q_1 Bragg Peak Repeat Spacing (nm)
  const saxsBraggSpacingNm = Number((6.45 - (form.npRatio - 3) * 0.08).toFixed(2));

  return {
    diameterNm,
    pdi,
    zetaPotentialMv,
    endosomalProtonationPct,
    bloodProtonationPct,
    endosomalEscapeEfficiency,
    cellularUptakeScore,
    deGennesRfOverD,
    criticalPackingParam,
    saxsBraggSpacingNm,
    organTropism: { liver, spleen, lungs },
    stabilityStatus
  };
}
