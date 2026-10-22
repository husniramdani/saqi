import { gstDate } from '@saqi/shared';
import { describe, expect, it, vi } from 'vitest';
import { buildSeed } from '../sim/seed';
import { createHourlyMemoryRepo } from './hourly';

const gstHour = (iso: string) => (new Date(iso).getUTCHours() + 4) % 24;

function setup(startIso: string) {
  let at = new Date(startIso);
  const build = vi.fn((anchor: string) => buildSeed({ anchor }));
  const repo = createHourlyMemoryRepo(() => at, build);
  return {
    repo,
    build,
    setNow: (iso: string) => {
      at = new Date(iso);
    },
  };
}

describe('hourly memory repo', () => {
  it('ends the history on the current hour, with no shift to apply', async () => {
    const { repo } = setup('2026-10-23T05:37:00Z'); // 09:37 GST, the email hour
    expect(await repo.getSeedAnchor()).toBe('2026-10-23T05:00:00.000Z');
    const latest = await repo.getLatestReadings();
    expect(latest['D-1-30']?.lastAt).toBe('2026-10-23T05:00:00.000Z');
  });

  it('keeps past irrigation on real wall-clock times whatever the hour', async () => {
    for (const now of ['2026-10-23T05:37:00Z', '2026-10-23T13:10:00Z']) {
      const { repo } = setup(now);
      const night = await repo.getEvents('D-1', '2026-10-01T00:00:00Z');
      const pulses = await repo.getEvents('G-1', '2026-10-20T00:00:00Z');
      expect(new Set(night.map((e) => gstHour(e.startedAt))), now).toEqual(new Set([22]));
      expect(new Set(pulses.map((e) => gstHour(e.startedAt))), now).toEqual(new Set([7, 11, 15]));
    }
  });

  it('builds once per hour and again when the hour turns', async () => {
    const s = setup('2026-10-23T05:05:00Z');
    await s.repo.getFarm();
    s.setNow('2026-10-23T05:59:00Z');
    await s.repo.getLatestReadings();
    expect(s.build).toHaveBeenCalledTimes(1);
    s.setNow('2026-10-23T06:00:00Z');
    expect(await s.repo.getSeedAnchor()).toBe('2026-10-23T06:00:00.000Z');
    expect(s.build).toHaveBeenCalledTimes(2);
  });

  it('keeps a task marked done across the hour, and a manual log with its id', async () => {
    const s = setup('2026-10-23T05:05:00Z');
    const [task] = await s.repo.getTasks({ date: '2026-10-23' });
    if (!task) throw new Error('no task');
    await s.repo.updateTask(task.id, { status: 'done', clientUpdatedAt: task.updatedAt });
    const logged = await s.repo.addEvent({
      blockId: 'D-2',
      startedAt: '2026-10-23T04:00:00.000Z',
      endedAt: '2026-10-23T05:00:00.000Z',
      volumeM3: 12,
      status: 'done',
      source: 'manual',
    });

    s.setNow('2026-10-23T07:30:00Z');
    const after = await s.repo.getTasks({ date: '2026-10-23' });
    expect(after.find((t) => t.id === task.id)?.status).toBe('done');
    const events = await s.repo.getEvents('D-2', '2026-10-23T00:00:00Z');
    expect(events.map((e) => e.id)).toContain(logged.id);
  });

  it('starts a new GST day with fresh tasks', async () => {
    const s = setup('2026-10-23T19:30:00Z'); // 23:30 GST
    const [task] = await s.repo.getTasks({ date: '2026-10-23' });
    if (!task) throw new Error('no task');
    await s.repo.updateTask(task.id, { status: 'done', clientUpdatedAt: task.updatedAt });

    s.setNow('2026-10-23T20:10:00Z'); // 00:10 GST, the next day
    const today = gstDate(new Date('2026-10-23T20:10:00Z'));
    const tasks = await s.repo.getTasks({ date: today });
    expect(today).toBe('2026-10-24');
    expect(tasks.every((t) => t.status === 'todo')).toBe(true);
  });
});
