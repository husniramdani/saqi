import type { DayPlan, Farm } from '@saqi/shared';
import type { UseQueryResult } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/i18n';
import { EmptyState, ErrorState, Panel, SegmentedControl } from '@/ui';
import { BlockList } from './BlockList';
import { FarmMap } from './FarmMap';
import { blockRect, VIEW } from './geometry';
import { MapLegend } from './MapLegend';

/** Loading: the plan's outlines on a sand ground, at the map's final size (no layout shift). */
function MapSkeleton({ farm }: { farm?: Farm | undefined }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      className="block h-auto w-full"
      aria-hidden="true"
    >
      <rect width={VIEW.width} height={VIEW.height} fill="var(--color-surface-well)" />
      {farm?.blocks.map((b) => (
        <rect
          key={b.id}
          {...blockRect(b.geometry.points)}
          rx={10}
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

export function FarmMapPanel({
  farm,
  plan,
  selectedId,
  onSelect,
  header,
  footer,
  className,
}: {
  farm: UseQueryResult<Farm>;
  plan: UseQueryResult<DayPlan>;
  selectedId?: string | undefined;
  onSelect: (blockId: string) => void;
  /** Replaces the default title (Today puts its page heading here). */
  header?: ReactNode;
  /** Below the map and legend (Today puts tonight's schedule here). */
  footer?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  const locale = useLocale();
  const [view, setView] = useState<'map' | 'list'>('map');

  const body = () => {
    if (farm.isError || plan.isError) {
      return (
        <ErrorState
          message={t('state.error', { message: (farm.error ?? plan.error)?.message ?? '' })}
          onRetry={() => {
            if (farm.isError) void farm.refetch();
            if (plan.isError) void plan.refetch();
          }}
        />
      );
    }
    if (!farm.data || !plan.data) {
      return (
        <div role="status" aria-label={t('state.loading')}>
          <MapSkeleton farm={farm.data} />
        </div>
      );
    }
    if (plan.data.decisions.length === 0) return <EmptyState title={t('today.empty')} />;
    return view === 'map' ? (
      <FarmMap
        farm={farm.data}
        decisions={plan.data.decisions}
        schedule={plan.data.schedule}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    ) : (
      <BlockList
        farm={farm.data}
        decisions={plan.data.decisions}
        schedule={plan.data.schedule}
        onSelect={onSelect}
      />
    );
  };

  const viewSwitch = (
    <SegmentedControl
      label={t('map.view')}
      value={view}
      onChange={setView}
      options={[
        { value: 'map', label: t('map.map') },
        { value: 'list', label: t('map.list') },
      ]}
    />
  );

  return (
    <Panel
      className={className}
      {...(header ? {} : { title: farm.data?.name[locale] ?? t('map.title'), actions: viewSwitch })}
    >
      <div className="flex flex-col gap-4">
        {header ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            {header}
            {viewSwitch}
          </div>
        ) : null}
        {body()}
        {view === 'map' ? <MapLegend /> : null}
        {footer}
      </div>
    </Panel>
  );
}
