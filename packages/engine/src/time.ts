import { GST_OFFSET_MS } from '@saqi/shared';

// GST (Asia/Dubai) is a fixed UTC+4 with no DST, so no timezone library is needed.
export const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const MINUTE_MS = 60_000;

/** Epoch ms of a GST wall-clock time on a GST date. */
export const gstMs = (date: string, hhmm: string): number => Date.parse(`${date}T${hhmm}:00+04:00`);

/** Calendar date arithmetic on YYYY-MM-DD. */
export const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** ISO with a +04:00 offset, rounded to the minute (plan/04 §2.4, §2.5). */
export const toGstIso = (ms: number): string => {
  const minute = Math.round(ms / MINUTE_MS) * MINUTE_MS;
  return `${new Date(minute + GST_OFFSET_MS).toISOString().slice(0, 16)}:00+04:00`;
};

/** HH:mm in GST, for reason params. */
export const gstHhmm = (ms: number): string => toGstIso(ms).slice(11, 16);
