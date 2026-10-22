import { z } from 'zod';
import { HhmmSchema, I18nTextSchema } from './common';

export const WaterSourceSchema = z.object({
  id: z.string(),
  kind: z.enum(['well', 'ro', 'tse']),
  name: I18nTextSchema,
  ecDsM: z.number().nonnegative().nullable(),
});
export type WaterSource = z.infer<typeof WaterSourceSchema>;

export const SensorSchema = z.object({
  id: z.string(),
  blockId: z.string(),
  depthCm: z.number().int().positive().nullable(),
  kind: z.enum(['soil', 'substrate']),
  weight: z.number().gt(0).max(1),
});
export type Sensor = z.infer<typeof SensorSchema>;

export const PointSchema = z.object({ x: z.number(), y: z.number() });

export const BlockSchema = z.object({
  id: z.string(),
  name: I18nTextSchema,
  crop: z.enum(['date_palm', 'tomato', 'cucumber', 'fodder']),
  variety: z.string(),
  areaHa: z.number().positive(),
  trees: z.number().int().positive().nullable(),
  method: z.enum(['bubbler', 'subsurface_drip', 'drip', 'sprinkler']),
  efficiency: z.number().gt(0).max(1),
  wettedFraction: z.number().gt(0).max(1),
  fc: z.number().gt(0).max(1),
  wp: z.number().nonnegative().max(1),
  rootDepthMm: z.number().int().positive(),
  kc: z.number().positive(),
  et0Factor: z.number().positive(),
  pawThreshold: z.number().min(0).max(100),
  pawTarget: z.number().min(0).max(100),
  flowM3h: z.number().positive(),
  priority: z.literal([1, 2, 3]),
  sourceId: z.string(),
  fixedScheduleM3Day: z.number().nonnegative(),
  geometry: z.object({ points: z.string(), label: PointSchema, pipePath: z.string() }),
  mode: z.enum(['night', 'pulse']),
});
export type Block = z.infer<typeof BlockSchema>;

const UtilityBase = {
  id: z.string(),
  kind: z.enum(['well', 'ro', 'tank', 'pump', 'tse']),
  label: z.string(),
};

/** Map furniture drawn in the utility strip (SVG units, viewBox 0 0 1000 620). */
export const UtilitySchema = z.discriminatedUnion('shape', [
  z.object({
    ...UtilityBase,
    shape: z.literal('circle'),
    x: z.number(),
    y: z.number(),
    r: z.number().positive(),
  }),
  z.object({
    ...UtilityBase,
    shape: z.literal('rect'),
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
]);
export type Utility = z.infer<typeof UtilitySchema>;

export const FarmSchema = z.object({
  id: z.string(),
  name: I18nTextSchema,
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string(),
  pumpCapacityM3h: z.number().positive(),
  nightWindow: z.object({ start: HhmmSchema, end: HhmmSchema }),
  pulseTimes: z.array(HhmmSchema),
  sources: z.array(WaterSourceSchema),
  blocks: z.array(BlockSchema),
  sensors: z.array(SensorSchema),
  utilities: z.array(UtilitySchema),
});
export type Farm = z.infer<typeof FarmSchema>;
