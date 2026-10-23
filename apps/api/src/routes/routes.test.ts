import {
  ApiErrorSchema,
  BlockDecisionSchema,
  DayPlanSchema,
  FarmSchema,
  gstDate,
  HealthSchema,
  IrrigationEventSchema,
  SensorSeriesSchema,
  TaskSchema,
  WeatherSchema,
  type Task,
} from '@saqi/shared';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApp } from '../app';
import { loadConfig } from '../config';
import { createHourlyMemoryRepo } from '../repo/hourly';
import { withTimeShift } from '../services/timeshift';
import { createWeatherService } from '../services/weather';
import { workedExampleFetch as recordedFetch } from '../sim/workedExample';

/** Wired like production: memory mode rebuilt for the current hour, behind the (zero) time-shift. */
const makeApp = (env: Record<string, string> = {}) => {
  const now = () => new Date();
  const config = loadConfig(env);
  const stored = createHourlyMemoryRepo(now);
  const weather = createWeatherService({
    fetch: recordedFetch,
    repo: stored,
    now,
    lat: config.FARM_LAT,
    lon: config.FARM_LON,
    ttlSeconds: config.WEATHER_TTL_SECONDS,
  });
  return createApp({ config, repo: withTimeShift(stored, now), weather, now });
};

const json = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});

const today = gstDate(new Date());

describe('routes: happy paths return schema-valid bodies', () => {
  it.each<[string, z.ZodType]>([
    ['/api/health', HealthSchema],
    ['/api/farm', FarmSchema],
    ['/api/weather', WeatherSchema],
    ['/api/plan/today', DayPlanSchema],
    ['/api/blocks/D-1/readings?days=14', z.array(SensorSeriesSchema).min(1)],
    ['/api/blocks/D-1/events', z.array(IrrigationEventSchema).min(1)],
    ['/api/blocks/D-1/recommendation', BlockDecisionSchema],
    [`/api/tasks?date=${today}&assignee=rahim`, z.array(TaskSchema).min(1)],
  ])('GET %s', async (path, schema) => {
    const res = await makeApp().request(path);
    expect(res.status).toBe(200);
    expect(schema.safeParse(await res.json()).success).toBe(true);
  });

  it('reports the seed anchor on /health', async () => {
    const health = HealthSchema.parse(await (await makeApp().request('/api/health')).json());
    // Memory mode is rebuilt for the current hour.
    expect(health.seedAnchor).toBe(
      new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString(),
    );
  });

  it('serves the scenario live: D-1 irrigates tonight, F-1 on deficit, month tight', async () => {
    const plan = DayPlanSchema.parse(await (await makeApp().request('/api/plan/today')).json());
    const decision = Object.fromEntries(plan.decisions.map((d) => [d.blockId, d]));
    expect(decision['D-1']).toMatchObject({
      decision: 'irrigate',
      volumeM3: 90.4,
      confidence: 'high',
    });
    expect(decision['D-2']?.decision).toBe('skip');
    expect(decision['D-3']).toMatchObject({ decision: 'skip', confidence: 'low' });
    expect(decision['F-1']?.decision).toBe('deficit');
    expect(decision['G-1']?.decision).toBe('pulse');
    expect(plan.budget.status).toBe('tight');
    expect(plan.schedule.every((i) => i.start.endsWith('Z'))).toBe(true);
  });

  it('ends the sensor history on the current hour', async () => {
    const res = await makeApp().request('/api/blocks/D-1/readings?days=1');
    const series = z.array(SensorSeriesSchema).parse(await res.json());
    const thisHour = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
    expect(series.map((s) => s.lastAt)).toEqual([thisHour, thisHour]);
  });

  it('plans one decision per block', async () => {
    const plan = DayPlanSchema.parse(await (await makeApp().request('/api/plan/today')).json());
    expect(plan.decisions.map((d) => d.blockId)).toEqual([
      'D-1',
      'D-2',
      'D-3',
      'D-4',
      'G-1',
      'G-2',
      'F-1',
    ]);
  });

  it('logs a manual irrigation event', async () => {
    const app = makeApp();
    const res = await app.request('/api/blocks/D-1/events', {
      method: 'POST',
      ...json({ startedAt: '2026-10-23T18:00:00Z', endedAt: '2026-10-23T19:00:00Z', volumeM3: 30 }),
    });
    expect(res.status).toBe(201);
    expect(IrrigationEventSchema.parse(await res.json())).toMatchObject({
      source: 'manual',
      volumeM3: 30,
    });
  });

  it('sends the CORS header for the web origin', async () => {
    const res = await makeApp().request('/api/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('allows each listed origin and refuses any other', async () => {
    const app = makeApp({ CORS_ORIGIN: 'https://saqi.example, https://saqi-web.example' });
    const allowed = async (origin: string) =>
      (await app.request('/api/health', { headers: { Origin: origin } })).headers.get(
        'access-control-allow-origin',
      );
    expect(await allowed('https://saqi.example')).toBe('https://saqi.example');
    expect(await allowed('https://saqi-web.example')).toBe('https://saqi-web.example');
    expect(await allowed('https://evil.example')).toBeNull();
  });
});

describe('routes: errors use the { error: { code, message } } body', () => {
  it.each([
    ['/api/blocks/X-9/readings', 404, 'NOT_FOUND'],
    ['/api/blocks/X-9/recommendation', 404, 'NOT_FOUND'],
    ['/api/blocks/D-1/readings?days=99', 422, 'VALIDATION'],
    ['/api/tasks?date=yesterday', 422, 'VALIDATION'],
    ['/api/nope', 404, 'NOT_FOUND'],
  ])('GET %s → %d %s', async (path, status, code) => {
    const res = await makeApp().request(path);
    expect(res.status).toBe(status);
    expect(ApiErrorSchema.parse(await res.json()).error.code).toBe(code);
  });

  it('rejects a 0 m³ manual event with 422', async () => {
    const res = await makeApp().request('/api/blocks/D-1/events', {
      method: 'POST',
      ...json({ startedAt: '2026-10-23T18:00:00Z', endedAt: '2026-10-23T19:00:00Z', volumeM3: 0 }),
    });
    expect(res.status).toBe(422);
  });

  it('answers a stale PATCH with 409 and the current task', async () => {
    const app = makeApp();
    const [task] = z
      .array(TaskSchema)
      .parse(await (await app.request(`/api/tasks?date=${today}`)).json()) as [Task];
    const patch = (body: object) =>
      app.request(`/api/tasks/${task.id}`, { method: 'PATCH', ...json(body) });

    const first = await patch({ status: 'done', clientUpdatedAt: task.updatedAt });
    expect(first.status).toBe(200);
    expect(TaskSchema.parse(await first.json()).status).toBe('done');

    // A second client still holding the original updatedAt.
    const second = await patch({ status: 'todo', clientUpdatedAt: task.updatedAt });
    expect(second.status).toBe(409);
    expect(ApiErrorSchema.parse(await second.json()).error.code).toBe('CONFLICT');
  });

  it('answers an unknown task with 404', async () => {
    const res = await makeApp().request('/api/tasks/task-404', {
      method: 'PATCH',
      ...json({ status: 'done', clientUpdatedAt: new Date().toISOString() }),
    });
    expect(res.status).toBe(404);
  });
});
