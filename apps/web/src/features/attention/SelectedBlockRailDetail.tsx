import type { BlockDecision, Confidence, Sensor, SensorSeries } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useEvents, useReadings } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { RailMoistureChart } from '@/features/moisture-chart/RailMoistureChart';
import { HOUR_MS } from '@/features/moisture-chart/chart';
import { useLocale } from '@/i18n';
import { formatNumber, formatPct } from '@/i18n/format';
import { duration, ease, gsap, stagger, useGSAP, useMotion } from '@/motion';
import { Skeleton } from '@/ui';

const CONFIDENCE_CHIP: Record<Confidence, string> = {
  high: 'chip ok',
  medium: 'chip',
  low: 'chip warn',
};

const DROP = 'M8 2C5.5 5.5 4 7.6 4 9.5a4 4 0 0 0 8 0C12 7.6 10.5 5.5 8 2z';
const PROBE = 'M2 5h12M8 5v9M5.5 14h5';

/**
 * The selected rail row, opened (design/dashboard.html `.blk-d`): projected water and each
 * simulated sensor, tonight's figures, the 14-day line, and the way into the block's page.
 * Mounted for the selected block only, so only that block's readings and events are requested.
 */
export function SelectedBlockRailDetail({
  id,
  decision: d,
  sensors,
}: {
  id: string;
  decision: BlockDecision;
  /** This block's sensors from the farm (depth and weight). */
  sensors: Sensor[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const readings = useReadings(d.blockId, 14);
  const events = useEvents(d.blockId, 30);
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();

  // The row opens downward: the panel settles, then its rows and tiles. Reduced: already open.
  useGSAP(
    () => {
      const el = root.current;
      if (reduced || !el) return;
      gsap.from(el, {
        opacity: 0,
        y: -8,
        duration: duration.settle,
        ease: ease.reveal,
        clearProps: 'transform,opacity',
      });
      gsap.from(el.querySelectorAll('.mrow, .mt'), {
        opacity: 0,
        y: 6,
        duration: duration.settle,
        ease: ease.reveal,
        stagger: stagger.list,
        clearProps: 'transform,opacity',
      });
    },
    { scope: root, dependencies: [d.blockId] },
  );

  const tiles = [
    { label: t('today.et0Tomorrow'), value: formatNumber(d.et0Mm, locale), unit: 'mm' },
    { label: t('today.cropUse'), value: formatNumber(d.etcMm, locale), unit: 'mm' },
    {
      label: t('today.threshold'),
      value: formatNumber(d.threshold, locale, 0),
      unit: '%',
      accent: true,
    },
    { label: t('today.target'), value: formatNumber(d.target, locale, 0), unit: '%' },
  ];
  const series = readings.data;
  const newest = Math.max(
    0,
    ...(series ?? []).flatMap((s) => s.points.map((p) => Date.parse(p.t))),
  );

  return (
    <div id={id} ref={root} className="blk-d">
      <ul aria-label={t('rail.sensors')}>
        <li className="mrow">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d={DROP} className="ic" />
          </svg>
          <span>
            <b>{t('today.projected')}</b>
            <small>{t('today.projectedSub')}</small>
          </span>
          {d.pawProjected === null ? (
            <span className="lbl">{t('state.noData')}</span>
          ) : (
            <span className="num">
              {formatNumber(d.pawProjected, locale)}
              <i>%</i>
            </span>
          )}
        </li>
        {sensors.map((sensor) => (
          <SensorRow
            key={sensor.id}
            sensor={sensor}
            series={series?.find((s) => s.sensorId === sensor.id)}
            loading={readings.isPending}
            newest={newest}
          />
        ))}
      </ul>

      <dl className="mini">
        {tiles.map((tile) => (
          <div key={tile.label} className="mt">
            <dt className="lbl">{tile.label}</dt>
            <dd className={tile.accent ? 'num acc' : 'num'}>
              {tile.value}
              <i>{tile.unit}</i>
            </dd>
          </div>
        ))}
      </dl>

      {/* The whole card opens the block's page (its full chart, reasons and history): a
          stretched link over the card, so the visual stays the reference's. */}
      <section aria-label={t('block.chartPanel')} className="chart">
        <Link
          to={`/blocks/${d.blockId}`}
          className="chart-link"
          aria-label={t('today.openBlock', { code: d.blockId })}
        />
        <div className="chart-h">
          <h3 className="lbl">{t('block.chartPanel')}</h3>
          <span className={CONFIDENCE_CHIP[d.confidence]}>
            {t('rail.confidence', { level: t(`confidence.${d.confidence}`) })}
          </span>
        </div>
        <QueryState
          query={readings}
          isEmpty={(list) => list.every((s) => s.points.length === 0)}
          emptyText={t('block.noReadings')}
          skeleton={<Skeleton block={128} className="mt-2" />}
        >
          {(list) => (
            <RailMoistureChart
              blockId={d.blockId}
              series={list}
              sensors={sensors}
              threshold={d.threshold}
              target={d.target}
              events={events.data ?? []}
            />
          )}
        </QueryState>
      </section>
    </div>
  );
}

/** "Sensor · 30 cm — weight 0.6 · simulated — 70.4%", or how long it has been silent. */
function SensorRow({
  sensor,
  series,
  loading,
  newest,
}: {
  sensor: Sensor;
  series: SensorSeries | undefined;
  loading: boolean;
  /** The newest reading of any of this block's sensors (the API's "now"). */
  newest: number;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const latest = series?.points.at(-1);
  const stale = series?.stale ?? false;
  const silentHours =
    series && stale ? Math.round((newest - Date.parse(series.lastAt)) / HOUR_MS) : 0;
  return (
    <li className="mrow">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d={PROBE} className="ic" />
      </svg>
      <span>
        <b>
          {sensor.depthCm === null
            ? t('rail.substrateSensor')
            : t('rail.sensor', { depth: `\u2066${sensor.depthCm} cm\u2069` })}
        </b>
        <small>
          {stale
            ? t('rail.sensorStale', { hours: silentHours })
            : t('rail.sensorWeight', { weight: formatNumber(sensor.weight, locale) })}
        </small>
      </span>
      {loading ? (
        <Skeleton inline={56} block={18} />
      ) : stale ? (
        <span className="num">{t('rail.offline')}</span>
      ) : latest ? (
        <span className="num">{formatPct(latest.paw, locale)}</span>
      ) : (
        <span className="lbl">{t('state.noData')}</span>
      )}
    </li>
  );
}
