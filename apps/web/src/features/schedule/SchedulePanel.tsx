import type { DayPlan, Farm } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { growFromStart, useGSAP, useMotion } from '@/motion';
import { useLocale } from '@/i18n';
import { formatM3, formatTimeGst, formatTimeRangeGst } from '@/i18n/format';
import { barShare, nightWindow } from './axis';

/**
 * Tonight's schedule card (design/dashboard.html `.sched`): an hourly GST ruler for the night
 * window and one row per run, its bar and volume. Each row selects its block. Time runs with
 * the reading direction.
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
  // M6 · bars grow from their start edge (right in RTL).
  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      growFromStart(root.querySelectorAll('[data-schedule-bar]'), { reduced });
    },
    { scope, dependencies: [plan.generatedAt, reduced] },
  );
  const night = plan.schedule.filter((i) => i.kind === 'night');
  const clock = (iso: string) => formatTimeGst(iso, locale).replace(' GST', '');
  const hourLabel = (h: number) => {
    const label = clock(new Date(window.start + h * 3_600_000).toISOString());
    return h === 0 || h === window.hours ? label : label.slice(0, 2);
  };

  return (
    <section
      ref={scope}
      id="schedule"
      tabIndex={-1}
      aria-label={t('today.schedule')}
      className="glass sched"
    >
      <h2 className="sr-only">{t('today.schedule')}</h2>
      {night.length === 0 ? (
        <p className="sched-empty">
          <b>{t('today.noIrrigation')}</b>
          <span className="lbl">
            {t('today.noIrrigationSaves', { m3: plan.totals.savedVsFixedM3 })}
          </span>
        </p>
      ) : (
        <>
          <span aria-hidden="true" className="lbl">
            GST
          </span>
          {/* Mono and tabular, but it must follow the reading direction like the bars. */}
          <div aria-hidden="true" className="ruler">
            {Array.from({ length: window.hours + 1 }, (_, h) => (
              <span key={h}>{hourLabel(h)}</span>
            ))}
          </div>
          <span aria-hidden="true" className="lbl vol">
            {t('today.volume')}
          </span>
          {night.map((item) => {
            const { from, to } = barShare(item, window);
            const deficit =
              plan.decisions.find((d) => d.blockId === item.blockId)?.decision === 'deficit';
            const range = `${clock(item.start)} → ${clock(item.end)}`;
            // The row's name: code, window and volume (the visible ones, WCAG 2.5.3); the bar
            // and the volume column are decorative copies of it.
            return (
              <button
                key={item.blockId}
                type="button"
                className="sched-row"
                onClick={() => onSelect(item.blockId)}
              >
                <span className="m code">
                  {item.blockId}
                  <span className="sr-only">
                    , {formatTimeRangeGst(item.start, item.end, locale)},{' '}
                    {formatM3(item.volumeM3, locale)}
                  </span>
                </span>
                <span aria-hidden="true" className="trk">
                  <span
                    className="bar"
                    data-schedule-bar
                    style={{
                      insetInlineStart: `${from * 100}%`,
                      inlineSize: `${(to - from) * 100}%`,
                    }}
                  >
                    {range}
                    {/* The note drops on a phone, where the bar is too short to hold it. */}
                    {deficit ? (
                      <span className="bar-note"> {t('today.barDeficitNote')}</span>
                    ) : null}
                  </span>
                </span>
                <span aria-hidden="true" className="m vol">
                  <bdi>{formatM3(item.volumeM3, locale)}</bdi>
                </span>
              </button>
            );
          })}
        </>
      )}
    </section>
  );
}
