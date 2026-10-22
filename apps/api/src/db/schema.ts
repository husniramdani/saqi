/** Postgres schema (plan/03-data-model.md §3). Timestamps are stored un-shifted (seed time). */
import type { Block, I18nText, Utility, Weather } from '@saqi/shared';
import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

const num = (name: string) => numeric(name, { mode: 'number' });
const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

export const farms = pgTable('farms', {
  id: text('id').primaryKey(),
  name: jsonb('name').$type<I18nText>().notNull(),
  lat: num('lat').notNull(),
  lon: num('lon').notNull(),
  timezone: text('timezone').notNull(),
  pumpCapacityM3h: num('pump_capacity_m3h').notNull(),
  nightStart: text('night_start').notNull(),
  nightEnd: text('night_end').notNull(),
  pulseTimes: text('pulse_times').array().notNull(),
  utilities: jsonb('utilities').$type<Utility[]>().notNull(),
});

export const waterSources = pgTable('water_sources', {
  id: text('id').primaryKey(),
  farmId: text('farm_id')
    .notNull()
    .references(() => farms.id),
  kind: text('kind').notNull(),
  name: jsonb('name').$type<I18nText>().notNull(),
  ecDsM: num('ec_ds_m'),
});

export const blocks = pgTable('blocks', {
  id: text('id').primaryKey(),
  farmId: text('farm_id')
    .notNull()
    .references(() => farms.id),
  name: jsonb('name').$type<I18nText>().notNull(),
  crop: text('crop').notNull(),
  variety: text('variety').notNull(),
  areaHa: num('area_ha').notNull(),
  trees: integer('trees'),
  method: text('method').notNull(),
  efficiency: num('efficiency').notNull(),
  wettedFraction: num('wetted_fraction').notNull(),
  fc: num('fc').notNull(),
  wp: num('wp').notNull(),
  rootDepthMm: integer('root_depth_mm').notNull(),
  kc: num('kc').notNull(),
  et0Factor: num('et0_factor').notNull(),
  pawThreshold: num('paw_threshold').notNull(),
  pawTarget: num('paw_target').notNull(),
  flowM3h: num('flow_m3h').notNull(),
  priority: integer('priority').notNull(),
  sourceId: text('source_id')
    .notNull()
    .references(() => waterSources.id),
  fixedScheduleM3Day: num('fixed_schedule_m3_day').notNull(),
  mode: text('mode').notNull(),
  geometry: jsonb('geometry').$type<Block['geometry']>().notNull(),
});

export const sensors = pgTable('sensors', {
  id: text('id').primaryKey(),
  blockId: text('block_id')
    .notNull()
    .references(() => blocks.id),
  depthCm: integer('depth_cm'),
  kind: text('kind').notNull(),
  weight: num('weight').notNull(),
});

export const readings = pgTable(
  'readings',
  {
    sensorId: text('sensor_id')
      .notNull()
      .references(() => sensors.id),
    ts: tstz('ts').notNull(),
    paw: num('paw').notNull(),
    vwc: num('vwc').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sensorId, t.ts] }),
    index('readings_sensor_ts_desc').on(t.sensorId, t.ts.desc()),
  ],
);

export const irrigationEvents = pgTable(
  'irrigation_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockId: text('block_id')
      .notNull()
      .references(() => blocks.id),
    startedAt: tstz('started_at').notNull(),
    endedAt: tstz('ended_at').notNull(),
    volumeM3: num('volume_m3').notNull(),
    status: text('status').notNull(),
    source: text('source').notNull(),
    note: text('note'),
  },
  (t) => [index('events_block_started').on(t.blockId, t.startedAt.desc())],
);

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  blockId: text('block_id').references(() => blocks.id),
  kind: text('kind').notNull(),
  title: jsonb('title').$type<I18nText>().notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  assignee: text('assignee').notNull(),
  status: text('status').notNull(),
  note: text('note'),
  updatedAt: tstz('updated_at').notNull(),
});

export const allocations = pgTable(
  'allocations',
  {
    farmId: text('farm_id')
      .notNull()
      .references(() => farms.id),
    month: text('month').notNull(),
    allocationM3: num('allocation_m3').notNull(),
  },
  (t) => [primaryKey({ columns: [t.farmId, t.month] })],
);

export const weatherCache = pgTable('weather_cache', {
  key: text('key').primaryKey(),
  payload: jsonb('payload').$type<Weather>().notNull(),
  fetchedAt: tstz('fetched_at').notNull(),
});

/** Key/value store; holds `seed_anchor` (ISO hour) for time-shifting. */
export const meta = pgTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
