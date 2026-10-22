import type { IrrigationEvent, Sensor, SensorSeries } from '@saqi/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isRtl, useLocale } from '@/i18n';
import { formatM3, formatNumber, formatPct, formatTimeGst, intlLocale } from '@/i18n/format';
import { blockSeries, dailyMeans, dayTicks, HOUR_MS, linePath, sensorPts } from './chart';

const H = 260;
const M = { top: 14, bottom: 30, start: 40, end: 18 };
const GRID = [0, 25, 50, 75, 100];

interface MoistureChartProps {
  series: SensorSeries[];
  sensors: Sensor[];
  threshold: number;
  target: number;
  events: IrrigationEvent[];
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Plant-available water over the last 14 days (hand SVG): the target band between threshold and
 * target, the dashed threshold, each sensor as a thin line, the block as the 2 px line, past
 * irrigations as markers on the axis, and "now". Time runs with the reading direction.
 */
export function MoistureChart({ series, sensors, threshold, target, events }: MoistureChartProps) {
  const { t } = useTranslation();
  const locale = useLocale();
  const rtl = isRtl(locale);
  const ids = useId().replace(/:/g, '');
  const { ref, width: W } = useWidth();
  const [hovered, setHovered] = useState<string | null>(null);

  const weights = Object.fromEntries(sensors.map((s) => [s.id, s.weight]));
  const block = blockSeries(series, weights);
  const last = block.at(-1);
  const times = series.flatMap((s) => s.points.map((p) => Date.parse(p.t)));
  // The window ends at the newest reading (the API's "now"); the page shows an empty state if none.
  const to = times.length > 0 ? Math.max(...times) : 0;
  const from = to - 14 * 24 * HOUR_MS;

  const x = (time: number) => {
    const px = M.start + ((time - from) / (to - from)) * (W - M.start - M.end);
    return rtl ? W - px : px;
  };
  const y = (paw: number) => M.top + (1 - paw / 100) * (H - M.top - M.bottom);
  const axisY = H - M.bottom;
  const labelX = rtl ? W - M.start + 8 : M.start - 8;
  const anchorStart = rtl ? 'start' : 'end';
  const dayLabel = new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Dubai',
  });
  const ticks = dayTicks(from, to);
  // Label every day that fits ~72 px of space, counting back from the newest tick.
  const pxPerDay = (W - M.start - M.end) / 14;
  const labelEvery = Math.max(2, Math.ceil(72 / pxPerDay));
  const shownEvents = events.filter((e) => Date.parse(e.startedAt) >= from);
  const means = dailyMeans(block).slice(-7);
  const depth = (s: SensorSeries) =>
    s.depthCm === null ? t('block.chart.substrate') : `${s.depthCm} cm`;

  return (
    <div ref={ref} className="flex flex-col gap-3">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${ids}-title ${ids}-desc`}
        className="block max-w-full"
        // RTL is computed into the coordinates above, so text anchors must stay physical.
        style={{ direction: 'ltr' }}
      >
        <title id={`${ids}-title`}>{t('block.chart.title')}</title>
        <desc id={`${ids}-desc`}>
          {t('block.chart.desc', {
            now: last ? formatPct(last.paw, locale) : t('state.noData'),
            threshold,
            target,
            events: shownEvents.length,
          })}
        </desc>

        {GRID.map((g) => (
          <g key={g}>
            <line
              x1={x(from)}
              x2={x(to)}
              y1={y(g)}
              y2={y(g)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text
              x={labelX}
              y={y(g)}
              dy="0.35em"
              textAnchor={anchorStart}
              fontSize={11}
              className="font-mono"
              fill="var(--color-text-muted)"
            >
              {g}
            </text>
          </g>
        ))}

        <rect
          x={Math.min(x(from), x(to))}
          width={Math.abs(x(to) - x(from))}
          y={y(target)}
          height={y(threshold) - y(target)}
          fill="var(--color-water-1)"
          opacity={0.7}
          data-band
        />
        <line
          x1={x(from)}
          x2={x(to)}
          y1={y(threshold)}
          y2={y(threshold)}
          stroke="var(--color-text-secondary)"
          strokeWidth={1.25}
          strokeDasharray="5 4"
          data-threshold
        />
        <text
          x={x(from) + (rtl ? -6 : 6)}
          y={y(threshold) - 6}
          textAnchor={rtl ? 'end' : 'start'}
          fontSize={11}
          fill="var(--color-text-secondary)"
        >
          {t('block.chart.thresholdLabel', { threshold })}
        </text>

        {ticks.map((tick, i) => (
          <g key={tick}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={axisY}
              y2={axisY + 4}
              stroke="var(--color-border-strong)"
            />
            {(ticks.length - 1 - i) % labelEvery === 0 ? (
              <text
                x={x(tick)}
                y={axisY + 18}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-text-muted)"
              >
                {dayLabel.format(new Date(tick))}
              </text>
            ) : null}
          </g>
        ))}
        <line x1={x(from)} x2={x(to)} y1={axisY} y2={axisY} stroke="var(--color-border-strong)" />

        {series.map((s) => (
          <path
            key={s.sensorId}
            d={linePath(sensorPts(s), x, y)}
            fill="none"
            stroke="var(--color-text-muted)"
            strokeWidth={1.25}
            strokeDasharray={s.depthCm !== null && s.depthCm >= 60 ? '4 3' : undefined}
            data-sensor={s.sensorId}
          />
        ))}
        <path
          d={linePath(block, x, y)}
          fill="none"
          stroke="var(--color-water-5)"
          strokeWidth={2}
          strokeLinejoin="round"
          data-block-line
        />

        {shownEvents.map((e) => {
          const ex = x(Date.parse(e.startedAt));
          const label = `${formatTimeGst(e.startedAt, locale)} · ${formatM3(e.volumeM3, locale)}`;
          return (
            <g
              key={e.id}
              onMouseEnter={() => setHovered(e.id)}
              onMouseLeave={() => setHovered(null)}
              data-event
            >
              <title>{label}</title>
              <path
                d={`M${ex} ${axisY - 9} L${ex - 5} ${axisY} L${ex + 5} ${axisY} Z`}
                fill="var(--color-text-primary)"
              />
              {hovered === e.id ? (
                <text
                  x={ex}
                  y={axisY - 14}
                  textAnchor="middle"
                  fontSize={11}
                  className="font-mono"
                  fill="var(--color-text-primary)"
                >
                  {label}
                </text>
              ) : null}
            </g>
          );
        })}

        {last ? (
          <g data-now>
            <circle
              cx={x(last.t)}
              cy={y(last.paw)}
              r={4.5}
              fill="var(--color-water-5)"
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
            <text
              x={x(last.t) + (rtl ? 10 : -10)}
              y={y(last.paw) - 10}
              textAnchor={rtl ? 'start' : 'end'}
              fontSize={12}
              className="font-mono"
              fill="var(--color-text-primary)"
            >
              {formatPct(last.paw, locale)}
            </text>
          </g>
        ) : null}
      </svg>

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
        {series.map((s) => (
          <li key={s.sensorId} className="inline-flex items-center gap-2">
            <svg width="22" height="6" aria-hidden="true">
              <line
                x1="0"
                x2="22"
                y1="3"
                y2="3"
                stroke="var(--color-text-muted)"
                strokeWidth="1.5"
                strokeDasharray={s.depthCm !== null && s.depthCm >= 60 ? '4 3' : undefined}
              />
            </svg>
            {depth(s)}
          </li>
        ))}
        <li className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-water-5" />
          {t('block.chart.block')}
        </li>
        <li className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="h-3 w-5 rounded-[3px] bg-water-1" />
          {t('block.chart.band', { threshold, target })}
        </li>
        <li className="inline-flex items-center gap-2">
          <svg width="10" height="9" aria-hidden="true">
            <path d="M5 0 L0 9 L10 9 Z" fill="var(--color-text-primary)" />
          </svg>
          {t('block.chart.irrigation')}
        </li>
      </ul>

      <table className="sr-only">
        <caption>{t('block.chart.tableCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('block.chart.day')}</th>
            <th scope="col">{t('block.chart.mean')}</th>
          </tr>
        </thead>
        <tbody>
          {means.map((m) => (
            <tr key={m.date}>
              <th scope="row">{m.date}</th>
              <td>{formatNumber(m.mean, locale)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
