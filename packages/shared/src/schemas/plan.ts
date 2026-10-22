import { z } from 'zod';
import { IsoDateSchema, IsoDateTimeSchema, MonthSchema } from './common';

export const ReasonCodeSchema = z.enum([
  'PAW_NOW',
  'PAW_PROJECTED',
  'ABOVE_THRESHOLD',
  'BELOW_THRESHOLD',
  'ET0_FORECAST',
  'REFILL_TO_TARGET',
  'SAVES_VS_FIXED',
  'GREENHOUSE_PULSES',
  'BUDGET_DEFICIT',
  'SENSOR_STALE',
  'LOW_CONFIDENCE',
  'WINDOW_ASSIGNED',
  'WINDOW_OVERFLOW',
]);
export type ReasonCode = z.infer<typeof ReasonCodeSchema>;

/** Reasons are codes + numbers so the web can render them in any locale. */
export const ReasonSchema = z.object({
  code: ReasonCodeSchema,
  params: z.record(z.string(), z.union([z.number(), z.string()])),
});
export type Reason = z.infer<typeof ReasonSchema>;

export const DecisionSchema = z.enum(['irrigate', 'skip', 'pulse', 'deficit']);
export type Decision = z.infer<typeof DecisionSchema>;

export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const BlockDecisionSchema = z.object({
  blockId: z.string(),
  decision: DecisionSchema,
  /** null when every sensor is stale: there is no honest PAW to show. */
  pawNow: z.number().nullable(),
  pawProjected: z.number().nullable(),
  threshold: z.number(),
  target: z.number(),
  et0Mm: z.number().nonnegative(),
  etcMm: z.number().nonnegative(),
  netMm: z.number().nonnegative(),
  grossMm: z.number().nonnegative(),
  volumeM3: z.number().nonnegative(),
  litresPerTree: z.number().nonnegative().nullable(),
  savedVsFixedM3: z.number().nonnegative(),
  confidence: ConfidenceSchema,
  reasons: z.array(ReasonSchema),
});
export type BlockDecision = z.infer<typeof BlockDecisionSchema>;

export const ScheduleItemSchema = z.object({
  blockId: z.string(),
  kind: z.enum(['night', 'pulse']),
  start: IsoDateTimeSchema,
  end: IsoDateTimeSchema,
  volumeM3: z.number().nonnegative(),
});
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const BudgetStatusSchema = z.enum(['ok', 'tight', 'over']);
export type BudgetStatus = z.infer<typeof BudgetStatusSchema>;

export const BudgetSchema = z.object({
  month: MonthSchema,
  allocationM3: z.number().nonnegative(),
  usedM3: z.number().nonnegative(),
  projectedM3: z.number().nonnegative(),
  projectedAfterPlanM3: z.number().nonnegative(),
  status: BudgetStatusSchema,
  deficitBlocks: z.array(z.string()),
});
export type Budget = z.infer<typeof BudgetSchema>;

export const DayPlanSchema = z.object({
  date: IsoDateSchema,
  generatedAt: IsoDateTimeSchema,
  decisions: z.array(BlockDecisionSchema),
  schedule: z.array(ScheduleItemSchema),
  budget: BudgetSchema,
  totals: z.object({
    tonightM3: z.number().nonnegative(),
    pulsesM3: z.number().nonnegative(),
    savedVsFixedM3: z.number().nonnegative(),
  }),
});
export type DayPlan = z.infer<typeof DayPlanSchema>;
