import type { IrrigationEvent, Sensor, SensorSeries } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, useLocale } from '@/i18n';
import { formatPct, formatTimeGst } from '@/i18n/format';
import { duration, ease, gsap, loadMapPlugins, useGSAP, useMotion } from '@/motion';
import { blockSeries, HOUR_MS, linePath, type Pt } from './chart';

const W = 290;
const DAY_MS = 24 * HOUR_MS;
/** One point a day: thirteen days back to now. */
const SPAN_DAYS = 13;
/** design/dashboard.html: day i of 0–13 at x = 10 + 20i, PAW at y = 90 − 0.8 × PAW. */
const START = 10;
const END = 270;
const GRID = [10, 50, 90];

interface RailMoistureChartProps {
  blockId: string;
  series: SensorSeries[];
  sensors: Sensor[];
  threshold: number;
  target: number;
  events: IrrigationEvent[];
}

/** The newest reading at or before each daily mark, from `now` back `SPAN_DAYS` days. */
function daily(pts: Pt[], now: number): Pt[] {
  const out: Pt[] = [];
  let i = 0;
  for (let day = SPAN_DAYS; day >= 0; day--) {
    const at = now - day * DAY_MS;
    while (i + 1 < pts.length && (pts[i + 1]?.t ?? Infinity) <= at) i++;
    const p = pts[i];
    // A day with no reading in the hours before its mark is a gap, not a guess.
    if (p && p.t <= at && at - p.t < 3 * HOUR_MS) out.push({ t: at, paw: p.paw });
  }
  return out;
}

/**
 * The rail's 14-day water line (design/dashboard.html "Water now · last 14 days"): one weighted
 * block reading a day over the target band, the threshold, past irrigations on the baseline and
 * "now". A compact companion to the block page's `MoistureChart`, built from the same helpers.
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
  // The window ends at the newest reading (the API's "now").
  const to = last?.t ?? 0;
  const from = to - SPAN_DAYS * DAY_MS;
  const points = daily(block, to);

  // Time runs with the reading direction.
  const x = (time: number) => {
    const px = START + ((time - from) / (to - from)) * (END - START);
    return rtl ? W - px : px;
  };
  const y = (paw: number) => 90 - Math.min(100, Math.max(0, paw)) * 0.8;
  const line = linePath(points, x, y, 1.5 * DAY_MS);
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

  // The block line draws itself from the oldest day (`drift`, emphasized); reduced: drawn.
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
            { drawSVG: '100%', duration: duration.drift, ease: ease.emphasized },
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
    <>
      <svg ref={svg} viewBox={`0 0 ${W} 104`} width="100%" role="img" aria-label={summary}>
        {GRID.map((gy) => (
          <line key={gy} x1={0} x2={W} y1={gy} y2={gy} className="ch-grid" />
        ))}
        <rect
          x={0}
          width={W}
          y={y(target)}
          height={y(threshold) - y(target)}
          className="ch-band"
          data-band
        />
        <line x1={0} x2={W} y1={y(threshold)} y2={y(threshold)} className="ch-thr" data-threshold />
        {line ? <path d={line} className="ch-line" data-block-line /> : null}
        {shownEvents.map((e) => {
          const ex = x(Date.parse(e.startedAt));
          return (
            <path
              key={e.id}
              d={`M${(ex - 5).toFixed(1)} 102 L${ex.toFixed(1)} 94 L${(ex + 5).toFixed(1)} 102 Z`}
              className="ch-ev"
              data-event
            />
          );
        })}
        {last ? <circle cx={x(to)} cy={y(last.paw)} r={4.5} className="ch-now" data-now /> : null}
      </svg>
      <div aria-hidden="true" className="ruler">
        <span>{t('rail.chart.daysAgo', { days: SPAN_DAYS })}</span>
        <span>{t('rail.chart.daysAgo', { days: 7 })}</span>
        <span>{t('rail.chart.now')}</span>
      </div>
    </>
  );
}
