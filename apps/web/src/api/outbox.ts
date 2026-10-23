import { useSyncExternalStore } from 'react';

/**
 * Field actions made without a connection wait here and replay in order when it returns
 * (plan/02 §3.2). Stored in localStorage under `saqi.outbox.v1`; every access is guarded, and
 * when storage is blocked (Safari private mode) the queue lives in memory for the visit.
 */
export interface OutboxAction {
  id: string;
  type: 'task.done';
  taskId: string;
  note?: string;
  clientUpdatedAt: string;
  createdAt: string;
}

/** What the sender did with one action: sent it, dropped it (e.g. a 409), or must stop (offline). */
export type SendResult = 'sent' | 'dropped' | 'stop';

export const OUTBOX_KEY = 'saqi.outbox.v1';

export interface Outbox {
  enqueue(action: OutboxAction): void;
  list(): OutboxAction[];
  remove(id: string): void;
  /** Sends queued actions oldest first; stops at the first 'stop'. Returns how many left the queue. */
  flush(send: (action: OutboxAction) => Promise<SendResult>): Promise<number>;
  /** True while a flush is running (the "Syncing…" banner). */
  isFlushing(): boolean;
  subscribe(onChange: () => void): () => void;
}

export function createOutbox(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeLocalStorage(),
): Outbox {
  let memory: OutboxAction[] = [];
  let snapshot: OutboxAction[] | null = null;
  const listeners = new Set<() => void>();

  const read = (): OutboxAction[] => {
    if (snapshot) return snapshot;
    try {
      const raw = storage?.getItem(OUTBOX_KEY);
      snapshot = raw ? (JSON.parse(raw) as OutboxAction[]) : memory;
    } catch {
      snapshot = memory;
    }
    return snapshot;
  };
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const write = (next: OutboxAction[]) => {
    memory = next;
    snapshot = next;
    try {
      storage?.setItem(OUTBOX_KEY, JSON.stringify(next));
    } catch {
      // Storage blocked or full: the queue survives in memory for this visit.
    }
    notify();
  };

  let flushing: Promise<number> | null = null;

  return {
    enqueue: (action) => write([...read(), action]),
    list: () => read(),
    remove: (id) => write(read().filter((a) => a.id !== id)),
    flush(send) {
      // One flush at a time, so the same action is never sent twice.
      if (flushing) return flushing;
      flushing = (async () => {
        let done = 0;
        try {
          for (const action of [...read()]) {
            const result = await send(action);
            if (result === 'stop') break;
            write(read().filter((a) => a.id !== action.id));
            done++;
          }
        } finally {
          flushing = null;
          notify();
        }
        return done;
      })();
      notify();
      return flushing;
    },
    isFlushing: () => flushing !== null,
    subscribe(onChange) {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
  };
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** The app's outbox. */
export const outbox = createOutbox();

// React bindings (stable snapshots for useSyncExternalStore).

export const useOutboxCount = () =>
  useSyncExternalStore(
    outbox.subscribe,
    () => outbox.list().length,
    () => 0,
  );
export const useOutboxSyncing = () =>
  useSyncExternalStore(
    outbox.subscribe,
    () => outbox.isFlushing(),
    () => false,
  );
/** Task ids with a queued "done": shown as done until the server agrees. */
export const useQueuedTaskIds = () =>
  new Set(
    useSyncExternalStore(
      outbox.subscribe,
      () => outbox.list(),
      () => [],
    ).map((a) => a.taskId),
  );
