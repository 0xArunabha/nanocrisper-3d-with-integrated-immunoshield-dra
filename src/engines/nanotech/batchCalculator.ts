// src/engines/nanotech/batchCalculator.ts
import type { LnpFormulation, BatchMassCalculation } from '../types';

/**
 * Wet-lab mass & batch preparation calculator for microfluidic hydrodynamic focusing.
 * Translates target mRNA concentration and N/P charge ratio into exact milligram quantities
 * and millimolar concentrations for organic ethanol and aqueous phases.
 */
export function calculateBatchMasses(
  form: LnpFormulation,
  targetVolumeMl: number = 10,
  mrnaConcMgMl: number = 1.0
): BatchMassCalculation {
  const safeVolumeMl = Math.max(0.1, targetVolumeMl);
  const safeMrnaConc = Math.max(0.01, mrnaConcMgMl);
  const safeIonizablePct = Math.max(1.0, form.ionizableLipid);

  const totalMrnaMassMg = Number((safeVolumeMl * safeMrnaConc).toFixed(2));
  // Moles of phosphate (avg nucleotide MW in mRNA is ~330 g/mol)
  const mmolesPhosphate = totalMrnaMassMg / 330;
  // Required moles of ionizable nitrogen based on N/P ratio
  const mmolesIonizable = mmolesPhosphate * form.npRatio;
  const totalLipidMmoles = mmolesIonizable / (safeIonizablePct / 100);

  const MW_IONIZABLE = 710.2;
  const MW_DSPC = 790.15;
  const MW_CHOL = 386.65;
  const MW_PEG = 2509.2; // DMG-PEG2000

  const mmolesDspc = totalLipidMmoles * (form.dspcHelper / 100);
  const mmolesChol = totalLipidMmoles * (form.cholesterol / 100);
  const mmolesPeg = totalLipidMmoles * (form.pegLipid / 100);

  const massIonizable = Number((mmolesIonizable * MW_IONIZABLE).toFixed(2));
  const massDspc = Number((mmolesDspc * MW_DSPC).toFixed(2));
  const massChol = Number((mmolesChol * MW_CHOL).toFixed(2));
  const massPeg = Number((mmolesPeg * MW_PEG).toFixed(2));
  const totalLipidMassMg = Number((massIonizable + massDspc + massChol + massPeg).toFixed(2));

  const volLiters = safeVolumeMl / 1000;

  return {
    targetVolumeMl: safeVolumeMl,
    mrnaConcMgMl: safeMrnaConc,
    totalMrnaMassMg,
    totalLipidMassMg,
    components: [
      {
        name: 'Ionizable Lipid (SM-102 proxy)',
        role: 'mRNA complexation & endosomal escape',
        molarPct: form.ionizableLipid,
        mw: MW_IONIZABLE,
        massMg: massIonizable,
        molarConcMm: Number((mmolesIonizable / volLiters).toFixed(2))
      },
      {
        name: 'DSPC (Helper Lipid)',
        role: 'Bilayer structural support',
        molarPct: form.dspcHelper,
        mw: MW_DSPC,
        massMg: massDspc,
        molarConcMm: Number((mmolesDspc / volLiters).toFixed(2))
      },
      {
        name: 'Cholesterol',
        role: 'Membrane fluidity & particle rigidity',
        molarPct: form.cholesterol,
        mw: MW_CHOL,
        massMg: massChol,
        molarConcMm: Number((mmolesChol / volLiters).toFixed(2))
      },
      {
        name: 'DMG-PEG2000 (Stealth Lipid)',
        role: 'Colloidal stability & steric hindrance',
        molarPct: form.pegLipid,
        mw: MW_PEG,
        massMg: massPeg,
        molarConcMm: Number((mmolesPeg / volLiters).toFixed(2))
      }
    ]
  };
}
