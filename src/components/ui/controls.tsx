// src/components/ui/controls.tsx
// Small shared controls for the instrument-style panels. Styles live in controls.css.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './controls.css';

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export interface ToolButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon?: ReactNode;
  /** Makes the button a toggle. Leave undefined for a plain action. */
  pressed?: boolean;
  /** Brief confirmation state after a copy or export. */
  done?: boolean;
}

/** 24 px button. With no children it is icon-only, so pass `aria-label` and `title`. */
export function ToolButton({ icon, pressed, done, className, children, ...rest }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={cx('ctl-btn', !children && 'ctl-btn--icon', className)}
      aria-pressed={pressed}
      data-done={done ? '' : undefined}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** The buttons trigger actions (camera views) rather than choose a state, so none is drawn as selected. */
  momentary?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  momentary,
  className,
  'aria-label': ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div className={cx('ctl-seg viewport-control-group', className)} role={ariaLabel ? 'group' : undefined} aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = !momentary && option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className="ctl-seg__btn viewport-control-btn"
            title={option.title}
            aria-pressed={momentary ? undefined : isActive}
            data-active={isActive ? 'true' : 'false'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** A control with a small upper-case label above it. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('ctl-field', className)} role="group" aria-label={label}>
      <span className="ctl-label" aria-hidden="true">
        {label}
      </span>
      {children}
    </div>
  );
}

export interface NudgeSliderProps {
  id: string;
  label: string;
  /** Colour key shown before the label, matching the segment of the composition bar it controls. */
  swatch?: string;
  value: number;
  min: number;
  max: number;
  /** Resolution of the slider itself. */
  step: number;
  /** What one click on - / + moves. Defaults to `step`. */
  nudge?: number;
  /** What the value reads as, e.g. "50.0 mol%". */
  valueText: string;
  /** Step unit for the button tooltips, e.g. "mol%". */
  unit?: string;
  onChange: (value: number) => void;
}

/** Range slider with a nudge button on each side. Clamping is the caller's job (see formulationLimits.ts). */
export function NudgeSlider({
  id,
  label,
  swatch,
  value,
  min,
  max,
  step,
  nudge = step,
  valueText,
  unit = '',
  onChange,
}: NudgeSliderProps) {
  const stepText = `${nudge}${unit ? ` ${unit}` : ''}`;
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const trackBg = swatch
    ? `linear-gradient(to right, ${swatch} 0%, ${swatch} ${pct}%, #0A0C0E ${pct}%, #0A0C0E 100%)`
    : `linear-gradient(to right, #38BDF8 0%, #38BDF8 ${pct}%, #0A0C0E ${pct}%, #0A0C0E 100%)`;

  return (
    <div className="ctl-slider">
      <div className="ctl-slider__head">
        <label className="ctl-slider__label" htmlFor={id}>
          {swatch && <i className="ctl-swatch" style={{ backgroundColor: swatch }} aria-hidden="true" />}
          {label}
        </label>
        <output className="ctl-slider__value" htmlFor={id}>
          {valueText}
        </output>
      </div>
      <div className="ctl-slider__track">
        <button
          type="button"
          className="ctl-nudge"
          aria-label={`Decrease ${label}`}
          title={`Decrease by ${stepText}`}
          disabled={value <= min}
          onClick={() => onChange(value - nudge)}
        >
          −
        </button>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={valueText}
          style={{ background: trackBg }}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        />
        <button
          type="button"
          className="ctl-nudge"
          aria-label={`Increase ${label}`}
          title={`Increase by ${stepText}`}
          disabled={value >= max}
          onClick={() => onChange(value + nudge)}
        >
          +
        </button>
      </div>
    </div>
  );
}
