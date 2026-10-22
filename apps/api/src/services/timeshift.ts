import { gstDate, type SensorSeries, type Task } from '@saqi/shared';
import type { Repo } from '../repo/types';

/**
 * Simulated history is stored once, ending at a seed anchor hour. At request time every
 * timestamp is moved forward by `shiftMs` so the newest data always lands on the current hour.
 */
const HOUR_MS = 3_600_000;

export const floorHour = (instant: Date | string): number =>
  Math.floor(new Date(instant).getTime() / HOUR_MS) * HOUR_MS;

/** Milliseconds to add to stored (seed-time) timestamps: floorHour(now) − anchor. */
export const shiftMs = (now: Date | string, anchor: Date | string): number =>
  floorHour(now) - new Date(anchor).getTime();

/** Stored timestamp → what the API returns. */
export const shiftIso = (iso: string, ms: number): string =>
  new Date(Date.parse(iso) + ms).toISOString();

/** A real-time query bound → the stored (seed-time) bound. */
export const unshiftIso = (iso: string, ms: number): string => shiftIso(iso, -ms);

// ── The time-shifted view of a repo ──────────────────────────────────────────

const DAY_MS = 86_400_000;

/** Calendar-date arithmetic on YYYY-MM-DD. */
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export interface Shift {
  anchor: string;
  /** Milliseconds from stored (seed) time to real time. */
  ms: number;
  /** Whole GST days from the anchor's date to today: shifts task due dates. */
  days: number;
}

export function shiftFor(now: Date, anchor: string): Shift {
  const ms = shiftMs(now, anchor);
  const today = gstDate(new Date(Date.parse(anchor) + ms));
  return {
    anchor,
    ms,
    days: Math.round((Date.parse(today) - Date.parse(gstDate(anchor))) / DAY_MS),
  };
}

const shiftSeries = (s: SensorSeries, ms: number): SensorSeries => ({
  ...s,
  lastAt: shiftIso(s.lastAt, ms),
  points: s.points.map((p) => ({ ...p, t: shiftIso(p.t, ms) })),
});

const shiftEvent = <E extends { startedAt: string; endedAt: string }>(e: E, ms: number): E => ({
  ...e,
  startedAt: shiftIso(e.startedAt, ms),
  endedAt: shiftIso(e.endedAt, ms),
});

/**
 * The repo as the API serves it: the stored scenario replayed at the current hour.
 * Readings and irrigation events move by `ms` both ways (writes are stored in seed time, so a
 * manual log ages with the rest of the farm); task due dates move by whole days. A task's
 * `updatedAt` is a real version stamp and never moves: shifting it would jump every hour and
 * turn honest edits into 409 conflicts.
 */
export function withTimeShift(repo: Repo, now: () => Date): Repo {
  let anchor: Promise<string> | null = null;
  const shift = async () => {
    anchor ??= repo.getSeedAnchor();
    return shiftFor(now(), await anchor);
  };
  const shiftTask = (t: Task, days: number): Task => ({ ...t, dueDate: addDays(t.dueDate, days) });

  return {
    ...repo,
    getReadings: async (blockId, sinceIso) => {
      const { ms } = await shift();
      return (await repo.getReadings(blockId, unshiftIso(sinceIso, ms))).map((s) =>
        shiftSeries(s, ms),
      );
    },
    getLatestReadings: async () => {
      const { ms } = await shift();
      const latest = await repo.getLatestReadings();
      return Object.fromEntries(Object.entries(latest).map(([id, s]) => [id, shiftSeries(s, ms)]));
    },
    getEvents: async (blockId, sinceIso) => {
      const { ms } = await shift();
      return (await repo.getEvents(blockId, unshiftIso(sinceIso, ms))).map((e) =>
        shiftEvent(e, ms),
      );
    },
    addEvent: async (e) => {
      const { ms } = await shift();
      return shiftEvent(await repo.addEvent(shiftEvent(e, -ms)), ms);
    },
    getUsage: async (sinceIso, untilIso) => {
      const { ms } = await shift();
      return repo.getUsage(unshiftIso(sinceIso, ms), unshiftIso(untilIso, ms));
    },
    getTasks: async ({ date, assignee }) => {
      const { days } = await shift();
      const tasks = await repo.getTasks({ date: addDays(date, -days), assignee });
      return tasks.map((t) => shiftTask(t, days));
    },
    updateTask: async (id, patch) => {
      const { days } = await shift();
      return shiftTask(await repo.updateTask(id, patch), days);
    },
  };
}
