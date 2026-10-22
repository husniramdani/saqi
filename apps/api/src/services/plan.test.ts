import type { Weather } from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { createMemoryRepo } from '../repo/memory';
import { buildSeed } from '../sim/seed';
import { createPlanService } from './plan';
import { withTimeShift } from './timeshift';

const anchor = '2026-10-23T17:00:00.000Z';
const forecast = (fetchedAt: string, et0Mm = 5.8): Weather => ({
  fetchedAt,
  stale: false,
  current: { tempC: 31, humidityPct: 38, windKmh: 14, isDay: false },
  daily: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-${23 + i}`,
    et0Mm,
    tMaxC: 36,
    tMinC: 23,
    humidityMeanPct: 40,
    windMaxKmh: 18,
  })),
});

function setup(nowIso: string) {
  let at = new Date(nowIso);
  let weather = forecast('2026-10-23T17:00:00Z');
  const now = () => at;
  const repo = withTimeShift(createMemoryRepo(buildSeed({ anchor })), now);
  const plan = createPlanService({ repo, now, weather: { getWeather: async () => weather } });
  return {
    plan,
    setNow: (iso: string) => {
      at = new Date(iso);
    },
    setWeather: (w: Weather) => {
      weather = w;
    },
  };
}

describe('plan service', () => {
  it('plans the scenario whenever it is opened: D-1 irrigates, F-1 on deficit, month tight', async () => {
    for (const now of ['2026-10-23T17:20:00Z', '2026-10-26T06:05:00Z', '2026-11-04T19:45:00Z']) {
      const plan = await setup(now).plan.today();
      const decisions = Object.fromEntries(plan.decisions.map((d) => [d.blockId, d.decision]));
      expect(decisions, now).toMatchObject({ 'D-1': 'irrigate', 'D-2': 'skip', 'F-1': 'deficit' });
      expect(plan.budget.status, now).toBe('tight');
      expect(plan.budget.month, now).toBe('2026-10'); // the scenario's month, not the calendar's
    }
  });

  it('sends schedule times as UTC', async () => {
    const plan = await setup('2026-10-23T17:20:00Z').plan.today();
    expect(plan.schedule[0]?.start).toBe('2026-10-23T18:00:00.000Z'); // 22:00 GST
    expect(plan.schedule.every((i) => i.start.endsWith('Z') && i.end.endsWith('Z'))).toBe(true);
  });

  it('memoises within the hour and weather fetch, and recomputes when either changes', async () => {
    const s = setup('2026-10-23T17:20:00Z');
    const first = await s.plan.today();
    s.setNow('2026-10-23T17:24:00Z'); // same hour, same weather, inside 5 min
    expect(await s.plan.today()).toBe(first);

    s.setWeather(forecast('2026-10-23T17:45:00Z', 6.4));
    expect(await s.plan.today()).not.toBe(first);

    const second = await s.plan.today();
    s.setNow('2026-10-23T18:01:00Z');
    expect(await s.plan.today()).not.toBe(second);
  });

  it('forgets the memo after 5 minutes or on invalidate()', async () => {
    const s = setup('2026-10-23T17:00:00Z');
    const first = await s.plan.today();
    s.setNow('2026-10-23T17:05:01Z');
    const second = await s.plan.today();
    expect(second).not.toBe(first);
    s.plan.invalidate();
    expect(await s.plan.today()).not.toBe(second);
  });
});
