import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
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
  if (query.isError) return <QueryError error={query.error} onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data)) return <EmptyState title={emptyText ?? t('state.empty')} />;
  return <>{children(query.data)}</>;
}

/**
 * A failed request in words a farm worker can act on: "can't reach Saqi" for no answer at all,
 * the server's own message otherwise. Retry refetches; the rest of the page stays usable.
 */
export function QueryError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation();
  const unreachable = error instanceof ApiError && error.code === 'NETWORK';
  return (
    <ErrorState
      message={
        unreachable ? t('state.unreachable') : t('state.error', { message: error?.message ?? '' })
      }
      onRetry={onRetry}
    />
  );
}
