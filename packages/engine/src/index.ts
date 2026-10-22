/**
 * @saqi/engine: pure irrigation logic (plan/04-recommendation-engine.md).
 * No I/O, no clock, no randomness. blockPaw and decideBlock are real (T05);
 * applyBudget and schedule are placeholders until T06.
 */
import { gstDate, sensorsForBlock } from '@saqi/shared';
import type { BlockDecision, Budget, DayPlan, Farm, ScheduleItem } from '@saqi/shared';
import { decideBlock } from './decide';
import { blockPaw } from './paw';
import type { BudgetInput, PlanDayInput } from './types';

export { decideBlock, PULSES_PER_DAY } from './decide';
export { blockPaw, STALE_AFTER_HOURS } from './paw';
export type { BlockPawInfo, BudgetInput, PlanDayInput, WeightedSeries } from './types';

export function applyBudget(
  decisions: BlockDecision[],
  _farm: Farm,
  budget: BudgetInput,
  _et0Avg: number,
): { decisions: BlockDecision[]; budget: Budget } {
  // TODO(T06): projected month usage and deficit cuts by priority, plan/04 §2.3.
  return {
    decisions,
    budget: {
      month: budget.month,
      allocationM3: budget.allocationM3,
      usedM3: budget.usedM3,
      projectedM3: budget.usedM3,
      projectedAfterPlanM3: budget.usedM3,
      status: 'ok',
      deficitBlocks: [],
    },
  };
}

export function schedule(_decisions: BlockDecision[], _farm: Farm, _date: string): ScheduleItem[] {
  // TODO(T06): pump-aware greedy night scheduling and greenhouse pulses, plan/04 §2.4.
  return [];
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function planDay(input: PlanDayInput): DayPlan {
  const { farm, latest, et0, now } = input;
  const et0Tomorrow = (et0[1] ?? et0[0])?.et0Mm ?? 0;
  const et0Avg = et0.length > 0 ? sum(et0.map((d) => d.et0Mm)) / et0.length : 0;

  const decided = farm.blocks.map((block) => {
    const series = sensorsForBlock(farm, block.id).flatMap((s) => {
      const found = latest[s.id];
      return found ? [{ ...found, weight: s.weight }] : [];
    });
    return decideBlock(block, blockPaw(block, series, now), et0Tomorrow);
  });
  const { decisions, budget } = applyBudget(decided, farm, input.budget, et0Avg);
  const date = gstDate(now);
  const items = schedule(decisions, farm, date);

  return {
    date,
    generatedAt: now,
    decisions,
    schedule: items,
    budget,
    totals: {
      tonightM3: sum(items.filter((i) => i.kind === 'night').map((i) => i.volumeM3)),
      pulsesM3: sum(items.filter((i) => i.kind === 'pulse').map((i) => i.volumeM3)),
      savedVsFixedM3: sum(decisions.map((d) => d.savedVsFixedM3)),
    },
  };
}
