import { gstDate } from '@saqi/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFarm, usePlanToday, useWeather } from '@/api/queries';
import { QueryError, QueryState } from '@/app/QueryState';
import { usePageTitle } from '@/app/usePageTitle';
import { BlockRail, byRisk, DecisionList } from '@/features/attention';
import { BudgetSection } from '@/features/budget/BudgetSection';
import { FarmMapPanel } from '@/features/farm-map';
import { SchedulePanel } from '@/features/schedule/SchedulePanel';
import { WeatherSection } from '@/features/weather/WeatherSection';
import { useLocale } from '@/i18n';
import { loadMapPlugins } from '@/motion';
import { formatDateGst } from '@/i18n/format';
import { Figure, SegmentedControl, Skeleton } from '@/ui';

const panel = 'rounded-lg border border-border bg-surface shadow-raised';

/**
 * Today: the Nightfield dashboard. Blocks rail | map with tonight's schedule | tonight's plan.
 * One column under 1180 px: map first, then the plan, then the rail.
 */
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();
  const plan = usePlanToday();
  const weather = useWeather();
  usePageTitle(t('block.tonight'));
  const [picked, setSelected] = useState<string | undefined>();
  const [tab, setTab] = useState<'plan' | 'water'>('plan');

  // The map plugins (DrawSVG, Flip) load with Today, so the block Flip is ready by the first click.
  useEffect(() => {
    void loadMapPlugins();
  }, []);
  const p = plan.data;
  // Until someone picks, open on the riskiest block, as the canvas does.
  const selected = picked ?? (p ? byRisk(p.decisions)[0]?.blockId : undefined);
  const f = farm.data;
  // Today's GST date even when the plan fails, so the heading never reads "Tonight ·".
  const date = formatDateGst(p?.date ?? gstDate(new Date()), locale);

  const header = (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
      <h1 className="text-2xl font-light tracking-[-0.03em]">{t('today.heading', { date })}</h1>
      {p ? (
        <div className="flex items-end gap-6">
          <Figure value={p.totals.tonightM3} unit="m³" size="md" accent />
          <span className="text-sm text-success">
            <Figure
              value={p.totals.savedVsFixedM3}
              unit="m³"
              precision={0}
              size="sm"
              className="text-success"
            />{' '}
            {t('today.savedVsFixed').toLowerCase()}
          </span>
        </div>
      ) : null}
    </div>
  );

  const loading = <Skeleton block={320} className="m-4" />;
  const failed = (
    <div className="p-4">
      <QueryError error={plan.error} onRetry={() => void plan.refetch()} />
    </div>
  );

  // Explicit minmax(0,1fr): an implicit grid column would grow to its widest content (tables).
  // reading-flow: under 1180 px the panels are reordered with `order` (map, plan, rail); this
  // makes Tab follow that visual order too (Chromium 137+; elsewhere Tab keeps DOM order).
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 pt-2 [reading-flow:grid-order] min-[1180px]:grid-cols-[330px_minmax(0,1fr)_340px] min-[1180px]:items-start">
      <aside
        aria-label={t('today.blocks')}
        className={`${panel} order-3 overflow-hidden min-[1180px]:order-none`}
      >
        <div className="flex items-end justify-between gap-3 border-b border-border px-4 pt-4 pb-3">
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
      </aside>

      <FarmMapPanel
        className="order-1 min-[1180px]:order-none"
        farm={farm}
        plan={plan}
        selectedId={selected}
        onSelect={setSelected}
        reveal
        header={header}
        footer={p && f ? <SchedulePanel plan={p} farm={f} onSelect={setSelected} /> : null}
      />

      <aside
        aria-label={t('today.plan')}
        className={`${panel} order-2 overflow-hidden min-[1180px]:order-none`}
      >
        <div className="flex flex-col gap-3 border-b border-border px-4 pt-4 pb-3">
          <h2 className="text-md font-semibold">{t('today.plan')}</h2>
          <SegmentedControl
            label={t('today.tabs.label')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'plan', label: t('today.tabs.plan') },
              { value: 'water', label: t('today.tabs.water') },
            ]}
          />
        </div>
        <div role="tabpanel" aria-label={t(`today.tabs.${tab}`)} className="p-4">
          {tab === 'plan' ? (
            plan.isError ? (
              failed
            ) : p && f ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-raised p-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-muted">
                      {t('today.plannedTonight')}
                    </span>
                    <Figure value={p.totals.tonightM3} unit="m³" size="md" accent />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-muted">
                      {t('today.savedVsFixed')}
                    </span>
                    <Figure
                      value={p.totals.savedVsFixedM3}
                      unit="m³"
                      precision={0}
                      size="md"
                      className="text-success"
                    />
                  </div>
                </div>
                <h3 id="attention" className="scroll-mt-4 text-xs font-medium text-text-muted">
                  {t('today.decisionsCount', { count: p.decisions.length })}
                </h3>
                <DecisionList
                  farm={f}
                  decisions={p.decisions}
                  schedule={p.schedule}
                  selectedId={selected}
                  onSelect={setSelected}
                />
              </div>
            ) : (
              loading
            )
          ) : (
            <div className="flex flex-col gap-6">
              {plan.isError ? (
                failed
              ) : p ? (
                <BudgetSection budget={p.budget} decisions={p.decisions} />
              ) : (
                loading
              )}
              <QueryState query={weather} skeleton={<Skeleton block={220} />}>
                {(w) => <WeatherSection weather={w} />}
              </QueryState>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
