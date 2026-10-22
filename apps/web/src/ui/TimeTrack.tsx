import type { ReactNode } from 'react';

export interface TrackBar {
  /** Start and end as shares of the track, 0–1. */
  from: number;
  to: number;
  /** Accessible name, e.g. "D-1, 22:00 to 01:01, 90.4 m³". */
  label: string;
  onClick?: () => void;
}

/**
 * Schedule track: a 26 px well with one tick per hour and orange bars that grow from the
 * inline start. Time runs with the reading direction, so 22:00 is on the right in RTL.
 */
export function TimeTrack({
  hours,
  bars,
  children,
}: {
  hours: number;
  bars: TrackBar[];
  children?: ReactNode;
}) {
  return (
    <div className="relative h-[26px] w-full rounded-sm bg-surface-well">
      {Array.from({ length: hours - 1 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-border-strong"
          style={{ insetInlineStart: `${((i + 1) / hours) * 100}%` }}
        />
      ))}
      {bars.map((bar) => {
        const style = {
          insetInlineStart: `${bar.from * 100}%`,
          inlineSize: `${Math.max(0, bar.to - bar.from) * 100}%`,
        };
        const className = 'absolute inset-y-1 rounded-[4px] bg-accent';
        return bar.onClick ? (
          <button
            key={bar.label}
            type="button"
            data-schedule-bar
            aria-label={bar.label}
            onClick={bar.onClick}
            className={className}
            style={style}
          />
        ) : (
          <span
            key={bar.label}
            data-schedule-bar
            role="img"
            aria-label={bar.label}
            className={className}
            style={style}
          />
        );
      })}
      {children}
    </div>
  );
}
