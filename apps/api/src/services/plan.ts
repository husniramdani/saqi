import { planDay } from '@saqi/engine';
import { gstDate, type DayPlan } from '@saqi/shared';
import type { Deps } from '../app';

/** Gathers farm, sensors, weather and budget, then asks the engine for today's plan. */
export async function getPlanToday({ repo, weather, now }: Deps): Promise<DayPlan> {
  const at = now();
  const today = gstDate(at);
  const month = today.slice(0, 7);
  // TODO(T08/T10): time-shift readings and usage; memoise per (hour, weather.fetchedAt).
  const [farm, latest, forecast, usedM3, allocationM3] = await Promise.all([
    repo.getFarm(),
    repo.getLatestReadings(),
    weather.getWeather(),
    repo.getMonthUsage(month),
    repo.getAllocation(month),
  ]);
  const year = Number(today.slice(0, 4));
  const monthNo = Number(today.slice(5, 7));

  return planDay({
    farm,
    latest,
    et0: forecast.daily.map(({ date, et0Mm }) => ({ date, et0Mm })),
    budget: {
      month,
      allocationM3,
      usedM3,
      daysInMonth: new Date(Date.UTC(year, monthNo, 0)).getUTCDate(),
      dayOfMonth: Number(today.slice(8, 10)),
    },
    now: at.toISOString(),
  });
}
