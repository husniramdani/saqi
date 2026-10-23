import { gstDate, type SensorSeries } from '@saqi/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ApiError } from '@/api/client';
import {
  useEvents,
  useFarm,
  usePlanToday,
  useReadings,
  useRecommendation,
  useTasks,
} from '@/api/queries';
import { NotFound } from '@/app/NotFound';
import { usePageTitle } from '@/app/usePageTitle';
import { QueryState } from '@/app/QueryState';
import { MoistureChart } from '@/features/moisture-chart/MoistureChart';
import { EventsTable } from '@/features/recommendation/EventsTable';
import { LogIrrigation } from '@/features/recommendation/LogIrrigation';
import { RecommendationCard } from '@/features/recommendation/RecommendationCard';
import { BlockTasks } from '@/features/tasks/BlockTasks';
import { useLocale } from '@/i18n';
import { formatTimeGst } from '@/i18n/format';
import { duration, ease, getFlip, takeBlock, useGSAP, useMotion } from '@/motion';
import { Arrow, Chip, MoistureSwatch, Panel, Skeleton, textLinkClasses } from '@/ui';

/** "60 cm sensor offline since 12:00 GST…": stale sensors say so inside the chart panel. */
function StaleBanner({ series }: { series: SensorSeries[] }) {
  const { t } = useTranslation();
  const locale = useLocale();
  const stale = series.filter((s) => s.stale);
  if (stale.length === 0) return null;
  const depth = (s: SensorSeries) =>
    s.depthCm === null ? t('block.chart.substrate') : `${s.depthCm} cm`;
  const fresh = series.find((s) => !s.stale);
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-md bg-warning-soft p-3 text-sm text-text-primary"
    >
      <Chip variant="warn">{t('map.stale')}</Chip>
      <p className="pt-0.5">
        {fresh
          ? stale
              .map((s) =>
                t('block.staleBanner', {
                  sensor: depth(s),
                  since: formatTimeGst(s.lastAt, locale),
                  fresh: depth(fresh),
                }),
              )
              .join(' ')
          : t('block.allStale')}
      </p>
    </div>
  );
}

export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { blockId = '' } = useParams();
  const farm = useFarm();
  const plan = usePlanToday();
  const recommendation = useRecommendation(blockId);
  const readings = useReadings(blockId, 14);
  const events = useEvents(blockId, 30);
  const [today] = useState(() => gstDate(new Date()));
  const tasks = useTasks(today);
  const block = farm.data?.blocks.find((b) => b.id === blockId);
  const notFound = recommendation.error instanceof ApiError && recommendation.error.status === 404;
  usePageTitle(
    notFound ? t('state.notFound') : block ? `${block.id} ${block.name[locale]}` : blockId,
  );
  const swatch = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotion();
  // M5 · arriving from the map: the block's swatch morphs out of where the map block was.
  useGSAP(
    () => {
      const state = takeBlock(blockId);
      const Flip = getFlip();
      if (!state || !Flip || reduced || !swatch.current) return;
      Flip.from(state, {
        targets: swatch.current,
        duration: duration.settle,
        ease: ease.emphasized,
        absolute: true,
        scale: true,
      });
    },
    { dependencies: [blockId] },
  );
  const source = farm.data?.sources.find((s) => s.id === block?.sourceId);

  const back = (
    <Link to="/" className={`${textLinkClasses} gap-2 self-start`}>
      <span className="-scale-x-100 rtl:scale-x-100">
        <Arrow size={14} />
      </span>
      {t('block.back')}
    </Link>
  );

  if (notFound) {
    return <NotFound title={t('block.notFound')} />;
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      {back}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* The Flip target (T16): the map block's swatch morphs into this one. */}
          <span ref={swatch} data-flip-id={`block-${blockId}`} className="inline-flex">
            <MoistureSwatch paw={recommendation.data?.pawNow ?? null} size={32} />
          </span>
          <h1 className="flex items-baseline gap-3 text-3xl font-light tracking-[-0.035em] sm:text-4xl">
            <span className="num font-normal">{blockId}</span>
            <span>{block?.name[locale]}</span>
          </h1>
        </div>
        {block ? (
          <p className="text-text-secondary">
            {[
              t(`block.crop.${block.crop}`),
              // Cultivar names from the fixture; unknown ones show as recorded.
              t(`block.variety.${block.variety}`, { defaultValue: block.variety }),
              t('block.area', { ha: block.areaHa }),
              block.trees ? t('block.trees', { count: block.trees }) : null,
              t(`block.method.${block.method}`),
              source?.name[locale],
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Panel title={t('block.chartPanel')} meta="GST">
          <div className="flex flex-col gap-4">
            {readings.data ? <StaleBanner series={readings.data} /> : null}
            <QueryState
              query={readings}
              isEmpty={(s) => s.every((x) => x.points.length === 0)}
              emptyText={t('block.noReadings')}
              skeleton={<Skeleton block={300} />}
            >
              {(series) =>
                block ? (
                  <MoistureChart
                    series={series}
                    sensors={farm.data?.sensors.filter((s) => s.blockId === blockId) ?? []}
                    threshold={block.pawThreshold}
                    target={block.pawTarget}
                    events={events.data ?? []}
                  />
                ) : (
                  <Skeleton block={300} />
                )
              }
            </QueryState>
          </div>
        </Panel>

        <QueryState query={recommendation} skeleton={<Skeleton block={420} />}>
          {(d) => <RecommendationCard decision={d} schedule={plan.data?.schedule ?? []} />}
        </QueryState>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Panel title={t('block.events')}>
          <QueryState query={events} skeleton={<Skeleton block={200} />}>
            {(list) => <EventsTable events={list} />}
          </QueryState>
        </Panel>
        <Panel title={t('block.tasks', { code: blockId })}>
          <div className="flex flex-col gap-5">
            <QueryState query={tasks} skeleton={<Skeleton block={120} />}>
              {(list) => <BlockTasks tasks={list.filter((task) => task.blockId === blockId)} />}
            </QueryState>
            {block ? <LogIrrigation block={block} /> : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
