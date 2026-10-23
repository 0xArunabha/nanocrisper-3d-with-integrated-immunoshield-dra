// src/components/LnpFormulationPanel.tsx
import { useId, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Check, Copy } from 'lucide-react';
import {
  DEFAULT_LNP_BENCHMARK,
  LNP_BENCHMARKS,
  LNP_LIMITS,
  balanceCholesterol,
  matchLnpBenchmark,
  setLnpField,
  type EditableLnpField,
  type LnpBenchmark,
  type LnpBiophysicsResult,
  type LnpFormulation,
} from '../engines/bioEngines';
import { tokens } from '../styles/tokens';
import { HendersonHasselbalchCurve } from './HendersonHasselbalchCurve';
import { NudgeSlider, ToolButton } from './ui/controls';
import './LnpFormulationPanel.css';

interface LnpFormulationPanelProps {
  /** Current control values. Cholesterol is derived, so its field here is ignored. */
  form: LnpFormulation;
  onChange: Dispatch<SetStateAction<LnpFormulation>>;
  biophysics: LnpBiophysicsResult;
}

export function LnpFormulationPanel({ form, onChange, biophysics }: LnpFormulationPanelProps) {
  const uid = useId();
  const [copied, setCopied] = useState<boolean>(false);

  const cholesterol = balanceCholesterol(form);
  const total = form.ionizableLipid + form.dspcHelper + cholesterol + form.pegLipid;
  const active = matchLnpBenchmark(form);
  const pigments = tokens.colors.pigments;

  const set = (field: EditableLnpField) => (value: number) =>
    onChange((prev) => setLnpField(prev, field, value));

  const applyBenchmark = (benchmark: LnpBenchmark) => onChange({ ...benchmark.formulation });

  const copyRecipe = () => {
    const recipe = {
      preset: active?.name ?? 'Custom LNP Formulation',
      ionizableLipid_molPct: form.ionizableLipid,
      dspcHelper_molPct: form.dspcHelper,
      cholesterol_molPct: cholesterol,
      pegLipid_molPct: form.pegLipid,
      apparent_pKa: form.lipidPka,
      np_charge_ratio: form.npRatio,
      hydrodynamic_diameter_nm: biophysics.diameterNm,
      pdi: biophysics.pdi,
      zeta_potential_mv: biophysics.zetaPotentialMv,
    };
    navigator.clipboard
      .writeText(JSON.stringify(recipe, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.warn('Failed to copy formulation:', err));
  };

  const L = LNP_LIMITS;
  const barLabel =
    `Molar composition: ionizable lipid ${form.ionizableLipid.toFixed(1)}%, DSPC ${form.dspcHelper.toFixed(1)}%, ` +
    `cholesterol ${cholesterol.toFixed(1)}%, PEG-lipid ${form.pegLipid.toFixed(1)}%`;

  return (
    <section className="lnp" aria-labelledby={`${uid}-title`}>
      <header className="lnp-head">
        <h2 id={`${uid}-title`} className="font-display text-xs font-semibold tracking-tight text-[#e8dfd1]">
          Lipid formulation parameters &amp; organ tropism
        </h2>
        <div className="lnp-actions">
          <ToolButton
            icon={copied ? <Check /> : <Copy />}
            done={copied}
            onClick={copyRecipe}
            title="Copy the formulation, pKa and predicted size as JSON"
          >
            {copied ? 'Copied' : 'Copy recipe'}
          </ToolButton>
          <ToolButton
            onClick={() => applyBenchmark(DEFAULT_LNP_BENCHMARK)}
            title={`Restore the ${DEFAULT_LNP_BENCHMARK.name} benchmark`}
          >
            Reset
          </ToolButton>
        </div>
      </header>

      <div className="lnp-block">
        <div className="lnp-block__head">
          <span className="ctl-label">Benchmark formulations</span>
          <span className="lnp-note">{active ? `Matches ${active.name}` : 'Custom formulation'}</span>
        </div>
        <div className="lnp-bench" role="group" aria-label="Benchmark formulations">
          {LNP_BENCHMARKS.map((benchmark) => (
            <button
              key={benchmark.id}
              type="button"
              className="lnp-card"
              aria-pressed={active?.id === benchmark.id}
              onClick={() => applyBenchmark(benchmark)}
            >
              <span className="lnp-card__name">{benchmark.name}</span>
              <span className="lnp-card__lipid">{benchmark.lipid}</span>
              <span className="lnp-card__target">
                <span>{benchmark.target}</span>
                <span>{benchmark.organ}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="lnp-block">
        <div className="lnp-block__head">
          <span className="ctl-label">Composition</span>
          <span className="lnp-note">Σ {total.toFixed(1)} mol%</span>
        </div>

        <div className="lnp-bar" role="img" aria-label={barLabel}>
          <i style={{ flexGrow: form.ionizableLipid, backgroundColor: pigments.ochre }} title={`Ionizable lipid ${form.ionizableLipid.toFixed(1)} mol%`} />
          <i style={{ flexGrow: form.dspcHelper, backgroundColor: pigments.ivory }} title={`DSPC ${form.dspcHelper.toFixed(1)} mol%`} />
          <i style={{ flexGrow: cholesterol, backgroundColor: pigments.terracotta }} title={`Cholesterol ${cholesterol.toFixed(1)} mol%`} />
          <i style={{ flexGrow: form.pegLipid, backgroundColor: pigments.petrol }} title={`PEG-lipid ${form.pegLipid.toFixed(1)} mol%`} />
        </div>

        <div className="lnp-sliders">
          <NudgeSlider
            id={`${uid}-ion`}
            label="Ionizable lipid"
            swatch={pigments.ochre}
            value={form.ionizableLipid}
            {...L.ionizableLipid}
            valueText={`${form.ionizableLipid.toFixed(1)} mol%`}
            unit="mol%"
            onChange={set('ionizableLipid')}
          />
          <NudgeSlider
            id={`${uid}-dspc`}
            label="Helper lipid (DSPC)"
            swatch={pigments.ivory}
            value={form.dspcHelper}
            {...L.dspcHelper}
            valueText={`${form.dspcHelper.toFixed(1)} mol%`}
            unit="mol%"
            onChange={set('dspcHelper')}
          />
          <NudgeSlider
            id={`${uid}-peg`}
            label="PEG-lipid"
            swatch={pigments.petrol}
            value={form.pegLipid}
            {...L.pegLipid}
            valueText={`${form.pegLipid.toFixed(1)} mol%`}
            unit="mol%"
            onChange={set('pegLipid')}
          />
          <div className="ctl-slider">
            <div className="ctl-slider__head">
              <span className="ctl-slider__label">
                <i className="ctl-swatch" style={{ backgroundColor: pigments.terracotta }} aria-hidden="true" />
                Cholesterol (balance)
              </span>
              <output className="ctl-slider__value">{cholesterol.toFixed(1)} mol%</output>
            </div>
            <div className="lnp-balance">
              <div
                className="lnp-balance__track"
                role="meter"
                aria-label="Cholesterol share of the composition, set by the other three lipids"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={cholesterol}
              >
                <i style={{ width: `${cholesterol}%`, backgroundColor: pigments.terracotta }} />
              </div>
              <span className="lnp-note">100 − the other three</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lnp-block">
        <div className="lnp-block__head">
          <span className="ctl-label">Assembly</span>
        </div>
        <div className="lnp-sliders">
          <NudgeSlider
            id={`${uid}-pka`}
            label="Apparent pKa"
            value={form.lipidPka}
            {...L.lipidPka}
            valueText={form.lipidPka.toFixed(2)}
            onChange={set('lipidPka')}
          />
          <NudgeSlider
            id={`${uid}-np`}
            label="N/P charge ratio"
            value={form.npRatio}
            {...L.npRatio}
            valueText={`${form.npRatio.toFixed(1)}:1`}
            onChange={set('npRatio')}
          />
        </div>
      </div>

      <HendersonHasselbalchCurve lipidPka={form.lipidPka} />
    </section>
  );
}
