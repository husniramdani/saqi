import { blockDailyNeedM3, DEFICIT_STEPS } from '@saqi/engine';
import { farm07, gstDate, taskTemplates, type Farm, type Task } from '@saqi/shared';
import { z } from 'zod';
import type { SeedData } from '../repo/types';
import past30 from './fixtures/openmeteo-past30.json' with { type: 'json' };
import { mulberry32 } from './prng';
import { DAYS, simulate } from './simulate';

const HOUR_MS = 3_600_000;
export const SEED = 7;
/**
 * The allocation is set so that, after the fodder deficit cut, the month projects to the middle
 * of the "tight" band (97–100 %). plan/03 §1 first said "4 % over before any deficit", but how
 * much the fodder cut saves depends on the days left in the month, so a fixed 4 % sometimes
 * cut the palms too.
 */
export const TIGHT_TARGET = 0.985;
const FODDER = DEFICIT_STEPS[0];

/** PAW % at the anchor hour, 21:00 GST: what "tonight" shows (plan/03 §4.4). */
export const SCENARIO: Record<string, number> = {
  'D-1': 68,
  'D-2': 84,
  'D-3': 75,
  'D-4': 77,
  'G-1': 80,
  'G-2': 83,
  'F-1': 49,
};
/** D-3's 60 cm probe has been silent since 12:00. */
export const GAPS: Record<string, number> = { 'D-3-60': 9 };

const Past30Schema = z.object({
  daily: z.object({ time: z.array(z.string()), et0_fao_evapotranspiration: z.array(z.number()) }),
});

/** The recorded Open-Meteo ET₀ (Al Ain), oldest first, without the trailing forecast day. */
export const recordedEt0 = (): number[] =>
  Past30Schema.parse(past30).daily.et0_fao_evapotranspiration.slice(0, DAYS);

/** The most recent 21:00 GST at or before `now`. */
export function latestAnchor(now: Date): string {
  const today = Date.parse(`${gstDate(now)}T21:00:00+04:00`);
  return new Date(today <= now.getTime() ? today : today - 24 * HOUR_MS).toISOString();
}

/**
 * The month at the anchor, projected as in plan/04 §2.3: water used so far plus every block's
 * daily need at the last week's average ET₀, for each remaining day. `afterFodderCut` applies the
 * first deficit step (priority-3 blocks × 0.7).
 */
export function monthProjection(
  seed: Pick<SeedData, 'anchor' | 'farm' | 'events'>,
  et0Daily: number[],
) {
  const today = gstDate(seed.anchor);
  const month = today.slice(0, 7);
  const usedM3 = seed.events
    .filter((e) => e.status === 'done' && gstDate(e.startedAt).startsWith(month))
    .reduce((sum, e) => sum + e.volumeM3, 0);
  const week = et0Daily.slice(-7);
  const et0Avg = week.reduce((a, b) => a + b, 0) / week.length;
  const needOf = (priority?: number) =>
    seed.farm.blocks
      .filter((b) => priority === undefined || b.priority === priority)
      .reduce((sum, b) => sum + blockDailyNeedM3(b, et0Avg), 0);
  const daysInMonth = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
  ).getUTCDate();
  const remainingDays = daysInMonth - Number(today.slice(8, 10)) + 1;
  const fodderSaving = (1 - FODDER.factor) * needOf(FODDER.priority) * remainingDays;
  const beforeDeficit = usedM3 + needOf() * remainingDays;
  return { month, beforeDeficit, afterFodderCut: beforeDeficit - fodderSaving };
}

/** Deterministic seed for Farm 07: 30 days of sensors and events ending on the scenario. */
export function buildSeed({
  anchor = latestAnchor(new Date()),
  farm = farm07,
  et0Daily = recordedEt0(),
}: { anchor?: string; farm?: Farm; et0Daily?: number[] } = {}): SeedData {
  const { readings, events } = simulate({
    farm,
    et0Daily,
    anchor,
    scenario: SCENARIO,
    gaps: GAPS,
    rng: mulberry32(SEED),
  });

  // The D-3 template says "since 12:00"; write the real start of the probe's silence instead.
  const silentSince = new Date(Date.parse(anchor) - (GAPS['D-3-60'] ?? 0) * HOUR_MS + 4 * HOUR_MS)
    .toISOString()
    .slice(11, 16);
  const tasks: Task[] = taskTemplates.map((t, i) => ({
    id: `task-${i + 1}`,
    blockId: t.blockId,
    kind: t.kind,
    title:
      t.key === 'd3-sensor'
        ? {
            en: t.title.en.replace('12:00', silentSince),
            ar: t.title.ar.replace('12:00', silentSince),
            ur: t.title.ur.replace('12:00', silentSince),
          }
        : t.title,
    assignee: t.assignee,
    dueDate: gstDate(anchor),
    status: 'todo',
    updatedAt: anchor,
  }));

  const projection = monthProjection({ anchor, farm, events }, et0Daily);
  const allocation = Math.round(projection.afterFodderCut / TIGHT_TARGET);
  return {
    anchor,
    farm,
    readings,
    events,
    tasks,
    allocations: { [gstDate(anchor).slice(0, 7)]: allocation },
  };
}
