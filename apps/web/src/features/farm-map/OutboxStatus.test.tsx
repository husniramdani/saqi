import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { outbox, type OutboxAction, type SendResult } from '@/api/outbox';
import { OutboxStatus } from './OutboxStatus';

const action = (id: string, createdAt: string): OutboxAction => ({
  id,
  type: 'task.done',
  taskId: `task-${id}`,
  clientUpdatedAt: createdAt,
  createdAt,
});

const status = () => screen.getByRole('status').textContent;

afterEach(() => {
  act(() => {
    for (const a of outbox.list()) outbox.remove(a.id);
  });
});

describe('OutboxStatus', () => {
  it('shows the forecast point when nothing is queued', () => {
    render(<OutboxStatus />);
    expect(status()).toBe('24.21 N · 55.74 E · Open-Meteo point');
  });

  it('counts the queued Field updates and when the oldest was queued, in GST', () => {
    outbox.enqueue(action('b', '2026-10-23T06:30:00.000Z'));
    outbox.enqueue(action('a', '2026-10-23T05:00:00.000Z'));
    render(<OutboxStatus />);
    expect(status()).toContain('2 field updates waiting to sync');
    expect(status()).toContain('Saved on this phone · queued 09:00');
  });

  it('says it is syncing while the queue flushes, then returns to the point', async () => {
    outbox.enqueue(action('a', '2026-10-23T05:00:00.000Z'));
    render(<OutboxStatus />);
    let send: (result: SendResult) => void = () => undefined;
    let flushed: Promise<number> = Promise.resolve(0);
    act(() => {
      flushed = outbox.flush(() => new Promise<SendResult>((resolve) => (send = resolve)));
    });
    expect(status()).toContain('Syncing…');
    await act(async () => {
      send('sent');
      await flushed;
    });
    expect(status()).toBe('24.21 N · 55.74 E · Open-Meteo point');
  });

  it('stays dismissed for the same queue and comes back when the queue changes', () => {
    outbox.enqueue(action('a', '2026-10-23T05:00:00.000Z'));
    outbox.enqueue(action('b', '2026-10-23T06:00:00.000Z'));
    const { rerender } = render(<OutboxStatus />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(status()).toBe('24.21 N · 55.74 E · Open-Meteo point');
    rerender(<OutboxStatus />);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

    // Same count, different actions: the status returns.
    act(() => {
      outbox.remove('b');
      outbox.enqueue(action('c', '2026-10-23T07:00:00.000Z'));
    });
    expect(status()).toContain('2 field updates waiting to sync');
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeDefined();
  });
});
