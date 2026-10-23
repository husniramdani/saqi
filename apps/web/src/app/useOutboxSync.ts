import { TaskSchema } from '@saqi/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError, apiPatch } from '@/api/client';
import { keys } from '@/api/keys';
import { outbox, useOutboxCount, type SendResult } from '@/api/outbox';
import { showToast } from './toast';

const RETRY_MS = 30_000;

/**
 * Replays the outbox in order when the connection returns, when the app regains focus, and every
 * 30 s while anything is queued. A 409 means someone else changed the task first: the server's
 * value wins, the action is dropped and the worker is told. Mounted once, in the app shell.
 */
export function useOutboxSync() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const count = useOutboxCount();

  const flush = useCallback(async () => {
    if (!navigator.onLine || outbox.list().length === 0) return;
    let conflicts = 0;
    const sent = await outbox.flush(async (action): Promise<SendResult> => {
      try {
        await apiPatch(`/api/tasks/${encodeURIComponent(action.taskId)}`, TaskSchema, {
          status: 'done',
          clientUpdatedAt: action.clientUpdatedAt,
          ...(action.note ? { note: action.note } : {}),
        });
        return 'sent';
      } catch (err) {
        if (err instanceof ApiError && err.code === 'NETWORK') return 'stop';
        if (err instanceof ApiError && err.status === 409) conflicts++;
        else showToast(t('field.syncFailed', { message: err instanceof Error ? err.message : '' }));
        return 'dropped';
      }
    });
    if (sent === 0) return;
    await queryClient.invalidateQueries({ queryKey: keys.tasks });
    showToast(conflicts > 0 ? t('field.conflict') : t('field.synced', { count: sent }));
  }, [queryClient, t]);

  useEffect(() => {
    void flush();
    const onChange = () => void flush();
    window.addEventListener('online', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener('online', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [flush]);

  useEffect(() => {
    if (count === 0) return;
    const id = setInterval(() => void flush(), RETRY_MS);
    return () => clearInterval(id);
  }, [count, flush]);
}
