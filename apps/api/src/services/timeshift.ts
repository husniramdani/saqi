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
