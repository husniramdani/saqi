import { FarmSchema, gstDate, SensorSeriesSchema } from '@saqi/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { floorHour } from '../services/timeshift';
import { buildInlineSeed, createMemoryRepo } from './memory';
import { createPgRepo } from './pg';
import { ConflictError, type Repo } from './types';

const HOUR_MS = 3_600_000;
const anchor = new Date(floorHour(new Date()));
const anchorDate = gstDate(anchor);

/** One suite, every implementation: memory and pg must behave the same. */
function describeRepo(name: string, factory: () => Repo) {
  describe(`${name} repo contract`, () => {
    let repo: Repo;
    beforeEach(() => {
      repo = factory();
    });

    it('returns Farm 07', async () => {
      const farm = FarmSchema.parse(await repo.getFarm());
      expect(farm.blocks).toHaveLength(7);
    });

    it('returns readings per sensor since the bound', async () => {
      const since = new Date(anchor.getTime() - 6 * HOUR_MS).toISOString();
      const series = await repo.getReadings('D-1', since);
      expect(series.map((s) => s.sensorId).sort()).toEqual(['D-1-30', 'D-1-60']);
      for (const s of series) {
        SensorSeriesSchema.parse(s);
        expect(s.points.length).toBeGreaterThan(0);
        expect(s.points.every((p) => p.t >= since)).toBe(true);
      }
    });

    it('returns the latest series for every sensor', async () => {
      const latest = await repo.getLatestReadings();
      expect(Object.keys(latest)).toHaveLength(12);
      expect(latest['G-1-S']?.depthCm).toBeNull();
    });

    it('returns events for one block since the bound, newest first', async () => {
      const events = await repo.getEvents(
        'D-1',
        new Date(anchor.getTime() - 72 * HOUR_MS).toISOString(),
      );
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((e) => e.blockId === 'D-1')).toBe(true);
      expect(events.map((e) => e.startedAt)).toEqual(
        events
          .map((e) => e.startedAt)
          .sort()
          .reverse(),
      );
    });

    it('adds an event and gives it an id', async () => {
      const added = await repo.addEvent({
        blockId: 'D-2',
        startedAt: anchor.toISOString(),
        endedAt: anchor.toISOString(),
        volumeM3: 12,
        status: 'done',
        source: 'manual',
      });
      expect(added.id).toBeTruthy();
      expect((await repo.getEvents('D-2', anchor.toISOString())).map((e) => e.id)).toContain(
        added.id,
      );
    });

    it('sums only done events into month usage', async () => {
      const at = '2030-01-15T10:00:00.000Z';
      const base = { blockId: 'F-1', startedAt: at, endedAt: at, source: 'manual' } as const;
      await repo.addEvent({ ...base, volumeM3: 12.5, status: 'done' });
      await repo.addEvent({ ...base, volumeM3: 5, status: 'skipped' });
      expect(await repo.getMonthUsage('2030-01')).toBe(12.5);
    });

    it('returns the allocation for the seeded month', async () => {
      expect(await repo.getAllocation(anchorDate.slice(0, 7))).toBeGreaterThan(0);
    });

    it('filters tasks by date and assignee', async () => {
      const all = await repo.getTasks({ date: anchorDate });
      const rahim = await repo.getTasks({ date: anchorDate, assignee: 'rahim' });
      expect(all).toHaveLength(8);
      expect(rahim.length).toBeGreaterThan(0);
      expect(rahim.every((t) => t.assignee === 'rahim')).toBe(true);
      expect(await repo.getTasks({ date: '1999-01-01' })).toEqual([]);
    });

    it('updates a task and moves updatedAt forward', async () => {
      const [task] = await repo.getTasks({ date: anchorDate });
      if (!task) throw new Error('no task');
      const updated = await repo.updateTask(task.id, {
        status: 'done',
        note: 'ok',
        clientUpdatedAt: task.updatedAt,
      });
      expect(updated).toMatchObject({ status: 'done', note: 'ok' });
      expect(updated.updatedAt >= task.updatedAt).toBe(true);
    });

    it('rejects an update based on a stale copy', async () => {
      const [task] = await repo.getTasks({ date: anchorDate });
      if (!task) throw new Error('no task');
      const stale = new Date(Date.parse(task.updatedAt) - 1000).toISOString();
      await expect(
        repo.updateTask(task.id, { status: 'done', clientUpdatedAt: stale }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });
}

describeRepo('memory', () => createMemoryRepo(buildInlineSeed(anchor)));

// TODO(T07): seed the pg database with the same anchor before this suite runs.
describe.skipIf(!process.env.DATABASE_URL)('pg', () => {
  describeRepo('pg', () => createPgRepo());
});
