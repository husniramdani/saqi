import { DayPlanSchema, farm07 } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { planDay } from './index';

describe('planDay (placeholder)', () => {
  it('returns a schema-valid DayPlan with one skip per block', () => {
    const plan = planDay({
      farm: farm07,
      latest: {},
      et0: [
        { date: '2026-10-23', et0Mm: 5.6 },
        { date: '2026-10-24', et0Mm: 5.8 },
      ],
      budget: {
        month: '2026-10',
        allocationM3: 7050,
        usedM3: 6000,
        daysInMonth: 31,
        dayOfMonth: 23,
      },
      now: '2026-10-23T17:00:00.000Z',
    });

    expect(() => DayPlanSchema.parse(plan)).not.toThrow();
    expect(plan.date).toBe('2026-10-23');
    expect(plan.decisions).toHaveLength(7);
    expect(plan.decisions.every((d) => d.decision === 'skip' && d.volumeM3 === 0)).toBe(true);
    expect(plan.schedule).toEqual([]);
  });
});
