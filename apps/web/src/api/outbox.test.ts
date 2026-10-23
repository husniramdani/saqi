import { describe, expect, it } from 'vitest';
import { createOutbox, OUTBOX_KEY, type OutboxAction, type SendResult } from './outbox';

const action = (id: string): OutboxAction => ({
  id,
  type: 'task.done',
  taskId: `task-${id}`,
  clientUpdatedAt: '2026-10-23T04:00:00.000Z',
  createdAt: '2026-10-23T05:00:00.000Z',
});

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe('outbox', () => {
  it('persists in order and survives a new instance (a reload)', () => {
    const storage = memoryStorage();
    const box = createOutbox(storage);
    box.enqueue(action('a'));
    box.enqueue(action('b'));
    expect(JSON.parse(storage.data.get(OUTBOX_KEY) ?? '[]')).toHaveLength(2);
    expect(
      createOutbox(storage)
        .list()
        .map((a) => a.id),
    ).toEqual(['a', 'b']);
  });

  it('flushes oldest first and empties the queue', async () => {
    const box = createOutbox(memoryStorage());
    box.enqueue(action('a'));
    box.enqueue(action('b'));
    const sent: string[] = [];
    const count = await box.flush(async (a) => {
      sent.push(a.id);
      return 'sent';
    });
    expect(sent).toEqual(['a', 'b']);
    expect(count).toBe(2);
    expect(box.list()).toEqual([]);
  });

  it('stops at the first network failure and keeps the rest', async () => {
    const box = createOutbox(memoryStorage());
    for (const id of ['a', 'b', 'c']) box.enqueue(action(id));
    const results: Record<string, SendResult> = { a: 'sent', b: 'stop', c: 'sent' };
    const tried: string[] = [];
    await box.flush(async (a) => {
      tried.push(a.id);
      return results[a.id] ?? 'stop';
    });
    expect(tried).toEqual(['a', 'b']);
    expect(box.list().map((a) => a.id)).toEqual(['b', 'c']);
  });

  it('drops an action the server rejected (409) and carries on', async () => {
    const box = createOutbox(memoryStorage());
    box.enqueue(action('a'));
    box.enqueue(action('b'));
    const count = await box.flush(async (a) => (a.id === 'a' ? 'dropped' : 'sent'));
    expect(count).toBe(2);
    expect(box.list()).toEqual([]);
  });

  it('runs one flush at a time, so nothing is sent twice', async () => {
    const box = createOutbox(memoryStorage());
    box.enqueue(action('a'));
    const sent: string[] = [];
    const send = async (a: OutboxAction): Promise<SendResult> => {
      sent.push(a.id);
      return 'sent';
    };
    await Promise.all([box.flush(send), box.flush(send)]);
    expect(sent).toEqual(['a']);
  });

  it('falls back to memory when storage throws (Safari private mode)', () => {
    const blocked = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    const box = createOutbox(blocked);
    box.enqueue(action('a'));
    box.enqueue(action('b'));
    expect(box.list().map((a) => a.id)).toEqual(['a', 'b']);
    box.remove('a');
    expect(box.list().map((a) => a.id)).toEqual(['b']);
  });
});
