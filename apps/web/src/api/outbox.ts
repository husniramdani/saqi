/** Field actions made offline wait here and replay in order when the connection returns. */
export interface OutboxAction {
  id: string;
  type: 'task.done';
  taskId: string;
  note?: string;
  clientUpdatedAt: string;
  createdAt: string;
}

export interface Outbox {
  enqueue(action: OutboxAction): void;
  list(): OutboxAction[];
  remove(id: string): void;
  /** Sends queued actions in order; stops at the first network failure. */
  flush(send: (action: OutboxAction) => Promise<void>): Promise<void>;
}

/** TODO(T17): localStorage queue (`saqi.outbox.v1`) with an in-memory fallback. */
export const noopOutbox: Outbox = {
  enqueue: () => undefined,
  list: () => [],
  remove: () => undefined,
  flush: async () => undefined,
};
