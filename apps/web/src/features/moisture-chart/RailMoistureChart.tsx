import type { IrrigationEvent, Sensor, SensorSeries } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, useLocale } from '@/i18n';
import { formatPct, formatTimeGst } from '@/i18n/format';
import { duration, ease, gsap, loadMapPlugins, useGSAP, useMotion } from '@/motion';
import { blockSeries, HOUR_MS, linePath } from './chart';

const W = 290;
const DAYS = 14;
/** Plot area: 100 % sits on the top grid line, 0 % on the bottom one; "now" ends 20 units early. */
const TOP = 10;
const BOTTOM = 90;
const START = 4;
const END = 270;
const GRID = [TOP, (TOP + BOTTOM) / 2, BOTTOM];

interface RailMoistureChartProps {
  blockId: string;
  series: SensorSeries[];
  sensors: Sensor[];
  threshold: number;
  target: number;
  events: IrrigationEvent[];
}

/**
 * The rail's 14-day water line (Nightfield canvas "Water now · last 14 days"): the weighted block
 * line over the target band, the threshold, past irrigations on the baseline and "now". A compact
 * companion to the block page's `MoistureChart`, built from the same series helpers.
 */
export function RailMoistureChart({
  blockId,
  series,
  sensors,
  threshold,
  target,
  events,
}: RailMoistureChartProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const rtl = isRtl(locale);
  const { reduced } = useMotion();
  const svg = useRef<SVGSVGElement>(null);

  const weights = Object.fromEntries(sensors.map((s) => [s.id, s.weight]));
  const block = blockSeries(series, weights);
  const last = block.at(-1);
  const times = series.flatMap((s) => s.points.map((p) => Date.parse(p.t)));
  // The window ends at the newest reading (the API's "now").
  const to = times.length > 0 ? Math.max(...times) : 0;
  const from = to - DAYS * 24 * HOUR_MS;

  const x = (time: number) => {
    const px = START + ((time - from) / (to - from)) * (END - START);
    return rtl ? W - px : px;
  };
  const y = (paw: number) => TOP + (1 - Math.min(100, Math.max(0, paw)) / 100) * (BOTTOM - TOP);
  const line = linePath(block, x, y);
  const shownEvents = events.filter((e) => Date.parse(e.startedAt) >= from);

  const summary = last
    ? [
        t('rail.chart.summary', {
          code: blockId,
          now: formatPct(last.paw, locale),
          threshold,
          target,
          events: shownEvents.length,
        }),
        ...series
          .filter((s) => s.stale)
          .map((s) =>
            t('rail.chart.stale', {
              sensor: s.depthCm === null ? t('block.chart.substrate') : `${s.depthCm} cm`,
              since: formatTimeGst(s.lastAt, locale),
            }),
          ),
      ].join(' ')
    : t('rail.chart.empty', { code: blockId, threshold, target });

  // The block line draws itself from the oldest reading (`drift`); reduced motion: already drawn.
  useGSAP(
    () => {
      const path = svg.current?.querySelector('[data-block-line]');
      if (reduced || !path) return;
      gsap.set(path, { opacity: 0 });
      let cancelled = false;
      let tween: gsap.core.Tween | null = null;
      void loadMapPlugins()
        .then(() => {
          if (cancelled) return;
          tween = gsap.fromTo(
            path,
            { opacity: 1, drawSVG: '0%' },
            { drawSVG: '100%', duration: duration.drift, ease: ease.reveal },
          );
        })
        .catch(() => gsap.set(path, { opacity: 1 }));
      return () => {
        cancelled = true;
        tween?.revert();
      };
    },
    { scope: svg, dependencies: [line, reduced], revertOnUpdate: true },
  );

  return (
    <div className="flex flex-col gap-1">
      <svg
        ref={svg}
        viewBox={`0 0 ${W} 104`}
        width="100%"
        role="img"
        aria-label={summary}
        className="mt-2 block h-auto w-full"
      >
        {GRID.map((gy) => (
          <line key={gy} x1={0} x2={W} y1={gy} y2={gy} stroke="var(--color-border)" />
        ))}
        <rect
          x={0}
          width={W}
          y={y(target)}
          height={y(threshold) - y(target)}
          fill="var(--color-water-1)"
          opacity={0.7}
          data-band
        />
        <line
          x1={0}
          x2={W}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke="var(--color-text-secondary)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          data-threshold
        />
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="var(--color-water-5)"
            strokeWidth={2.2}
            strokeLinejoin="round"
            data-block-line
          />
        ) : null}
        {shownEvents.map((e) => {
          const ex = x(Date.parse(e.startedAt));
          return (
            <path
              key={e.id}
              d={`M${ex.toFixed(1)} ${BOTTOM - 7} L${(ex - 4).toFixed(1)} ${BOTTOM} L${(ex + 4).toFixed(1)} ${BOTTOM} Z`}
              fill="var(--color-text-primary)"
              data-event
            />
          );
        })}
        {last ? (
          <circle
            cx={x(last.t)}
            cy={y(last.paw)}
            r={4.5}
            fill="var(--color-text-primary)"
            stroke="var(--color-surface)"
            strokeWidth={2}
            data-now
          />
        ) : null}
      </svg>
      <div aria-hidden="true" className="flex justify-between font-mono text-xs text-text-muted">
        <span>{t('rail.chart.daysAgo', { days: DAYS })}</span>
        <span>{t('rail.chart.daysAgo', { days: DAYS / 2 })}</span>
        <span className="font-sans">{t('rail.chart.now')}</span>
      </div>
    </div>
  );
}
