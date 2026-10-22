import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';

/** Epoch ms of the most recent successful fetch across all queries, or 0 before any. */
export function useLastUpdated(): number {
  const cache = useQueryClient().getQueryCache();
  const subscribe = useCallback((onChange: () => void) => cache.subscribe(onChange), [cache]);
  const snapshot = useCallback(
    () => cache.getAll().reduce((latest, q) => Math.max(latest, q.state.dataUpdatedAt), 0),
    [cache],
  );
  return useSyncExternalStore(subscribe, snapshot);
}
