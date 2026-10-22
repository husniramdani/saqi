import type { Block } from '@saqi/shared';
import type { BlockPawInfo, WeightedSeries } from './types';

const HOUR_MS = 3_600_000;
export const STALE_AFTER_HOURS = 3;
/** 30 cm and 60 cm readings further apart than this lower confidence to medium. */
export const DISAGREEMENT_POINTS = 12;

/**
 * Block PAW = weighted mean of the latest reading of each fresh sensor, re-normalised
 * over the fresh ones (plan/04 §2.1).
 */
export function blockPaw(_block: Block, sensors: WeightedSeries[], now: string): BlockPawInfo {
  const nowMs = Date.parse(now);
  const fresh: { paw: number; weight: number }[] = [];
  const staleSensors: BlockPawInfo['staleSensors'] = [];

  for (const s of sensors) {
    const ageHours = (nowMs - Date.parse(s.lastAt)) / HOUR_MS;
    const last = s.points.at(-1);
    if (!last || ageHours > STALE_AFTER_HOURS) {
      staleSensors.push({ sensorId: s.sensorId, hours: Math.round(ageHours) });
    } else {
      fresh.push({ paw: last.paw, weight: s.weight });
    }
  }

  if (fresh.length === 0) return { paw: null, confidence: 'low', staleSensors };

  const totalWeight = fresh.reduce((sum, f) => sum + f.weight, 0);
  const paw = fresh.reduce((sum, f) => sum + f.paw * f.weight, 0) / totalWeight;
  const values = fresh.map((f) => f.paw);
  const spread = Math.max(...values) - Math.min(...values);

  const confidence =
    staleSensors.length > 0 ? 'low' : spread > DISAGREEMENT_POINTS ? 'medium' : 'high';
  return { paw, confidence, staleSensors };
}
