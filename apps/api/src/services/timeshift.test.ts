import { describe, expect, it } from 'vitest';
import { createMemoryRepo } from '../repo/memory';
import { buildSeed } from '../sim/seed';
import { floorHour, shiftFor, shiftIso, shiftMs, unshiftIso, withTimeShift } from './timeshift';

const anchor = '2026-10-23T17:00:00.000Z'; // 21:00 GST

describe('timeshift', () => {
  it('floors an instant to the start of its hour', () => {
    expect(new Date(floorHour('2026-10-25T10:37:12.345Z')).toISOString()).toBe(
      '2026-10-25T10:00:00.000Z',
    );
  });

  it('is zero inside the anchor hour', () => {
    expect(shiftMs('2026-10-23T17:59:59Z', anchor)).toBe(0);
  });

  it('shifts the anchor onto the current hour', () => {
    const ms = shiftMs('2026-10-25T10:37:00Z', anchor);
    expect(ms).toBe(41 * 3_600_000);
    expect(shiftIso(anchor, ms)).toBe('2026-10-25T10:00:00.000Z');
  });

  it('round-trips through unshift', () => {
    const ms = shiftMs('2026-11-02T08:00:00Z', anchor);
    const stored = '2026-10-20T03:00:00.000Z';
    expect(unshiftIso(shiftIso(stored, ms), ms)).toBe(stored);
  });
});

describe('shiftFor', () => {
  it.each([
    ['2026-10-23T19:30:00Z', 2, 0], // 23:30 GST the same evening
    ['2026-10-23T21:00:00Z', 4, 1], // 01:00 GST: the scenario's date is now tomorrow's
    ['2026-10-25T10:37:00Z', 41, 2],
  ])('now %s → %d h, %d days', (now, hours, days) => {
    expect(shiftFor(new Date(now), anchor)).toEqual({ anchor, ms: hours * 3_600_000, days });
  });
});

describe('withTimeShift: the scenario replayed at the current hour', () => {
  const NOW = new Date('2026-10-25T10:37:00Z'); // 41 h after the 21:00 GST anchor
  const stored = () => createMemoryRepo(buildSeed({ anchor }));
  const shifted = () => withTimeShift(stored(), () => NOW);

  it('ends every fresh sensor on the current hour, and keeps D-3’s 9 h gap', async () => {
    const latest = await shifted().getLatestReadings();
    expect(latest['D-1-30']?.lastAt).toBe('2026-10-25T10:00:00.000Z');
    expect(latest['D-1-30']?.points.at(-1)?.t).toBe('2026-10-25T10:00:00.000Z');
    expect(latest['D-3-60']?.lastAt).toBe('2026-10-25T01:00:00.000Z');
  });

  it('turns a real-time query bound into a stored one', async () => {
    const series = await shifted().getReadings('D-1', '2026-10-25T07:00:00.000Z');
    for (const s of series)
      expect(s.points.map((p) => p.t.slice(11, 13))).toEqual(['07', '08', '09', '10']);
  });

  it('serves the anchor day’s tasks as today’s, and leaves version stamps alone', async () => {
    const tasks = await shifted().getTasks({ date: '2026-10-25' });
    expect(tasks).toHaveLength(8);
    expect(new Set(tasks.map((t) => t.dueDate))).toEqual(new Set(['2026-10-25']));
    expect(tasks[0]?.updatedAt).toBe(anchor);
    expect(await shifted().getTasks({ date: '2026-10-23' })).toEqual([]);
  });

  it('round-trips a manual log at real time', async () => {
    const repo = shifted();
    const at = '2026-10-25T09:15:00.000Z';
    const added = await repo.addEvent({
      blockId: 'D-2',
      startedAt: at,
      endedAt: at,
      volumeM3: 12,
      status: 'done',
      source: 'manual',
    });
    expect(added.startedAt).toBe(at);
    const events = await repo.getEvents('D-2', '2026-10-25T09:00:00.000Z');
    expect(events.map((e) => e.startedAt)).toEqual([at]);
  });

  it('measures usage over the matching stored window', async () => {
    const raw = stored();
    const ms = 41 * 3_600_000;
    const since = '2026-10-20T00:00:00.000Z';
    expect(
      await withTimeShift(raw, () => NOW).getUsage(shiftIso(since, ms), NOW.toISOString()),
    ).toBe(await raw.getUsage(since, unshiftIso(NOW.toISOString(), ms)));
  });
});
