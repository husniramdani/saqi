import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props<T> {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  emptyText?: string;
  children: (data: T) => ReactNode;
}

/**
 * Plain loading / error (with retry) / empty markup for any query.
 * TODO(T03/T20): Skeleton, ErrorState and EmptyState primitives replace this markup.
 */
export function QueryState<T>({ query, isEmpty, emptyText, children }: Props<T>) {
  const { t } = useTranslation();
  if (query.isPending) return <p role="status">{t('state.loading')}</p>;
  if (query.isError) {
    return (
      <div role="alert">
        <p>{t('state.error', { message: query.error.message })}</p>
        <button type="button" onClick={() => void query.refetch()}>
          {t('state.retry')}
        </button>
      </div>
    );
  }
  if (isEmpty?.(query.data)) return <p>{emptyText ?? t('state.empty')}</p>;
  return <>{children(query.data)}</>;
}
