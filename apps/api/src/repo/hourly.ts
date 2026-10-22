import { gstDate, type IrrigationEvent, type Task } from '@saqi/shared';
import { buildSeed } from '../sim/seed';
import { createMemoryRepo } from './memory';
import type { Repo, SeedData } from './types';

const HOUR_MS = 3_600_000;

/**
 * Memory mode, live: the scenario is rebuilt for the current hour, so the history always ends
 * now and every past time is real wall-clock (night refills at 22:00 GST, pulses at 07/11/15).
 * No time-shift needed; `withTimeShift` sees a zero shift.
 *
 * What people did survives the hourly rebuild: manual irrigation logs (same ids) and task
 * updates for the same GST day. A new GST day starts with that day's tasks fresh.
 */
export function createHourlyMemoryRepo(
  now: () => Date,
  build: (anchor: string) => SeedData = (anchor) => buildSeed({ anchor }),
): Repo {
  let anchor = '';
  let inner: Repo | null = null;
  const manualEvents: IrrigationEvent[] = [];
  const taskUpdates = new Map<string, Task>(); // by task id, for its due date

  const current = (): Repo => {
    const hour = new Date(Math.floor(now().getTime() / HOUR_MS) * HOUR_MS).toISOString();
    if (inner && hour === anchor) return inner;
    anchor = hour;
    const seed = build(hour);
    const today = gstDate(hour);
    for (const [id, task] of taskUpdates) if (task.dueDate !== today) taskUpdates.delete(id);
    inner = createMemoryRepo({
      ...seed,
      events: [...seed.events, ...manualEvents],
      tasks: seed.tasks.map((t) => taskUpdates.get(t.id) ?? t),
    });
    return inner;
  };

  return {
    getFarm: () => current().getFarm(),
    getSeedAnchor: () => current().getSeedAnchor(),
    getReadings: (blockId, since) => current().getReadings(blockId, since),
    getLatestReadings: () => current().getLatestReadings(),
    getEvents: (blockId, since) => current().getEvents(blockId, since),
    addEvent: async (e) => {
      const added = await current().addEvent(e);
      manualEvents.push(added);
      return added;
    },
    getUsage: (since, until) => current().getUsage(since, until),
    getAllocation: (month) => current().getAllocation(month),
    getTasks: (q) => current().getTasks(q),
    updateTask: async (id, patch) => {
      const updated = await current().updateTask(id, patch);
      taskUpdates.set(id, updated);
      return updated;
    },
    getWeatherCache: (key) => current().getWeatherCache(key),
    setWeatherCache: (key, payload) => current().setWeatherCache(key, payload),
  };
}
