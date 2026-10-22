import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, Skeleton } from '@/ui';

interface Props<T> {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  emptyText?: string;
  /** Placeholder shown while loading; size it like the final content to avoid layout shift. */
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}

/** Loading, error (with retry) and empty for any query; panels add their own stale state. */
export function QueryState<T>({ query, isEmpty, emptyText, skeleton, children }: Props<T>) {
  const { t } = useTranslation();
  if (query.isPending) {
    return (
      <div role="status" aria-label={t('state.loading')}>
        {skeleton ?? <Skeleton block={48} />}
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState
        message={t('state.error', { message: query.error.message })}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (isEmpty?.(query.data)) return <EmptyState title={emptyText ?? t('state.empty')} />;
  return <>{children(query.data)}</>;
}
