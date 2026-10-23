import { useRef } from 'react';
import { useLocale } from '@/i18n';
import { countTo, useGSAP, useMotion } from '@/motion';
import { formatNumber } from '@/i18n/format';
import { cx } from './cx';

const SIZE = {
  sm: 'text-md',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
} as const;

// The raised 0.42em unit is for lead figures only; at 15.5 px it would be 6.5 px and unreadable,
// so small figures keep a baseline unit one step smaller (never under 12.5 px).
const UNIT = {
  sm: 'text-[0.82em] ms-[0.2em]',
  md: 'text-[0.5em] ms-[0.2em] align-[0.5em]',
  lg: 'text-[0.42em] ms-[0.25em] align-[0.55em]',
  xl: 'text-[0.42em] ms-[0.25em] align-[0.55em]',
} as const;

interface FigureProps {
  value: number;
  unit: string;
  /** Decimal places shown. */
  precision?: number;
  size?: keyof typeof SIZE;
  /** Orange: tonight's figure. One per view. */
  accent?: boolean;
  className?: string;
}

/**
 * A measured figure: Geist Mono value with its unit set small in text-muted beside it.
 * `data-value` carries the raw number for the counter animation (T16).
 */
export function Figure({
  value,
  unit,
  precision = 1,
  size = 'md',
  accent,
  className,
}: FigureProps) {
  const locale = useLocale();
  const number = useRef<HTMLSpanElement>(null);
  const previous = useRef<number | null>(null);
  const { reduced } = useMotion();
  // M3 · when the value changes, count from the previous one (never from 0). First render: final.
  useGSAP(
    () => {
      const from = previous.current;
      previous.current = value;
      if (from === null || from === value || !number.current) return;
      countTo(number.current, from, value, {
        precision,
        format: (v) => formatNumber(v, locale, precision),
        reduced,
      });
    },
    { dependencies: [value] },
  );
  return (
    <span
      data-value={value}
      className={cx(
        'num leading-none tracking-[-0.03em]',
        SIZE[size],
        accent ? 'text-accent-text' : 'text-text-primary',
        className,
      )}
    >
      <span ref={number}>{formatNumber(value, locale, precision)}</span>
      <span className={cx('tracking-normal text-text-muted', UNIT[size])}>{unit}</span>
    </span>
  );
}

interface StatProps extends FigureProps {
  label: string;
  /** Change since the last value, in the same unit. */
  delta?: number;
}

/** Label over figure (design.md · Figure + unit). */
export function Stat({ label, delta, ...figure }: StatProps) {
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <Figure {...figure} />
      {delta === undefined ? null : (
        <span className="num text-xs text-text-secondary">
          {delta > 0 ? '+' : ''}
          {formatNumber(delta, locale, figure.precision ?? 1)} {figure.unit}
        </span>
      )}
    </div>
  );
}
