/**
 * @saqi/engine: pure irrigation logic (plan/04-recommendation-engine.md).
 * No I/O, no clock, no randomness. The public API and the planDay pipeline are final;
 * the maths inside each step is a placeholder until T05/T06.
 */
import { gstDate, sensorsForBlock } from '@saqi/shared';
import type {
  Block,
  BlockDecision,
  Budget,
  DayPlan,
  Farm,
  ScheduleItem,
  SensorSeries,
} from '@saqi/shared';
import type { BlockPawInfo, BudgetInput, PlanDayInput } from './types';

export type { BlockPawInfo, BudgetInput, PlanDayInput } from './types';

export function blockPaw(_block: Block, _sensors: SensorSeries[], _now: string): BlockPawInfo {
  // TODO(T05): weighted mean over fresh sensors (≤ 3 h old) and confidence rules, plan/04 §2.1.
  return { paw: null, confidence: 'low', staleSensors: [] };
}

export function decideBlock(block: Block, pawInfo: BlockPawInfo, et0Mm: number): BlockDecision {
  // TODO(T05): water-balance model and decision table, plan/04 §2 and §2.2.
  const paw = pawInfo.paw ?? 0;
  return {
    blockId: block.id,
    decision: 'skip',
    pawNow: paw,
    pawProjected: paw,
    threshold: block.pawThreshold,
    target: block.pawTarget,
    et0Mm,
    etcMm: 0,
    netMm: 0,
    grossMm: 0,
    volumeM3: 0,
    litresPerTree: block.trees === null ? null : 0,
    savedVsFixedM3: 0,
    confidence: pawInfo.confidence,
    reasons: [],
  };
}

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
    const series = sensorsForBlock(farm, block.id).flatMap((s) => latest[s.id] ?? []);
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
