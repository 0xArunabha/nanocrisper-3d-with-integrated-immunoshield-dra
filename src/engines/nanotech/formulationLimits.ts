// src/engines/nanotech/formulationLimits.ts
import type { LnpFormulation } from '../types';

/**
 * Editable range of every formulation field. The sliders, the +/- nudge buttons and the
 * URL / localStorage restore all read this table, so they cannot disagree about what is allowed.
 *
 * `step` is the slider's resolution and is fine enough to land exactly on every benchmark formulation
 * (Comirnaty is 46.3 / 9.4 mol% and Onpattro has pKa 6.44, none of which fit a coarser grid).
 * `nudge` is what one click on the - / + buttons moves.
 */
export const LNP_LIMITS = {
  ionizableLipid: { min: 35, max: 65, step: 0.1, nudge: 0.5, decimals: 1 },
  dspcHelper: { min: 5, max: 20, step: 0.1, nudge: 0.5, decimals: 1 },
  pegLipid: { min: 0.3, max: 6, step: 0.1, nudge: 0.1, decimals: 1 },
  lipidPka: { min: 5.4, max: 7.4, step: 0.01, nudge: 0.05, decimals: 2 },
  npRatio: { min: 3, max: 10, step: 0.5, nudge: 0.5, decimals: 1 },
} as const;

export type EditableLnpField = keyof typeof LNP_LIMITS;

/**
 * Ionizable lipid + DSPC + PEG-lipid may not exceed this. Cholesterol is not a free control:
 * it takes whatever is left of 100 mol%, so it can never fall below 100 - 95 = 5 mol%.
 */
export const MAX_NON_STEROL_MOL_PCT = 95;

type Composition = Pick<LnpFormulation, 'ionizableLipid' | 'dspcHelper' | 'pegLipid'>;

const COMPOSITION_FIELDS = ['ionizableLipid', 'dspcHelper', 'pegLipid'] as const;
type CompositionField = (typeof COMPOSITION_FIELDS)[number];

const isCompositionField = (field: EditableLnpField): field is CompositionField =>
  (COMPOSITION_FIELDS as readonly string[]).includes(field);

const round = (value: number, decimals: number): number => Number(value.toFixed(decimals));

/** Cholesterol mol% implied by the other three lipids. */
export function balanceCholesterol(form: Composition): number {
  return Math.max(
    100 - MAX_NON_STEROL_MOL_PCT,
    round(100 - form.ionizableLipid - form.dspcHelper - form.pegLipid, 1)
  );
}

/**
 * Returns a copy of `form` with one field set to `value`.
 * The value is clamped to the field's own range and, for the three lipid fractions, to the
 * 95 mol% cap shared with the other two. Rounding removes floating-point noise such as
 * 0.7 + 0.1 = 0.7999999999999999 before it reaches state or the URL.
 * Non-finite input leaves the form unchanged. Cholesterol is always re-balanced.
 */
export function setLnpField(
  form: LnpFormulation,
  field: EditableLnpField,
  value: number
): LnpFormulation {
  if (!Number.isFinite(value)) return form;

  const { min, max, decimals } = LNP_LIMITS[field];
  let next = Math.min(max, Math.max(min, value));

  if (isCompositionField(field)) {
    const others = COMPOSITION_FIELDS.filter((f) => f !== field).reduce((sum, f) => sum + form[f], 0);
    next = Math.max(min, Math.min(next, MAX_NON_STEROL_MOL_PCT - others));
  }

  const updated: LnpFormulation = { ...form, [field]: round(next, decimals) };
  return { ...updated, cholesterol: balanceCholesterol(updated) };
}

/**
 * Builds a valid formulation from untrusted input (a shared link, localStorage).
 * Missing, non-numeric or out-of-range values fall back to, or are clamped against, `base`.
 */
export function sanitizeLnpFormulation(
  raw: Partial<Record<EditableLnpField, unknown>>,
  base: LnpFormulation
): LnpFormulation {
  let form: LnpFormulation = { ...base, cholesterol: balanceCholesterol(base) };
  for (const field of Object.keys(LNP_LIMITS) as EditableLnpField[]) {
    const value = raw[field];
    if (typeof value === 'number') form = setLnpField(form, field, value);
  }
  return form;
}
