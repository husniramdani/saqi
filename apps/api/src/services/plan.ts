import { planDay } from '@saqi/engine';
import { gstDate, type DayPlan } from '@saqi/shared';
import type { Repo } from '../repo/types';
import { floorHour, shiftMs } from './timeshift';
import type { WeatherService } from './weather';

const MEMO_MS = 5 * 60_000;

export interface PlanService {
  today(): Promise<DayPlan>;
  /** Drop the memo after a write that changes the plan (a manual irrigation log). */
  invalidate(): void;
}

/**
 * Tonight's plan: farm, latest sensors (time-shifted), live ET₀ and the month's budget, through
 * the engine. Memoised per (hour, weather fetch) for 5 minutes.
 *
 * The budget is evaluated at the scenario's own moment, not the real calendar: the seed's month,
 * its day of month and its usage up to "now" in seed time. The allocation was calibrated for that
 * moment, so the story (fodder on deficit, month tight) holds on any day the demo is opened.
 */
export function createPlanService(deps: {
  repo: Repo;
  weather: WeatherService;
  now: () => Date;
}): PlanService {
  const { repo, weather, now } = deps;
  let memo: { key: string; expiresAt: number; plan: DayPlan } | null = null;

  return {
    invalidate: () => {
      memo = null;
    },
    async today() {
      const at = now();
      const [forecast, anchor] = await Promise.all([weather.getWeather(), repo.getSeedAnchor()]);
      const key = `${floorHour(at)}|${forecast.fetchedAt}`;
      if (memo && memo.key === key && at.getTime() < memo.expiresAt) return memo.plan;

      const ms = shiftMs(at, anchor);
      const seedDay = gstDate(new Date(at.getTime() - ms));
      const month = seedDay.slice(0, 7);
      const year = Number(month.slice(0, 4));
      const monthNo = Number(month.slice(5, 7));
      // `repo` is the shifted view: real-time bounds here are seed-month start → seed "now".
      const monthStart = new Date(Date.parse(`${month}-01T00:00:00+04:00`) + ms).toISOString();

      const [farm, latest, usedM3, allocationM3] = await Promise.all([
        repo.getFarm(),
        repo.getLatestReadings(),
        repo.getUsage(monthStart, at.toISOString()),
        repo.getAllocation(month),
      ]);

      const plan = planDay({
        farm,
        latest,
        et0: forecast.daily.map(({ date, et0Mm }) => ({ date, et0Mm })),
        budget: {
          month,
          allocationM3,
          usedM3,
          daysInMonth: new Date(Date.UTC(year, monthNo, 0)).getUTCDate(),
          dayOfMonth: Number(seedDay.slice(8, 10)),
        },
        now: at.toISOString(),
      });
      // Every timestamp leaves the API as UTC `Z`; the web formats it in GST.
      const out: DayPlan = {
        ...plan,
        schedule: plan.schedule.map((i) => ({
          ...i,
          start: new Date(i.start).toISOString(),
          end: new Date(i.end).toISOString(),
        })),
      };
      memo = { key, expiresAt: at.getTime() + MEMO_MS, plan: out };
      return out;
    },
  };
}
