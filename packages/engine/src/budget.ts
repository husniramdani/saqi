import { blockById, type Block, type BlockDecision, type Budget, type Farm } from '@saqi/shared';
import { round1, round10 } from './round';
import type { BudgetInput } from './types';

/** Who gets cut first when the month runs over: fodder (the water hog), then palms. Greenhouses never. */
export const DEFICIT_STEPS = [
  { priority: 3, factor: 0.7 },
  { priority: 2, factor: 0.85 },
] as const;
const OK_UP_TO = 0.97;

/** Gross daily water a block needs at the average ET₀, m³. */
export const blockDailyNeedM3 = (block: Block, et0AvgMm: number): number =>
  ((block.kc * et0AvgMm * block.et0Factor) / block.efficiency) *
  block.areaHa *
  10 *
  block.wettedFraction;

const cut = (d: BlockDecision, factor: number): BlockDecision => ({
  ...d,
  decision: 'deficit',
  netMm: round1(d.netMm * factor),
  grossMm: round1(d.grossMm * factor),
  volumeM3: round1(d.volumeM3 * factor),
  litresPerTree: d.litresPerTree === null ? null : round10(d.litresPerTree * factor),
  reasons: [...d.reasons, { code: 'BUDGET_DEFICIT', params: { factor } }],
});

/**
 * Monthly water budget guard (plan/04 §2.3): project the month at the 7-day average ET₀;
 * while it overshoots the allocation, put the next priority tier on deficit irrigation.
 */
export function applyBudget(
  decisions: BlockDecision[],
  farm: Farm,
  budget: BudgetInput,
  et0Avg: number,
): { decisions: BlockDecision[]; budget: Budget } {
  const remainingDays = Math.max(0, budget.daysInMonth - budget.dayOfMonth + 1);
  const need = new Map(farm.blocks.map((b) => [b.id, blockDailyNeedM3(b, et0Avg)]));
  const project = () =>
    budget.usedM3 + [...need.values()].reduce((a, b) => a + b, 0) * remainingDays;

  const projectedM3 = project();
  const factors = new Map<string, number>();
  for (const step of DEFICIT_STEPS) {
    if (project() <= budget.allocationM3) break;
    for (const d of decisions) {
      const block = blockById(farm, d.blockId);
      if (d.decision !== 'irrigate' || block.priority !== step.priority) continue;
      factors.set(d.blockId, step.factor);
      need.set(block.id, (need.get(block.id) ?? 0) * step.factor);
    }
  }

  const projectedAfterPlanM3 = project();
  const share = budget.allocationM3 > 0 ? projectedAfterPlanM3 / budget.allocationM3 : Infinity;
  return {
    decisions: decisions.map((d) => {
      const factor = factors.get(d.blockId);
      return factor === undefined ? d : cut(d, factor);
    }),
    budget: {
      month: budget.month,
      allocationM3: round1(budget.allocationM3),
      usedM3: round1(budget.usedM3),
      projectedM3: round1(projectedM3),
      projectedAfterPlanM3: round1(projectedAfterPlanM3),
      status: share <= OK_UP_TO ? 'ok' : share <= 1 ? 'tight' : 'over',
      deficitBlocks: [...factors.keys()],
    },
  };
}
