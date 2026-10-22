import type { SensorSeries, Weather } from '@saqi/shared';
import { ConflictError, NotFoundError, type ReadingRow, type Repo, type SeedData } from './types';

const HOUR_MS = 3_600_000;
const STALE_AFTER_MS = 3 * HOUR_MS;

export function createMemoryRepo(seed: SeedData): Repo {
  const anchorMs = Date.parse(seed.anchor);
  const farm = structuredClone(seed.farm);
  const events = structuredClone(seed.events);
  const tasks = structuredClone(seed.tasks);
  const weatherCache = new Map<string, { payload: Weather; fetchedAt: string }>();

  const bySensor = new Map<string, ReadingRow[]>();
  for (const r of [...seed.readings].sort((a, b) => a.ts.localeCompare(b.ts))) {
    bySensor.set(r.sensorId, [...(bySensor.get(r.sensorId) ?? []), r]);
  }

  const series = (sensorId: string, sinceMs: number): SensorSeries | null => {
    const sensor = farm.sensors.find((s) => s.id === sensorId);
    const rows = bySensor.get(sensorId);
    const last = rows?.at(-1);
    if (!sensor || !rows || !last) return null;
    return {
      sensorId,
      depthCm: sensor.depthCm,
      stale: anchorMs - Date.parse(last.ts) > STALE_AFTER_MS,
      lastAt: last.ts,
      points: rows.filter((r) => Date.parse(r.ts) >= sinceMs).map((r) => ({ t: r.ts, paw: r.paw })),
    };
  };

  return {
    getFarm: async () => structuredClone(farm),

    getSeedAnchor: async () => seed.anchor,

    getReadings: async (blockId, sinceIso) =>
      farm.sensors
        .filter((s) => s.blockId === blockId)
        .flatMap((s) => series(s.id, Date.parse(sinceIso)) ?? []),

    getLatestReadings: async () => {
      const since = anchorMs - 48 * HOUR_MS;
      const out: Record<string, SensorSeries> = {};
      for (const s of farm.sensors) {
        const latest = series(s.id, since);
        if (latest) out[s.id] = latest;
      }
      return out;
    },

    getEvents: async (blockId, sinceIso) =>
      events
        .filter((e) => e.blockId === blockId && e.startedAt >= sinceIso)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .map((e) => ({ ...e })),

    addEvent: async (e) => {
      const event = { ...e, id: crypto.randomUUID() };
      events.push(event);
      return { ...event };
    },

    getUsage: async (sinceIso, untilIso) => {
      const [since, until] = [Date.parse(sinceIso), Date.parse(untilIso)];
      return events
        .filter((e) => e.status === 'done')
        .filter((e) => Date.parse(e.startedAt) >= since && Date.parse(e.startedAt) < until)
        .reduce((sum, e) => sum + e.volumeM3, 0);
    },

    getAllocation: async (month) => seed.allocations[month] ?? 0,

    getTasks: async ({ date, assignee }) =>
      tasks
        .filter((t) => t.dueDate === date && (!assignee || t.assignee === assignee))
        .map((t) => ({ ...t })),

    updateTask: async (id, patch) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) throw new NotFoundError(`Task ${id} not found`);
      if (Date.parse(patch.clientUpdatedAt) < Date.parse(task.updatedAt)) {
        throw new ConflictError(`Task ${id} was updated by someone else`, { current: { ...task } });
      }
      task.status = patch.status;
      if (patch.note !== undefined) task.note = patch.note;
      task.updatedAt = new Date().toISOString();
      return { ...task };
    },

    getWeatherCache: async (key) => structuredClone(weatherCache.get(key) ?? null),

    setWeatherCache: async (key, payload) => {
      weatherCache.set(key, { payload: structuredClone(payload), fetchedAt: payload.fetchedAt });
    },
  };
}
