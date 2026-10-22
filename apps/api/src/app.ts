import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { loadConfig, type Config } from './config';
import { notFoundBody, toErrorResponse } from './lib/http';
import { createRepo } from './repo';
import type { Repo } from './repo/types';
import { blockRoutes } from './routes/blocks';
import { farmRoutes } from './routes/farm';
import { healthRoutes } from './routes/health';
import { planRoutes } from './routes/plan';
import { taskRoutes } from './routes/tasks';
import { weatherRoutes } from './routes/weather';
import { createPlanService, type PlanService } from './services/plan';
import { withTimeShift } from './services/timeshift';
import { createWeatherService, type WeatherService } from './services/weather';

export interface Deps {
  config: Config;
  repo: Repo;
  weather: WeatherService;
  now: () => Date;
}

/** What routes receive: the deps plus the plan service built on them. */
export type RouteDeps = Deps & { plan: PlanService };

export function createApp(deps: Deps) {
  const app = new Hono();

  app.use('*', requestId(), secureHeaders(), cors({ origin: deps.config.CORS_ORIGIN }));

  app.onError((err, c) => {
    const { status, body } = toErrorResponse(err);
    if (status >= 500) console.error(`[${c.get('requestId')}]`, err);
    return c.json(body, status);
  });
  app.notFound((c) => c.json(notFoundBody(c.req.path), 404));

  const routeDeps: RouteDeps = { ...deps, plan: createPlanService(deps) };

  for (const routes of [
    healthRoutes,
    farmRoutes,
    weatherRoutes,
    planRoutes,
    blockRoutes,
    taskRoutes,
  ]) {
    app.route('/api', routes(routeDeps));
  }
  return app;
}

export function defaultDeps(): Deps {
  const config = loadConfig();
  const now = () => new Date();
  const stored = createRepo(config, now);
  // pg: the stored scenario replayed at the current hour. Memory is already live (zero shift).
  const repo = withTimeShift(stored, now);
  const weather = createWeatherService({
    fetch: globalThis.fetch,
    repo: stored,
    now,
    lat: config.FARM_LAT,
    lon: config.FARM_LON,
    ttlSeconds: config.WEATHER_TTL_SECONDS,
  });
  return { config, repo, weather, now };
}

export const app = createApp(defaultDeps());
