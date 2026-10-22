import type { WeightedSeries } from './types';

export const NOW = '2026-10-23T17:00:00.000Z'; // 21:00 GST
const HOUR_MS = 3_600_000;

/** A sensor series whose latest reading is `paw`, taken `ageHours` before NOW. */
export function series(
  sensorId: string,
  paw: number,
  { weight = 1, ageHours = 0, depthCm = null as number | null } = {},
): WeightedSeries {
  const lastAt = new Date(Date.parse(NOW) - ageHours * HOUR_MS).toISOString();
  return {
    sensorId,
    depthCm,
    weight,
    stale: ageHours > 3,
    lastAt,
    points: [{ t: lastAt, paw }],
  };
}

/** The two open-field sensors of a block: 30 cm (0.6) and 60 cm (0.4). */
export const pair = (blockId: string, paw30: number, paw60: number, age60 = 0) => [
  series(`${blockId}-30`, paw30, { weight: 0.6, depthCm: 30 }),
  series(`${blockId}-60`, paw60, { weight: 0.4, depthCm: 60, ageHours: age60 }),
];
