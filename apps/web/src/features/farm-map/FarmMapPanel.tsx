import type { DayPlan, Farm } from '@saqi/shared';
import type { UseQueryResult } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryError } from '@/app/QueryState';
import { cx, EmptyState, SegmentedControl } from '@/ui';
import { BlockList } from './BlockList';
import { FarmMap } from './FarmMap';
import { blockRect, VIEW, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './geometry';
import type { MapLayers } from './layers';
import { MapLegend } from './MapLegend';
import { OutboxStatus } from './OutboxStatus';

/** Solid overlay surface for chips floating on the map (design.md: no glass blur). */
const overlay = 'rounded-md border border-border bg-overlay shadow-floating';

/** Loading: the plan's outlines on the map ground, at the map's final size (no layout shift). */
function MapSkeleton({ farm }: { farm?: Farm | undefined }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="block h-auto w-full"
      aria-hidden="true"
    >
      {farm?.blocks.map((b) => (
        <rect
          key={b.id}
          {...blockRect(b.geometry.points)}
          rx={10}
          fill="var(--color-surface-well)"
          stroke="var(--color-border-strong)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

function ZoomIcon({ plus }: { plus: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={plus ? 'M8 3v10M3 8h10' : 'M3 8h10'}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Today's centre canvas (Nightfield dashboard): the map fills the space between a top row
 * (crumb, legend, map/list switch) and tonight's schedule card. Zoom sits at the inline end,
 * the outbox / coordinates chip at the inline start. On desktop the map fits both the width and
 * the height of the canvas (container units); below 1180 px it keeps its aspect ratio in flow.
 */
export function FarmMapPanel({
  farm,
  plan,
  selectedId,
  onSelect,
  crumb,
  schedule,
  layers,
  zoom,
  onZoomChange,
  className,
  reveal = false,
}: {
  farm: UseQueryResult<Farm>;
  plan: UseQueryResult<DayPlan>;
  selectedId?: string | undefined;
  onSelect: (blockId: string) => void;
  /** Top-start chip: Today's heading and totals. */
  crumb: ReactNode;
  /** Bottom card: tonight's schedule. */
  schedule?: ReactNode;
  layers: MapLayers;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  className?: string;
  /** Play the map's once-per-session draw-in. */
  reveal?: boolean;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<'map' | 'list'>('map');
  const ready = farm.data && plan.data;
  const showMap = view === 'map' && ready && plan.data.decisions.length > 0;

  // Desktop: a size container, so the map can fit min(width, height × aspect).
  const stage =
    'relative flex w-full items-center justify-center min-[1180px]:min-h-0 min-[1180px]:flex-1 min-[1180px]:px-12 min-[1180px]:[container-type:size]';
  const fit = 'w-full min-[1180px]:w-[min(100cqw,calc(100cqh*1000/620))]';

  const body = () => {
    if (farm.isError || plan.isError) {
      return (
        <div className="w-full rounded-md bg-surface p-4">
          <QueryError
            error={farm.error ?? plan.error}
            onRetry={() => {
              if (farm.isError) void farm.refetch();
              if (plan.isError) void plan.refetch();
            }}
          />
        </div>
      );
    }
    if (!ready) {
      return (
        <div role="status" aria-label={t('state.loading')} className={fit}>
          <MapSkeleton farm={farm.data} />
        </div>
      );
    }
    if (plan.data.decisions.length === 0) {
      return (
        <div className="w-full rounded-md bg-surface p-4">
          <EmptyState title={t('today.empty')} />
        </div>
      );
    }
    if (view === 'list') {
      return (
        <div className="w-full self-stretch overflow-y-auto rounded-md bg-surface p-3 min-[1180px]:absolute min-[1180px]:inset-0">
          <BlockList
            farm={farm.data}
            decisions={plan.data.decisions}
            schedule={plan.data.schedule}
            onSelect={onSelect}
          />
        </div>
      );
    }
    return (
      <div className={fit}>
        <FarmMap
          farm={farm.data}
          decisions={plan.data.decisions}
          schedule={plan.data.schedule}
          selectedId={selectedId}
          onSelect={onSelect}
          reveal={reveal}
          layers={layers}
          zoom={zoom}
        />
      </div>
    );
  };

  const zoomButton = (plus: boolean) => {
    const next = zoom + (plus ? ZOOM_STEP : -ZOOM_STEP);
    return (
      <button
        type="button"
        aria-label={t(plus ? 'today.zoomIn' : 'today.zoomOut')}
        disabled={plus ? zoom >= ZOOM_MAX : zoom <= ZOOM_MIN}
        onClick={() => onZoomChange(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)))}
        className={cx(
          overlay,
          'grid size-11 place-items-center text-text-primary hover:bg-surface-raised disabled:text-text-muted disabled:hover:bg-overlay',
        )}
      >
        <ZoomIcon plus={plus} />
      </button>
    );
  };

  return (
    <section
      aria-label={t('today.mapLabel')}
      className={cx(
        'flex flex-col gap-3 overflow-hidden rounded-lg border border-border bg-map p-3 shadow-raised',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2.5">
        <div className={cx(overlay, 'flex min-h-11 items-center px-3.5 py-2')}>{crumb}</div>
        <div className="flex flex-wrap items-center gap-2.5">
          {showMap ? (
            <div className={cx(overlay, 'hidden min-h-11 items-center px-3.5 py-2 sm:flex')}>
              <MapLegend />
            </div>
          ) : null}
          <SegmentedControl
            label={t('map.view')}
            value={view}
            onChange={setView}
            options={[
              { value: 'map', label: t('map.map') },
              { value: 'list', label: t('map.list') },
            ]}
          />
        </div>
      </div>

      <div className={stage}>
        {body()}
        {showMap ? (
          <>
            <div className="absolute end-0 top-1/2 flex -translate-y-1/2 flex-col gap-1">
              {zoomButton(true)}
              {zoomButton(false)}
              <span className="sr-only" aria-live="polite">
                {t('today.zoomLevel', { level: zoom })}
              </span>
            </div>
            <div className="absolute start-0 bottom-0 hidden sm:block">
              <OutboxStatus />
            </div>
          </>
        ) : null}
      </div>

      {schedule}
    </section>
  );
}
