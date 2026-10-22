// GST (Asia/Dubai) is a fixed UTC+4 with no DST, so plain offset maths is exact.
export const GST_OFFSET_MS = 4 * 60 * 60 * 1000;

/** Calendar date (YYYY-MM-DD) in GST for an instant. */
export const gstDate = (instant: string | Date): string =>
  new Date(new Date(instant).getTime() + GST_OFFSET_MS).toISOString().slice(0, 10);
