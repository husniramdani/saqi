/**
 * @saqi/engine: pure irrigation logic (plan/04-recommendation-engine.md).
 * No I/O, no clock, no randomness: time arrives as `now`, and the same input always
 * gives the same DayPlan.
 */
import { gstDate, sensorsForBlock, type DayPlan } from '@saqi/shared';
import { applyBudget } from './budget';
import { decideBlock } from './decide';
import { blockPaw } from './paw';
import { round1 } from './round';
import { schedule } from './schedule';
import type { PlanDayInput } from './types';

export { applyBudget, blockDailyNeedM3, DEFICIT_STEPS } from './budget';
export { decideBlock, PULSES_PER_DAY } from './decide';
export { blockPaw, STALE_AFTER_HOURS } from './paw';
export { schedule } from './schedule';
export type { BlockPawInfo, BudgetInput, PlanDayInput, WeightedSeries } from './types';

/**
 * The decision rules' version, shown beside every plan. v1 is plan/04's rule set (threshold,
 * refill to target, budget tiers, night window, greenhouse pulses); bump it when a rule changes.
 */
export const ENGINE_VERSION = 'v1';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** blockPaw → decideBlock → applyBudget → schedule → totals. */
export function planDay(input: PlanDayInput): DayPlan {
  const { farm, latest, et0, now } = input;
  const et0Tomorrow = (et0[1] ?? et0[0])?.et0Mm ?? 0;
  const week = et0.slice(0, 7);
  const et0Avg = week.length > 0 ? sum(week.map((d) => d.et0Mm)) / week.length : 0;

  const decided = farm.blocks.map((block) => {
    const series = sensorsForBlock(farm, block.id).flatMap((s) => {
      const found = latest[s.id];
      return found ? [{ ...found, weight: s.weight }] : [];
    });
    return decideBlock(block, blockPaw(block, series, now), et0Tomorrow);
  });
  const budgeted = applyBudget(decided, farm, input.budget, et0Avg);
  const date = gstDate(now);
  const { items, decisions } = schedule(budgeted.decisions, farm, date);

  return {
    date,
    generatedAt: now,
    decisions,
    schedule: items,
    budget: budgeted.budget,
    totals: {
      tonightM3: round1(sum(items.filter((i) => i.kind === 'night').map((i) => i.volumeM3))),
      pulsesM3: round1(sum(items.filter((i) => i.kind === 'pulse').map((i) => i.volumeM3))),
      savedVsFixedM3: round1(sum(decisions.map((d) => d.savedVsFixedM3))),
    },
  };
}
