import { tawMm, type Block, type Farm, type IrrigationEvent } from '@saqi/shared';
import type { ReadingRow } from '../repo/types';
import { gaussian } from './prng';

const HOUR_MS = 3_600_000;
const GST_OFFSET_H = 4;
export const DAYS = 30;
const HOURS = DAYS * 24;
const RAMP_HOURS = 48;
/** The 60 cm sensor sees the root zone about 6 h late, smoothed over ±3 h. */
const LAG_HOURS = 6;
const LAG_HALF_WINDOW = 3;
const NOISE = { shallow: 0.6, deep: 0.4 } as const;
const REFILL_HOUR = 22;
const PULSE_HOURS = [7, 11, 15];

/** Daytime crop-use weights by GST hour: a half sine over 06:00–18:00 that sums to 1. */
export const DIURNAL: number[] = (() => {
  const raw = Array.from({ length: 24 }, (_, h) =>
    h >= 6 && h < 18 ? Math.sin((Math.PI * (h - 6 + 0.5)) / 12) : 0,
  );
  const total = raw.reduce((a, b) => a + b, 0);
  return raw.map((w) => w / total);
})();

/** Water applied → m³: gross mm over the wetted share of the block (1 mm × 1 ha = 10 m³). */
export const irrigationVolumeM3 = (block: Block, netMm: number): number =>
  (netMm / block.efficiency) * block.areaHa * 10 * block.wettedFraction;

const clamp = (x: number) => Math.min(100, Math.max(0, x));
const round = (x: number, digits: number) => Math.round(x * 10 ** digits) / 10 ** digits;

export interface SimulateInput {
  farm: Farm;
  /** Daily ET₀, oldest first, at least 30 days. */
  et0Daily: number[];
  /** ISO hour the history ends on (inclusive). */
  anchor: string;
  /** PAW % each block's sensors land on at the anchor. */
  scenario: Record<string, number>;
  /** Sensors with no readings for the last N hours (e.g. a dead 60 cm probe). */
  gaps?: Record<string, number>;
  rng: () => number;
}

/**
 * 30 days of hourly sensor readings and irrigation events (plan/03 §4). Deterministic for a
 * given rng. The block water balance is simulated in PAW space; sensors then read it with noise,
 * and a final 48 h ramp lands every sensor exactly on the scenario value at the anchor.
 */
export function simulate(input: SimulateInput): {
  readings: ReadingRow[];
  events: IrrigationEvent[];
} {
  const { farm, et0Daily, scenario, gaps = {}, rng } = input;
  const anchorMs = Date.parse(input.anchor);
  const firstMs = anchorMs - (HOURS - 1) * HOUR_MS;
  const et0 = et0Daily.slice(-DAYS);
  const tsAt = (k: number) => new Date(firstMs + k * HOUR_MS).toISOString();
  const gstHour = (k: number) =>
    (new Date(firstMs + k * HOUR_MS).getUTCHours() + GST_OFFSET_H) % 24;

  const readings: ReadingRow[] = [];
  const events: IrrigationEvent[] = [];

  for (const block of farm.blocks) {
    const taw = tawMm(block);
    const addEvent = (k: number, netMm: number) => {
      const volumeM3 = irrigationVolumeM3(block, netMm);
      const startMs = firstMs + k * HOUR_MS;
      events.push({
        id: `sim-${block.id}-${k}`,
        blockId: block.id,
        startedAt: new Date(startMs).toISOString(),
        endedAt: new Date(startMs + (volumeM3 / block.flowM3h) * HOUR_MS).toISOString(),
        volumeM3: round(volumeM3, 1),
        status: 'done',
        source: 'auto',
      });
    };

    // 1. Water balance, hour by hour.
    const paw: number[] = [];
    let level = (block.pawThreshold + block.pawTarget) / 2;
    for (let k = 0; k < HOURS; k++) {
      const h = gstHour(k);
      const dayEt0 = et0[Math.min(DAYS - 1, Math.floor(k / 24))] ?? 0;
      const dailyEtcMm = block.kc * dayEt0 * block.et0Factor;
      level = clamp(level - ((dailyEtcMm * (DIURNAL[h] ?? 0)) / taw) * 100);

      if (block.mode === 'night' && h === REFILL_HOUR && level < block.pawThreshold) {
        const target = Math.min(100, block.pawTarget + (rng() * 6 - 3)); // refill to target ±3%
        addEvent(k, ((target - level) / 100) * taw);
        level = target;
      }
      if (block.mode === 'pulse' && PULSE_HOURS.includes(h)) {
        const refillMm = level < block.pawThreshold ? ((block.pawTarget - level) / 100) * taw : 0;
        const netMm = dailyEtcMm / PULSE_HOURS.length + refillMm;
        addEvent(k, netMm);
        level = clamp(level + (netMm / taw) * 100);
      }
      paw.push(level);
    }

    // 2. Sensors read the block with noise; the deep probe lags and smooths.
    for (const sensor of farm.sensors.filter((s) => s.blockId === block.id)) {
      const deep = sensor.depthCm !== null && sensor.depthCm >= 60;
      const values = paw.map((_, k) => {
        if (!deep) return (paw[k] ?? 0) + gaussian(rng) * NOISE.shallow;
        const from = Math.max(0, k - LAG_HOURS - LAG_HALF_WINDOW);
        const to = Math.max(0, k - LAG_HOURS + LAG_HALF_WINDOW);
        const window = paw.slice(from, to + 1);
        return window.reduce((a, b) => a + b, 0) / window.length + gaussian(rng) * NOISE.deep;
      });

      // 3. Ramp the last 48 h so the sensor lands exactly on the scenario value.
      const goal = scenario[block.id];
      if (goal !== undefined) {
        const offset = goal - (values[HOURS - 1] ?? goal);
        for (let i = 1; i <= RAMP_HOURS; i++) {
          const k = HOURS - RAMP_HOURS + i - 1;
          values[k] = (values[k] ?? 0) + (offset * i) / RAMP_HOURS;
        }
      }

      const silentFrom = HOURS - (gaps[sensor.id] ?? 0);
      for (let k = 0; k < silentFrom; k++) {
        const p = clamp(values[k] ?? 0);
        readings.push({
          sensorId: sensor.id,
          ts: tsAt(k),
          paw: round(p, 2),
          vwc: round(block.wp + (p / 100) * (block.fc - block.wp), 4),
        });
      }
    }
  }

  return { readings, events };
}
