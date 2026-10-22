import { createHash } from 'node:crypto';
import { blockPaw, planDay } from '@saqi/engine';
import { blockById, farm07, sensorsForBlock } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { createMemoryRepo } from '../repo/memory';
import { gaussian, mulberry32 } from './prng';
import {
  buildSeed,
  GAPS,
  latestAnchor,
  monthProjection,
  recordedEt0,
  SCENARIO,
  TIGHT_TARGET,
} from './seed';
import { DIURNAL, irrigationVolumeM3 } from './simulate';

const ANCHOR = '2026-10-23T17:00:00.000Z'; // 21:00 GST
const HOUR_MS = 3_600_000;
const seed = buildSeed({ anchor: ANCHOR });
const sha = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');

describe('simulator', () => {
  it('is deterministic: same seed, same readings hash', () => {
    expect(sha(buildSeed({ anchor: ANCHOR }).readings)).toBe(sha(seed.readings));
    expect(sha(buildSeed({ anchor: ANCHOR }).events)).toBe(sha(seed.events));
  });

  it('writes 30 days of hourly readings for 12 sensors, minus the D-3 gap', () => {
    expect(seed.readings).toHaveLength(30 * 24 * 12 - (GAPS['D-3-60'] ?? 0));
  });

  it('keeps every reading between 0 and 100 %', () => {
    expect(seed.readings.every((r) => r.paw >= 0 && r.paw <= 100)).toBe(true);
  });

  it('lands each block on its scenario PAW at the anchor (±0.5)', async () => {
    const latest = await createMemoryRepo(seed).getLatestReadings();
    for (const block of farm07.blocks) {
      const series = sensorsForBlock(farm07, block.id).flatMap((s) => {
        const found = latest[s.id];
        return found ? [{ ...found, weight: s.weight }] : [];
      });
      const info = blockPaw(block, series, ANCHOR);
      expect(info.paw, block.id).toBeCloseTo(SCENARIO[block.id] ?? NaN, 0);
    }
  });

  it('leaves D-3 60 cm silent for the last 9 h', () => {
    const last = seed.readings.filter((r) => r.sensorId === 'D-3-60').at(-1);
    expect(last?.ts).toBe(new Date(Date.parse(ANCHOR) - 9 * HOUR_MS).toISOString());
    expect(seed.readings.some((r) => r.sensorId === 'D-3-30' && r.ts === ANCHOR)).toBe(true);
  });

  it('irrigates night blocks only at 22:00 GST and greenhouses at 07, 11 and 15', () => {
    const gstHour = (iso: string) => (new Date(iso).getUTCHours() + 4) % 24;
    for (const e of seed.events) {
      const hours = blockById(farm07, e.blockId).mode === 'night' ? [22] : [7, 11, 15];
      expect(hours).toContain(gstHour(e.startedAt));
    }
  });

  it('sizes events with the engine formula and runs them at the block flow', () => {
    // plan/04 §3: D-1 net 21.35 mm → 25.1 mm gross → 90.4 m³
    expect(irrigationVolumeM3(blockById(farm07, 'D-1'), 21.35)).toBeCloseTo(90.4, 1);
    const sample = seed.events.find((e) => e.blockId === 'F-1');
    if (!sample) throw new Error('F-1 never irrigated');
    const hours = (Date.parse(sample.endedAt) - Date.parse(sample.startedAt)) / HOUR_MS;
    expect(hours * blockById(farm07, 'F-1').flowM3h).toBeCloseTo(sample.volumeM3, 0);
  });

  it.each(['2026-10-02T17:00:00.000Z', ANCHOR, '2026-10-28T17:00:00.000Z'])(
    'sets the allocation so a fodder cut lands the month in the tight band (anchor %s)',
    (anchor) => {
      const s = buildSeed({ anchor });
      const allocation = Object.values(s.allocations)[0] ?? 0;
      const p = monthProjection(s, recordedEt0());
      expect(p.beforeDeficit / allocation).toBeGreaterThan(1); // over before any deficit
      expect(p.afterFodderCut / allocation).toBeCloseTo(TIGHT_TARGET, 3);
    },
  );

  it('dates the 8 tasks on the anchor day', () => {
    expect(seed.tasks).toHaveLength(8);
    expect(new Set(seed.tasks.map((t) => t.dueDate))).toEqual(new Set(['2026-10-23']));
  });
});

describe('the seed drives the engine to the planned scenario', () => {
  it('irrigates D-1, skips D-2..D-4, pulses greenhouses and puts F-1 on deficit', async () => {
    const plan = planDay({
      farm: farm07,
      latest: await createMemoryRepo(seed).getLatestReadings(),
      et0: recordedEt0()
        .slice(-7)
        .map((et0Mm, i) => ({ date: `d${i}`, et0Mm })),
      budget: {
        month: '2026-10',
        allocationM3: seed.allocations['2026-10'] ?? 0,
        usedM3: await createMemoryRepo(seed).getMonthUsage('2026-10'),
        daysInMonth: 31,
        dayOfMonth: 23,
      },
      now: ANCHOR,
    });
    expect(Object.fromEntries(plan.decisions.map((d) => [d.blockId, d.decision]))).toEqual({
      'D-1': 'irrigate',
      'D-2': 'skip',
      'D-3': 'skip',
      'D-4': 'skip',
      'G-1': 'pulse',
      'G-2': 'pulse',
      'F-1': 'deficit',
    });
    expect(plan.budget.status).toBe('tight');
  });
});

describe('helpers', () => {
  it.each([
    ['2026-10-23T16:59:00Z', '2026-10-22T17:00:00.000Z'], // 20:59 GST → yesterday 21:00
    ['2026-10-23T17:00:00Z', '2026-10-23T17:00:00.000Z'], // 21:00 GST exactly
    ['2026-10-23T22:30:00Z', '2026-10-23T17:00:00.000Z'], // 02:30 GST next day
  ])('latestAnchor(%s) = %s', (now, anchor) => {
    expect(latestAnchor(new Date(now))).toBe(anchor);
  });

  it('spreads crop use over daylight only, summing to 1', () => {
    expect(DIURNAL.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(DIURNAL.slice(0, 6).every((w) => w === 0)).toBe(true);
    expect(DIURNAL.slice(18).every((w) => w === 0)).toBe(true);
  });

  it('draws standard normal noise', () => {
    const rng = mulberry32(1);
    const xs = Array.from({ length: 20_000 }, () => gaussian(rng));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(sd - 1)).toBeLessThan(0.03);
  });
});
