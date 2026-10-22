import type { Confidence, Farm, SensorSeries } from '@saqi/shared';

export interface BudgetInput {
  month: string;
  allocationM3: number;
  usedM3: number;
  daysInMonth: number;
  dayOfMonth: number;
}

export interface PlanDayInput {
  farm: Farm;
  /** Latest series per sensor, keyed by sensorId. */
  latest: Record<string, SensorSeries>;
  /** Daily ET₀, today first, at least 2 days. */
  et0: { date: string; et0Mm: number }[];
  budget: BudgetInput;
  /** ISO instant; the engine never reads the clock itself. */
  now: string;
}

export interface BlockPawInfo {
  paw: number | null;
  confidence: Confidence;
  staleSensors: { sensorId: string; hours: number }[];
}
