import { ENGINE_VERSION } from '@saqi/engine';
import { gstDate } from '@saqi/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { useFarm, usePlanToday, useWeather } from '@/api/queries';
import { QueryError, QueryState } from '@/app/QueryState';
import { usePageTitle } from '@/app/usePageTitle';
import { BlockRail, byRisk, DecisionList } from '@/features/attention';
import { BudgetSection } from '@/features/budget/BudgetSection';
import { useCockpitIntro, useSelectionFade, useTabSwitch } from '@/features/cockpit/cockpitMotion';
import {
  DEFAULT_MAP_LAYERS,
  FarmMapPanel,
  MapLayersPanel,
  type MapLayers,
} from '@/features/farm-map';
import { SchedulePanel } from '@/features/schedule/SchedulePanel';
import { WeatherSection } from '@/features/weather/WeatherSection';
import { useLocale } from '@/i18n';
import { formatDateGst, formatM3, formatNumber } from '@/i18n/format';
import { loadMapPlugins, useMotion } from '@/motion';
import { Skeleton } from '@/ui';
import '@/features/cockpit/cockpit.css';

type TodayTab = 'plan' | 'layers' | 'water';

const TAB_ICON: Record<TodayTab, string> = {
  plan: 'M3 4h10M3 8h10M3 12h6',
  layers: 'M8 2l6 3-6 3-6-3zM2 8l6 3 6-3M2 11l6 3 6-3',
  water: 'M8 2C5.5 5.5 4 7.6 4 9.5a4 4 0 0 0 8 0C12 7.6 10.5 5.5 8 2z',
};

/** The header's Blocks / Schedule / Budget sections are places here; `#attention` is the plan. */
const HASH_TAB: Record<string, TodayTab> = { '#budget': 'water', '#attention': 'plan' };

/**
 * Today: the cockpit (design/dashboard.html). Blocks rail | map canvas with tonight's schedule
 * | tonight's plan, filling the viewport on desktop. One column at 1180 px and under.
 */
export function Component() {
  const { t } = useTranslation();
  const locale = useLocale();
  const farm = useFarm();
  const plan = usePlanToday();
  const weather = useWeather();
  usePageTitle(t('block.tonight'));
  const { hash, key: visit } = useLocation();
  // undefined: nobody picked yet (open the riskiest); null: the open row was closed.
  const [picked, setSelected] = useState<string | null | undefined>();
  const [tab, setTab] = useState<TodayTab>(HASH_TAB[hash] ?? 'plan');
  const [layers, setLayers] = useState<MapLayers>({ ...DEFAULT_MAP_LAYERS });
  const [zoom, setZoom] = useState(1);
  const root = useRef<HTMLDivElement>(null);
  const tabBody = useRef<HTMLDivElement>(null);
  const { reduced, forceReduced } = useMotion();

  // The map plugins (DrawSVG, Flip) load with Today, so the block Flip is ready by the first click.
  useEffect(() => {
    void loadMapPlugins();
  }, []);
  const p = plan.data;
  const f = farm.data;
  const ready = Boolean(p && f);
  const selected = picked === undefined && p ? byRisk(p.decisions)[0]?.blockId : picked;
  // Today's GST date even when the plan fails, so the heading never reads "Tonight ·".
  const date = formatDateGst(p?.date ?? gstDate(new Date()), locale);

  useCockpitIntro(root, ready, locale, forceReduced);
  useTabSwitch(tabBody, tab, locale, reduced);
  useSelectionFade(root, selected, reduced);

  // A section link (#blocks, #schedule, #budget, #attention) opens its view (on that
  // navigation, while rendering) and takes focus there once it exists: a frame later, so the
  // shell's route-change focus can't undo it.
  const [arrived, setArrived] = useState(visit);
  if (arrived !== visit) {
    setArrived(visit);
    const tabFor = HASH_TAB[hash];
    if (tabFor) setTab(tabFor);
  }
  const reached = useRef('');
  useEffect(() => {
    if (!hash || reached.current === visit) return;
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      reached.current = visit;
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [hash, visit, tab, ready]);

  const failed = (
    <div className="p-pad">
      <QueryError error={plan.error} onRetry={() => void plan.refetch()} />
    </div>
  );
  const loading = (
    <div className="p-pad">
      <Skeleton block={320} />
    </div>
  );

  const crumb = (
    <>
      <h1>{t('today.heading', { date })}</h1>
      {p ? (
        <>
          <span className="m vol">{formatM3(p.totals.tonightM3, locale)}</span>
          <span className="lbl">
            {t('today.saved', { volume: formatM3(p.totals.savedVsFixedM3, locale, 0) })}
          </span>
        </>
      ) : null}
    </>
  );

  const tabContent = () => {
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
            <BudgetSection budget={p.budget} decisions={p.decisions} />
          ) : (
            loading
          )}
          <QueryState
            query={weather}
            skeleton={
              <div className="p-pad">
                <Skeleton block={220} />
              </div>
            }
          >
            {(w) => <WeatherSection weather={w} />}
          </QueryState>
        </>
      );
    }
    if (plan.isError) return failed;
    if (!p || !f) return loading;
    return (
      <>
        <div className="rp-sum">
          <div>
            <span className="lbl">{t('today.plannedTonight')}</span>
            <span className="num">
              <span data-count={p.totals.tonightM3} data-digits="1">
                {formatNumber(p.totals.tonightM3, locale)}
              </span>
              <i>m³</i>
            </span>
          </div>
          <div>
            <span className="lbl">{t('today.savedVsFixed')}</span>
            <span className="num ok">
              <span data-count={p.totals.savedVsFixedM3} data-digits="0">
                {formatNumber(p.totals.savedVsFixedM3, locale, 0)}
              </span>
              <i>m³</i>
            </span>
          </div>
        </div>
        <h3 id="attention" tabIndex={-1} className="lbl sec-lbl">
          {t('today.decisionsCount', { count: p.decisions.length })}
        </h3>
        <DecisionList
          farm={f}
          decisions={p.decisions}
          schedule={p.schedule}
          selectedId={selected}
          onSelect={setSelected}
        />
      </>
    );
  };

  return (
    <div ref={root} className="ck">
      <aside id="blocks" tabIndex={-1} aria-label={t('today.blocks')} className="panel lp">
        <div className="p-head">
          <div className="p-head-t">
            <h2 className="p-title">{t('today.blocks')}</h2>
            {p ? (
              <span className="lbl">{t('today.blocksSub', { count: p.decisions.length })}</span>
            ) : null}
          </div>
          <span className="chip">{t('today.waterNow')}</span>
        </div>
        <div className="scroll">
          {plan.isError ? (
            failed
          ) : p && f ? (
            <BlockRail
              farm={f}
              decisions={p.decisions}
              selectedId={selected}
              onSelect={setSelected}
            />
          ) : (
            loading
          )}
        </div>
      </aside>

      <FarmMapPanel
        farm={farm}
        plan={plan}
        selectedId={selected ?? undefined}
        onSelect={setSelected}
        reveal
        crumb={crumb}
        schedule={p && f ? <SchedulePanel plan={p} farm={f} onSelect={setSelected} /> : null}
        layers={layers}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <aside aria-label={t('today.plan')} className="panel rp">
        <div className="p-head rp-head">
          <h2 className="p-title">{t('today.plan')}</h2>
          <span className="chip ok">
            <span aria-hidden="true" className="dot live" />
            {t('today.engine', { version: ENGINE_VERSION })}
          </span>
        </div>
        <div className="rtabs" role="group" aria-label={t('today.tabs.label')}>
          {(['plan', 'layers', 'water'] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={tab === key}
              aria-controls="today-panel"
              onClick={() => setTab(key)}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                <path d={TAB_ICON[key]} className="ic" />
              </svg>
              {t(`today.tabs.${key}`)}
            </button>
          ))}
        </div>
        <div
          ref={tabBody}
          id="today-panel"
          role="region"
          aria-label={t(`today.tabs.${tab}`)}
          className="scroll rp-body"
        >
          {tabContent()}
        </div>
      </aside>
    </div>
  );
}
