import { gstDate } from '@saqi/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFarm, usePlanToday, useWeather } from '@/api/queries';
import { QueryError, QueryState } from '@/app/QueryState';
import { usePageTitle } from '@/app/usePageTitle';
import { BlockRail, byRisk, DecisionList } from '@/features/attention';
import { BudgetSection } from '@/features/budget/BudgetSection';
import {
  DEFAULT_MAP_LAYERS,
  FarmMapPanel,
  MapLayersPanel,
  type MapLayers,
} from '@/features/farm-map';
import { SchedulePanel } from '@/features/schedule/SchedulePanel';
import { WeatherSection } from '@/features/weather/WeatherSection';
import { useLocale } from '@/i18n';
import { formatDateGst, formatM3, formatTimeGst } from '@/i18n/format';
import {
  duration,
  ease,
  fadeUpStagger,
  gsap,
  loadMapPlugins,
  stagger,
  useGSAP,
  useMotion,
  withMotion,
} from '@/motion';
import { Chip, cx, Figure, SegmentedControl, Skeleton } from '@/ui';

type TodayTab = 'plan' | 'layers' | 'water';

const panel =
  'flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-raised min-[1180px]:min-h-0';
/** Side panels scroll inside themselves on desktop; the page itself never scrolls there. */
const scrollBody = 'min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:overflow-y-auto';

/**
 * Today: the Nightfield cockpit. Blocks rail | map canvas with tonight's schedule | tonight's
 * plan, filling the viewport on desktop. One column under 1180 px: map, then plan, then rail.
 */
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();
  const plan = usePlanToday();
  const weather = useWeather();
  usePageTitle(t('block.tonight'));
  const [picked, setSelected] = useState<string | undefined>();
  const [tab, setTab] = useState<TodayTab>('plan');
  const [layers, setLayers] = useState<MapLayers>({ ...DEFAULT_MAP_LAYERS });
  const [zoom, setZoom] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const tabPanel = useRef<HTMLDivElement>(null);
  const { reduced, forceReduced } = useMotion();

  // The map plugins (DrawSVG, Flip) load with Today, so the block Flip is ready by the first click.
  useEffect(() => {
    void loadMapPlugins();
  }, []);
  const p = plan.data;
  const f = farm.data;
  const ready = Boolean(p && f);
  // Until someone picks, open on the riskiest block, as the canvas does.
  const selected = picked ?? (p ? byRisk(p.decisions)[0]?.blockId : undefined);
  // Today's GST date even when the plan fails, so the heading never reads "Tonight ·".
  const date = formatDateGst(p?.date ?? gstDate(new Date()), locale);

  // Entrance: the three panels settle in once the plan arrives. The map's own draw-in,
  // the schedule bars and the counters keep their own motion.
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !ready) return;
      return withMotion(
        () => {
          gsap.from(el.querySelectorAll('[data-cockpit-panel]'), {
            opacity: 0,
            y: 10,
            duration: duration.settle,
            ease: ease.reveal,
            stagger: stagger.list,
            clearProps: 'transform,opacity',
          });
        },
        () => undefined,
        forceReduced,
      );
    },
    { scope: root, dependencies: [ready, forceReduced] },
  );

  // Switching the right panel's view: its content rises in, row by row.
  useGSAP(
    () => {
      const el = tabPanel.current;
      if (!el) return;
      fadeUpStagger(el.children, { reduced });
    },
    { scope: tabPanel, dependencies: [tab], revertOnUpdate: true },
  );

  const crumb = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 className="text-md font-semibold">{t('today.heading', { date })}</h1>
      {p ? (
        <>
          <Figure value={p.totals.tonightM3} unit="m³" size="sm" accent />
          <span className="text-xs text-text-secondary">
            {t('today.saved', { volume: formatM3(p.totals.savedVsFixedM3, locale) })}
          </span>
        </>
      ) : null}
    </div>
  );

  const loading = <Skeleton block={320} className="m-4" />;
  const failed = (
    <div className="p-4">
      <QueryError error={plan.error} onRetry={() => void plan.refetch()} />
    </div>
  );

  const tabBody = () => {
    if (tab === 'layers') {
      return (
        <MapLayersPanel
          layers={layers}
          onToggle={(key) => setLayers((current) => ({ ...current, [key]: !current[key] }))}
        />
      );
    }
    if (tab === 'water') {
      return (
        <>
          {plan.isError ? (
            failed
          ) : p ? (
            <div className="p-4">
              <BudgetSection budget={p.budget} decisions={p.decisions} />
            </div>
          ) : (
            loading
          )}
          <div className="p-4">
            <QueryState query={weather} skeleton={<Skeleton block={220} />}>
              {(w) => <WeatherSection weather={w} />}
            </QueryState>
          </div>
        </>
      );
    }
    if (plan.isError) return failed;
    if (!p || !f) return loading;
    return (
      <>
        <div className="mx-4 mt-3 grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-raised p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">{t('today.plannedTonight')}</span>
            <Figure value={p.totals.tonightM3} unit="m³" size="md" accent />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-text-muted">{t('today.savedVsFixed')}</span>
            <Figure
              value={p.totals.savedVsFixedM3}
              unit="m³"
              precision={0}
              size="md"
              className="text-success"
            />
          </div>
        </div>
        <h3
          id="attention"
          className="scroll-mt-4 px-4 pt-4 pb-2 text-xs font-medium text-text-muted"
        >
          {t('today.decisionsCount', { count: p.decisions.length })}
        </h3>
        <div className="px-2">
          <DecisionList
            farm={f}
            decisions={p.decisions}
            schedule={p.schedule}
            selectedId={selected}
            onSelect={setSelected}
          />
        </div>
      </>
    );
  };

  // Explicit minmax(0,1fr): an implicit grid column would grow to its widest content (tables).
  // reading-flow: under 1180 px the panels are reordered with `order` (map, plan, rail); this
  // makes Tab follow that visual order too (Chromium 137+; elsewhere Tab keeps DOM order).
  return (
    <div
      ref={root}
      className="grid grid-cols-[minmax(0,1fr)] gap-3 [reading-flow:grid-order] min-[1180px]:h-full min-[1180px]:grid-cols-[330px_minmax(0,1fr)_340px] min-[1180px]:gap-2.5"
    >
      <aside
        data-cockpit-panel
        aria-label={t('today.blocks')}
        className={cx(panel, 'order-3 min-[1180px]:order-none')}
      >
        <div className="flex shrink-0 items-end justify-between gap-3 border-b border-border px-4 pt-4 pb-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-md font-semibold">{t('today.blocks')}</h2>
            {p ? (
              <span className="text-xs text-text-muted">
                {t('today.blocksSub', { count: p.decisions.length })}
              </span>
            ) : null}
          </div>
          <span className="text-xs text-text-muted">{t('today.waterNow')}</span>
        </div>
        <div className={scrollBody}>
          {plan.isError ? (
            failed
          ) : p && f ? (
            <BlockRail
              farm={f}
              decisions={p.decisions}
              schedule={p.schedule}
              selectedId={selected}
              onSelect={setSelected}
            />
          ) : (
            loading
          )}
        </div>
      </aside>

      <div data-cockpit-panel className="order-1 flex min-[1180px]:order-none min-[1180px]:min-h-0">
        <FarmMapPanel
          className="w-full"
          farm={farm}
          plan={plan}
          selectedId={selected}
          onSelect={setSelected}
          reveal
          crumb={crumb}
          schedule={p && f ? <SchedulePanel plan={p} farm={f} onSelect={setSelected} /> : null}
          layers={layers}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>

      <aside
        data-cockpit-panel
        aria-label={t('today.plan')}
        className={cx(panel, 'order-2 min-[1180px]:order-none')}
      >
        <div className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-md font-semibold">{t('today.plan')}</h2>
            {p ? (
              <Chip variant="ok">
                {t('today.plannedAt', { time: formatTimeGst(p.generatedAt, locale) })}
              </Chip>
            ) : null}
          </div>
          <SegmentedControl
            label={t('today.tabs.label')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'plan', label: t('today.tabs.plan') },
              { value: 'layers', label: t('today.tabs.layers') },
              { value: 'water', label: t('today.tabs.water') },
            ]}
          />
        </div>
        <div
          ref={tabPanel}
          role="tabpanel"
          aria-label={t(`today.tabs.${tab}`)}
          className={cx('border-t border-border pb-4', scrollBody)}
        >
          {tabBody()}
        </div>
      </aside>
    </div>
  );
}
