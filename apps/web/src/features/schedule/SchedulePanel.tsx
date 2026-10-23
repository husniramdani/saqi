import type { DayPlan, Farm } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { duration, ease, gsap, growFromStart, stagger, useGSAP, useMotion } from '@/motion';
import { useLocale } from '@/i18n';
import { formatM3, formatTimeGst, formatTimeRangeGst } from '@/i18n/format';
import { EmptyState, Figure, TimeTrack } from '@/ui';
import { barShare, nightWindow } from './axis';

/**
 * Tonight's schedule (Nightfield canvas): an hourly ruler for the night window, one row per run
 * with its bar, and tomorrow's greenhouse pulses. Time runs with the reading direction.
 */
export function SchedulePanel({
  plan,
  farm,
  onSelect,
}: {
  plan: DayPlan;
  farm: Farm;
  onSelect: (blockId: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const window = nightWindow(plan.date, farm);
  const scope = useRef<HTMLElement>(null);
  const { reduced } = useMotion();
  // M6 · bars grow from their start edge (right in RTL); tomorrow's pulses fade in after.
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      growFromStart(root.querySelectorAll('[data-schedule-bar]'), { reduced });
      if (!reduced) {
        gsap.from(root.querySelectorAll('[data-pulse-block] > span'), {
          opacity: 0,
          duration: duration.settle,
          ease: ease.standard,
          stagger: stagger.list,
          delay: duration.step,
        });
      }
    },
    { scope, dependencies: [plan.generatedAt, reduced] },
  );
  const night = plan.schedule.filter((i) => i.kind === 'night');
  const pulses = plan.schedule.filter((i) => i.kind === 'pulse');
  const hourLabel = (h: number) => {
    const ms = window.start + h * 3_600_000;
    const label = formatTimeGst(new Date(ms).toISOString(), locale).replace(' GST', '');
    return h === 0 || h === window.hours ? label : label.slice(0, 2);
  };

  const clock = (iso: string) => formatTimeGst(iso, locale).replace(' GST', '');

  return (
    <section
      aria-label={t('today.schedule')}
      className="rounded-md border border-border bg-overlay px-4 py-3 shadow-floating"
    >
      <h2 className="sr-only">{t('today.schedule')}</h2>
      {night.length === 0 ? (
        <EmptyState title={t('today.noIrrigation')}>
          {t('today.noIrrigationSaves', { m3: plan.totals.savedVsFixedM3 })}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem]">
          <span aria-hidden="true" className="text-xs text-text-muted">
            GST
          </span>
          {/* Mono and tabular but not `num`: the ruler must follow the reading direction, like the bars. */}
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-2xs text-text-secondary tabular-nums"
          >
            {Array.from({ length: window.hours + 1 }, (_, h) => (
              <span key={h}>{hourLabel(h)}</span>
            ))}
          </div>
          <span className="hidden text-end text-xs text-text-muted sm:block">
            {t('today.volume')}
          </span>
          {night.map((item) => {
            const range = formatTimeRangeGst(item.start, item.end, locale);
            const label = t('today.barLabel', {
              code: item.blockId,
              window: range,
              m3: item.volumeM3,
            });
            // The whole row is the 44 px target; it shares the ruler's columns via subgrid. Its
            // name comes from what it shows (code, volume) plus the window as screen-reader text,
            // so the visible label is in the name (WCAG 2.5.3).
            return (
              <button
                key={item.blockId}
                type="button"
                onClick={() => onSelect(item.blockId)}
                className="col-span-full grid min-h-11 grid-cols-subgrid items-center rounded-md text-start hover:bg-surface-well"
              >
                <span className="num text-sm font-medium">
                  {item.blockId}
                  <span className="sr-only">, {range},</span>
                </span>
                {/* Decorative here: the row's own name already says the window. */}
                <span aria-hidden="true" className="contents">
                  <TimeTrack
                    hours={window.hours}
                    bars={[
                      {
                        ...barShare(item, window),
                        label,
                        text: `${clock(item.start)} → ${clock(item.end)}`,
                      },
                    ]}
                  />
                </span>
                <span className="hidden text-end sm:block">
                  <Figure value={item.volumeM3} unit="m³" size="sm" />
                </span>
                {/* Phones hide the volume column; screen readers still hear it. */}
                <span className="sr-only sm:hidden">{formatM3(item.volumeM3, locale)}</span>
              </button>
            );
          })}
        </div>
      )}
      {pulses.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-text-secondary">
          <span className="font-medium">{t('today.pulsesTomorrow')}</span>
          {[...new Set(pulses.map((p) => p.blockId))].map((id) => (
            <span key={id} className="num inline-flex items-center gap-1.5" data-pulse-block={id}>
              <span className="font-medium text-text-primary">{id}</span>
              {pulses
                .filter((p) => p.blockId === id)
                .map((p) => (
                  <time
                    key={p.start}
                    dateTime={p.start}
                    className="rounded-sm bg-surface-well px-1.5 py-0.5"
                  >
                    {clock(p.start)}
                  </time>
                ))}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
