import { DayPlanSchema, farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { planDay } from './index';
import { NOW, pair, series } from './test-helpers';
import type { PlanDayInput } from './types';

/** The scenario from plan/03 §4 with the worked example's ET₀ (plan/04 §3). */
const scenario = (): PlanDayInput => {
  const sensors = [
    ...pair('D-1', 68, 68),
    ...pair('D-2', 84, 84),
    ...pair('D-3', 75, 70, 9), // 60 cm sensor silent for 9 h
    ...pair('D-4', 77, 77),
    ...pair('F-1', 49, 49),
    series('G-1-S', 80),
    series('G-2-S', 83),
  ];
  return {
    farm: farm07,
    latest: Object.fromEntries(sensors.map((s) => [s.sensorId, s])),
    et0: Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${23 + i}`, et0Mm: 5.8 })),
    budget: { month: '2026-10', allocationM3: 7050, usedM3: 5776, daysInMonth: 31, dayOfMonth: 23 },
    now: NOW,
  };
};

describe('planDay: worked example end to end', () => {
  const plan = planDay(scenario());
  const decision = (id: string) => plan.decisions.find((d) => d.blockId === id);

  it('validates against DayPlanSchema', () => {
    expect(() => DayPlanSchema.parse(plan)).not.toThrow();
    expect(plan.date).toBe('2026-10-23');
  });

  it('decides every block as the scenario says', () => {
    expect(plan.decisions.map((d) => [d.blockId, d.decision, d.volumeM3])).toEqual([
      ['D-1', 'irrigate', 90.4],
      ['D-2', 'skip', 0],
      ['D-3', 'skip', 0],
      ['D-4', 'skip', 0],
      ['G-1', 'pulse', 7.6],
      ['G-2', 'pulse', 6.6],
      ['F-1', 'deficit', 155.5],
    ]);
    expect(decision('D-3')).toMatchObject({ confidence: 'low', pawNow: 75 });
  });

  it('schedules D-1 then F-1 on the pump, and 6 pulses tomorrow', () => {
    const night = plan.schedule.filter((i) => i.kind === 'night');
    expect(night.map((i) => [i.blockId, i.start.slice(11, 16), i.end.slice(11, 16)])).toEqual([
      ['D-1', '22:00', '01:01'],
      ['F-1', '01:01', '04:28'],
    ]);
    expect(plan.schedule.filter((i) => i.kind === 'pulse')).toHaveLength(6);
  });

  it('totals 245.9 m³ tonight and 62 m³ saved against a fixed schedule', () => {
    expect(plan.totals.tonightM3).toBe(245.9);
    expect(plan.totals.savedVsFixedM3).toBe(62);
    expect(plan.budget).toMatchObject({ status: 'tight', deficitBlocks: ['F-1'] });
  });

  it('explains F-1 with the deficit and its window', () => {
    expect(decision('F-1')?.reasons.slice(-2)).toEqual([
      { code: 'BUDGET_DEFICIT', params: { factor: 0.7 } },
      { code: 'WINDOW_ASSIGNED', params: { start: '01:01', end: '04:28' } },
    ]);
  });

  it('is deterministic (case 13)', () => {
    expect(planDay(scenario())).toEqual(planDay(scenario()));
  });
});

describe('planDay: thin inputs', () => {
  it('skips every block with low confidence when there are no readings', () => {
    const plan = planDay({ ...scenario(), latest: {} });
    expect(() => DayPlanSchema.parse(plan)).not.toThrow();
    expect(plan.decisions.every((d) => d.decision === 'skip' && d.confidence === 'low')).toBe(true);
    expect(plan.schedule).toEqual([]);
  });

  it('falls back to today when only one ET₀ day is known, and to 0 when none', () => {
    const one = planDay({ ...scenario(), et0: [{ date: '2026-10-23', et0Mm: 5.8 }] });
    expect(one.decisions[0]?.et0Mm).toBe(5.8);
    const none = planDay({ ...scenario(), et0: [] });
    expect(none.decisions.every((d) => d.etcMm === 0)).toBe(true);
  });
});
