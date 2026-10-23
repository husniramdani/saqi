import type { DayPlan, Farm } from '@saqi/shared';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { QueryError } from '@/app/QueryState';
import { EmptyState } from '@/ui';
import { FarmMap } from './FarmMap';
import { blockRect, VIEW, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './geometry';
import type { MapLayers } from './layers';
import { MapLegend } from './MapLegend';
import { OutboxStatus } from './OutboxStatus';

/** Loading: the plan's outlines, at the map's final size (no layout shift). */
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
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

/**
 * Today's centre canvas (design/dashboard.html `.map`): the site plan inset on a gridded ground,
 * the crumb (top start), the water scale (top end), zoom (inline end), the outbox status or the
 * forecast point (bottom start) and tonight's schedule card along the bottom. The Blocks rail is
 * the map's full text alternative.
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
  reveal = false,
}: {
  farm: UseQueryResult<Farm>;
  plan: UseQueryResult<DayPlan>;
  selectedId?: string | undefined;
  onSelect: (blockId: string) => void;
  /** Top-start card: Today's heading and totals. */
  crumb: ReactNode;
  /** Bottom card: tonight's schedule. */
  schedule?: ReactNode;
  layers: MapLayers;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Play the map's once-per-session draw-in. */
  reveal?: boolean;
}) {
  const { t } = useTranslation();
  const ready = farm.data && plan.data;
  const showMap = ready && plan.data.decisions.length > 0;

  const body = () => {
    if (farm.isError || plan.isError) {
      return (
        <div className="map-state">
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
        <div role="status" aria-label={t('state.loading')} className="map-fit">
          <MapSkeleton farm={farm.data} />
        </div>
      );
    }
    if (plan.data.decisions.length === 0) {
      return (
        <div className="map-state">
          <EmptyState title={t('today.empty')} />
        </div>
      );
    }
    return (
      <FarmMap
        farm={farm.data}
        decisions={plan.data.decisions}
        schedule={plan.data.schedule}
        selectedId={selectedId}
        onSelect={onSelect}
        reveal={reveal}
        layers={layers}
        zoom={zoom}
        variant="canvas"
      />
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
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d={plus ? 'M8 3v10M3 8h10' : 'M3 8h10'} className="ic" />
        </svg>
      </button>
    );
  };

  return (
    <section aria-label={t('today.mapLabel')} className="map" data-cockpit-map>
      <div className="map-svg">{body()}</div>

      <div className="map-top">
        <div className="glass crumb">{crumb}</div>
        {showMap ? <MapLegend /> : null}
      </div>

      {showMap ? (
        <>
          <div className="zoom">
            {zoomButton(true)}
            {zoomButton(false)}
            <span className="sr-only" aria-live="polite">
              {t('today.zoomLevel', { level: zoom })}
            </span>
          </div>
          <OutboxStatus />
        </>
      ) : null}

      {schedule}
    </section>
  );
}
