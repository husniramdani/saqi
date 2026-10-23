import { useRef } from 'react';
import { meterTo, useGSAP, useMotion } from '@/motion';
import { cx } from './cx';

interface MeterProps {
  /** Used share, 0–1 (values over 1 fill the track: the overshoot shows in the figure). */
  value: number;
  /** Tick on the track, 0–1 (the 97 % "tight" line on the budget). */
  mark?: number;
  label: string;
  className?: string;
}

/**
 * Budget meter: 12 px well with an orange fill. The fill is `scaleX` from the inline start,
 * so GSAP can animate it (M4) without touching layout.
 */
export function Meter({ value, mark, label, className }: MeterProps) {
  const share = Math.min(1, Math.max(0, value));
  const fill = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const { reduced } = useMotion();
  // M4 · fills from the inline start: from empty on first show, then from the previous share.
  useGSAP(
    () => {
      if (fill.current) meterTo(fill.current, share, { from: previous.current, reduced });
      previous.current = share;
    },
    { dependencies: [share, reduced] },
  );
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cx('relative h-3 w-full overflow-hidden rounded-sm bg-surface-well', className)}
    >
      <span
        ref={fill}
        data-meter-fill
        className="absolute inset-0 origin-left rounded-sm bg-accent rtl:origin-right"
        style={{ transform: `scaleX(${share})` }}
      />
      {mark === undefined ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 w-0.5 bg-text-primary"
          style={{ insetInlineStart: `${mark * 100}%` }}
        />
      )}
    </div>
  );
}
