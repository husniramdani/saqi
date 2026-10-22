import type { Farm, ScheduleItem } from '@saqi/shared';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** The night window for a plan date, in epoch ms (GST is a fixed UTC+4; the end crosses midnight). */
export function nightWindow(date: string, farm: Pick<Farm, 'nightWindow'>) {
  const start = Date.parse(`${date}T${farm.nightWindow.start}:00+04:00`);
  let end = Date.parse(`${date}T${farm.nightWindow.end}:00+04:00`);
  if (end <= start) end += DAY_MS;
  return { start, end, hours: Math.round((end - start) / HOUR_MS) };
}

/** A night run as shares of the window, 0–1, for the time track. */
export function barShare(
  item: Pick<ScheduleItem, 'start' | 'end'>,
  window: { start: number; end: number },
) {
  const span = window.end - window.start;
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  return {
    from: clamp((Date.parse(item.start) - window.start) / span),
    to: clamp((Date.parse(item.end) - window.start) / span),
  };
}
