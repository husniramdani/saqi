import type { DayPlan, Farm } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { formatTimeGst, formatTimeRangeGst } from '@/i18n/format';
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
  const night = plan.schedule.filter((i) => i.kind === 'night');
  const pulses = plan.schedule.filter((i) => i.kind === 'pulse');
  const hourLabel = (h: number) => {
    const ms = window.start + h * 3_600_000;
    const label = formatTimeGst(new Date(ms).toISOString(), locale).replace(' GST', '');
    return h === 0 || h === window.hours ? label : label.slice(0, 2);
  };

  return (
    <section
      aria-label={t('today.schedule')}
      className="rounded-md border border-border bg-surface-raised p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{t('today.schedule')}</h2>
        <span className="num text-xs text-text-muted">GST</span>
      </div>
      {night.length === 0 ? (
        <EmptyState title={t('today.noIrrigation')}>
          {t('today.noIrrigationSaves', { m3: plan.totals.savedVsFixedM3 })}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem]">
          <span />
          {/* Mono and tabular but not `num`: the ruler must follow the reading direction, like the bars. */}
          <div
            aria-hidden="true"
            className="flex justify-between font-mono text-2xs text-text-muted tabular-nums"
          >
            {Array.from({ length: window.hours + 1 }, (_, h) => (
              <span key={h}>{hourLabel(h)}</span>
            ))}
          </div>
          <span className="num hidden text-end text-2xs text-text-muted sm:block">
            {t('today.volume')}
          </span>
          {night.map((item) => {
            const range = formatTimeRangeGst(item.start, item.end, locale);
            const label = t('today.barLabel', {
              code: item.blockId,
              window: range,
              m3: item.volumeM3,
            });
            // The whole row is the 44 px target; it shares the ruler's columns via subgrid.
            return (
              <button
                key={item.blockId}
                type="button"
                aria-label={label}
                onClick={() => onSelect(item.blockId)}
                className="col-span-full grid min-h-11 grid-cols-subgrid items-center rounded-md text-start hover:bg-surface-well"
              >
                <span className="num text-sm font-medium">{item.blockId}</span>
                <TimeTrack hours={window.hours} bars={[{ ...barShare(item, window), label }]} />
                <span className="hidden text-end sm:block">
                  <Figure value={item.volumeM3} unit="m³" size="sm" />
                </span>
              </button>
            );
          })}
        </div>
      )}
      {pulses.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-text-secondary">
          <span className="font-medium">{t('today.pulsesTomorrow')}</span>
          {[...new Set(pulses.map((p) => p.blockId))].map((id) => (
            <span key={id} className="num inline-flex items-center gap-1.5" data-pulse-block={id}>
              <span className="font-medium text-text-primary">{id}</span>
              {pulses
                .filter((p) => p.blockId === id)
                .map((p) => (
                  <span key={p.start} className="rounded-sm bg-surface-well px-1.5 py-0.5">
                    {formatTimeGst(p.start, locale).replace(' GST', '')}
                  </span>
                ))}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
