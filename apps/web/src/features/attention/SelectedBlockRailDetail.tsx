import type { BlockDecision, Confidence, ScheduleItem, Sensor, SensorSeries } from '@saqi/shared';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useEvents, useReadings } from '@/api/queries';
import { QueryState } from '@/app/QueryState';
import { windowLabel } from '@/features/farm-map/window';
import { RailMoistureChart } from '@/features/moisture-chart/RailMoistureChart';
import { StaleBanner } from '@/features/moisture-chart/StaleBanner';
import { useLocale } from '@/i18n';
import { formatNumber, formatPct, formatTimeGst } from '@/i18n/format';
import { captureBlock, duration, ease, gsap, stagger, useGSAP, useMotion } from '@/motion';
import {
  buttonClasses,
  Chip,
  type ChipVariant,
  DECISION_CHIP,
  Figure,
  PillArrow,
  Skeleton,
} from '@/ui';

const CONFIDENCE_CHIP: Record<Confidence, ChipVariant> = {
  high: 'ok',
  medium: 'outline',
  low: 'warn',
};

const MROW = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2.5';
const TILE = 'flex flex-col gap-1.5 rounded-md border border-border bg-surface px-3 py-2.5';

/**
 * The selected rail row, opened (Nightfield canvas `blk-d`): projected water, each simulated
 * sensor with its weight, tonight's figures, the 14-day line and the decision. Mounted for the
 * selected block only, so only that block's readings and events are requested.
 */
export function SelectedBlockRailDetail({
  id,
  decision: d,
  sensors,
  schedule,
}: {
  id: string;
  decision: BlockDecision;
  /** This block's sensors from the farm (depth and weight). */
  sensors: Sensor[];
  schedule: ScheduleItem[];
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const readings = useReadings(d.blockId, 14);
  const events = useEvents(d.blockId, 30);
  const root = useRef<HTMLDivElement>(null);
  const { reduced } = useMotion();
  const runs = windowLabel(d.blockId, schedule, locale);

  // The row opens downward: its parts settle in, top first. Reduced motion: already open.
  useGSAP(
    () => {
      if (reduced || !root.current) return;
      gsap.from(root.current.children, {
        opacity: 0,
        y: 6,
        duration: duration.settle,
        ease: ease.reveal,
        stagger: stagger.list,
        clearProps: 'opacity,transform',
      });
    },
    { scope: root, dependencies: [d.blockId] },
  );

  const tiles = [
    [t('today.et0Tomorrow'), d.et0Mm, 'mm'],
    [t('today.cropUse'), d.etcMm, 'mm'],
    [t('today.threshold'), d.threshold, '%'],
    [t('today.target'), d.target, '%'],
  ] as const;

  return (
    <div id={id} ref={root} className="flex flex-col gap-3.5 bg-surface-raised px-4 pb-4">
      <div className={MROW}>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">{t('today.projected')}</span>
          <span className="text-xs text-text-muted">{t('today.projectedSub')}</span>
        </span>
        {d.pawProjected === null ? (
          <span className="text-sm text-text-secondary">{t('state.noData')}</span>
        ) : (
          <Figure value={d.pawProjected} unit="%" size="sm" accent={d.pawProjected < d.threshold} />
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2">
        {tiles.map(([label, value, unit]) => (
          <div key={label} className={TILE}>
            <dt className="text-xs font-medium text-text-muted">{label}</dt>
            <dd>
              <Figure value={value} unit={unit} size="sm" />
            </dd>
          </div>
        ))}
      </dl>

      <QueryState
        query={readings}
        isEmpty={(list) => list.every((s) => s.points.length === 0)}
        emptyText={t('block.noReadings')}
        skeleton={<Skeleton block={260} />}
      >
        {(series) => (
          <div className="flex flex-col gap-3.5">
            <StaleBanner series={series} />
            <ul aria-label={t('rail.sensors')}>
              {sensors.map((sensor) => (
                <SensorRow
                  key={sensor.id}
                  sensor={sensor}
                  series={series.find((s) => s.sensorId === sensor.id)}
                />
              ))}
            </ul>
            <section
              aria-label={t('block.chartPanel')}
              className="rounded-md border border-border bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-medium text-text-muted">{t('block.chartPanel')}</h3>
                <Chip variant={CONFIDENCE_CHIP[d.confidence]}>
                  {t('rail.confidence', { level: t(`confidence.${d.confidence}`) })}
                </Chip>
              </div>
              <RailMoistureChart
                blockId={d.blockId}
                series={series}
                sensors={sensors}
                threshold={d.threshold}
                target={d.target}
                events={events.data ?? []}
              />
            </section>
          </div>
        )}
      </QueryState>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="flex items-center gap-2">
            <Chip variant={DECISION_CHIP[d.decision]}>{t(`decision.${d.decision}`)}</Chip>
            {d.volumeM3 > 0 ? <Figure value={d.volumeM3} unit="m³" size="sm" accent /> : null}
          </span>
          <span className="text-xs text-text-muted">
            {runs ? (
              <span className="num">{runs}</span>
            ) : (
              t('today.noIrrigationSaves', {
                m3: formatNumber(d.savedVsFixedM3, locale),
              })
            )}
          </span>
        </div>
        <Link
          to={`/blocks/${d.blockId}`}
          onClick={() => captureBlock(d.blockId)}
          className={buttonClasses({ variant: 'ink', arrow: true })}
        >
          {t('today.openBlock', { code: d.blockId })} <PillArrow variant="ink" />
        </Link>
      </div>
    </div>
  );
}

/** "Sensor · 30 cm — weight 0.6 · simulated — 70.4%", or when it went quiet if it is stale. */
function SensorRow({ sensor, series }: { sensor: Sensor; series: SensorSeries | undefined }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const latest = series?.points.at(-1);
  const stale = series?.stale ?? false;
  return (
    <li className={MROW}>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">
          {sensor.depthCm === null
            ? t('rail.substrateSensor')
            : t('rail.sensor', { depth: `${sensor.depthCm} cm` })}
        </span>
        <span className="text-xs text-text-muted">
          {stale && series
            ? t('rail.sensorStale', { since: formatTimeGst(series.lastAt, locale) })
            : t('rail.sensorWeight', { weight: formatNumber(sensor.weight, locale) })}
        </span>
      </span>
      {stale ? (
        <span className="text-sm font-medium text-warning">{t('rail.offline')}</span>
      ) : latest ? (
        <span className="num text-md text-text-primary">{formatPct(latest.paw, locale)}</span>
      ) : (
        <span className="text-sm text-text-secondary">{t('state.noData')}</span>
      )}
    </li>
  );
}
