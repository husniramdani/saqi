import { blockById, farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { applyBudget, blockDailyNeedM3 } from './budget';
import { decideBlock } from './decide';
import type { BlockPawInfo, BudgetInput } from './types';

const ET0 = 5.8;
const fresh = (paw: number): BlockPawInfo => ({ paw, confidence: 'high', staleSensors: [] });
const PAW: Record<string, number> = {
  'D-1': 68,
  'D-2': 84,
  'D-3': 75,
  'D-4': 77,
  'G-1': 80,
  'G-2': 83,
  'F-1': 49,
};
const decisions = farm07.blocks.map((b) => decideBlock(b, fresh(PAW[b.id] ?? 0), ET0));
const dailyNeed = farm07.blocks.reduce((sum, b) => sum + blockDailyNeedM3(b, ET0), 0);

// 23 Oct of 31 → 9 days left including today.
const budget = (usedM3: number, allocationM3 = 7050): BudgetInput => ({
  month: '2026-10',
  allocationM3,
  usedM3,
  daysInMonth: 31,
  dayOfMonth: 23,
});
const byId = <T extends { blockId: string }>(ds: T[], id: string) =>
  ds.find((d) => d.blockId === id);

describe('applyBudget', () => {
  it('puts fodder on ×0.7 deficit when the month runs over (case 9)', () => {
    const out = applyBudget(decisions, farm07, budget(5776), ET0);
    expect(out.budget.projectedM3).toBeGreaterThan(7050);
    expect(out.budget).toMatchObject({ status: 'tight', deficitBlocks: ['F-1'] });
    expect(byId(out.decisions, 'F-1')).toMatchObject({ decision: 'deficit', volumeM3: 155.5 });
    expect(byId(out.decisions, 'F-1')?.reasons.at(-1)).toEqual({
      code: 'BUDGET_DEFICIT',
      params: { factor: 0.7 },
    });
    // The fodder cut was enough: palms keep their full refill.
    expect(byId(out.decisions, 'D-1')).toMatchObject({ decision: 'irrigate', volumeM3: 90.4 });
  });

  it('cuts palms ×0.85 when fodder alone is not enough; greenhouses never (case 10)', () => {
    const out = applyBudget(decisions, farm07, budget(6500), ET0);
    expect(out.budget.deficitBlocks).toEqual(['F-1', 'D-1']);
    expect(byId(out.decisions, 'D-1')).toMatchObject({
      decision: 'deficit',
      volumeM3: 76.8,
      litresPerTree: 640,
    });
    expect(byId(out.decisions, 'G-1')).toEqual(byId(decisions, 'G-1'));
    expect(byId(out.decisions, 'D-2')?.decision).toBe('skip');
    expect(out.budget.status).toBe('over');
  });

  it('leaves everything alone and reports ok when far under', () => {
    const out = applyBudget(decisions, farm07, budget(1000), ET0);
    expect(out.decisions).toEqual(decisions);
    expect(out.budget).toMatchObject({ status: 'ok', deficitBlocks: [] });
    expect(out.budget.projectedAfterPlanM3).toBe(out.budget.projectedM3);
  });

  it('projects used + daily need × remaining days', () => {
    const out = applyBudget(decisions, farm07, { ...budget(1000), dayOfMonth: 31 }, ET0);
    expect(out.budget.projectedM3).toBeCloseTo(1000 + dailyNeed, 1);
  });

  it.each([
    [6838, 'ok'], // ≤ 97% (6,838.5)
    [7050, 'tight'], // ≤ 100%
    [7051, 'over'],
  ] as const)('status for a projection of %d m³ against 7,050 is %s', (target, status) => {
    // Nobody irrigates, so nothing can be cut and the projection is exactly what we set.
    const skips = decisions.map((d) => ({ ...d, decision: 'skip' as const }));
    const used = target - dailyNeed * 9;
    expect(applyBudget(skips, farm07, budget(used), ET0).budget.status).toBe(status);
  });

  it('reports over when there is no allocation at all', () => {
    expect(applyBudget(decisions, farm07, budget(0, 0), ET0).budget.status).toBe('over');
  });

  it('works out a block daily need from the model', () => {
    // F-1: 0.9 × 5.8 / 0.75 × 1.0 ha × 10 × 1.0 = 69.6 m³
    expect(blockDailyNeedM3(blockById(farm07, 'F-1'), ET0)).toBeCloseTo(69.6, 9);
  });
});
