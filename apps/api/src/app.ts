import { Hono, type ErrorHandler, type NotFoundHandler } from 'hono';
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
import { ScenarioSchema, withScenario, type Scenario } from './services/scenario';
import { withTimeShift } from './services/timeshift';
import { workedExampleFetch } from './sim/workedExample';
import { createWeatherService, type WeatherService } from './services/weather';

export interface Deps {
  config: Config;
  repo: Repo;
  weather: WeatherService;
  now: () => Date;
}

/** What routes receive: the deps plus the plan service built on them. */
export type RouteDeps = Deps & { plan: PlanService };

const onError: ErrorHandler = (err, c) => {
  const { status, body } = toErrorResponse(err);
  if (status >= 500) console.error(`[${c.get('requestId')}]`, err);
  return c.json(body, status);
};
const onNotFound: NotFoundHandler = (c) => c.json(notFoundBody(c.req.path), 404);

export function createApp(deps: Deps) {
  const app = new Hono();

  app.use('*', requestId(), secureHeaders(), cors({ origin: deps.config.CORS_ORIGIN }));

  app.onError(onError);
  app.notFound(onNotFound);

  // Dev scenarios (T20), memory mode only: `?scenario=` hands the request to the same routes
  // built on overridden deps. pg never sees them; an unknown name is just the normal app.
  if (deps.config.DATA_SOURCE === 'memory') {
    const variants = new Map<Scenario, Hono>();
    app.use('/api/*', async (c, next) => {
      const scenario = ScenarioSchema.safeParse(c.req.query('scenario'));
      if (!scenario.success) return next();
      let variant = variants.get(scenario.data);
      if (!variant) {
        // Fetched on its own, so it needs the app's error handling too.
        variant = apiRoutes(withScenario(deps, scenario.data))
          .onError(onError)
          .notFound(onNotFound);
        variants.set(scenario.data, variant);
      }
      c.res = await variant.fetch(c.req.raw);
    });
  }

  app.route('/', apiRoutes(deps));
  return app;
}

/** Every `/api` route, each with its own plan service (so each scenario memoises its own plan). */
function apiRoutes(deps: Deps) {
  const routeDeps: RouteDeps = { ...deps, plan: createPlanService(deps) };
  const api = new Hono();
  for (const routes of [
    healthRoutes,
    farmRoutes,
    weatherRoutes,
    planRoutes,
    blockRoutes,
    taskRoutes,
  ]) {
    api.route('/api', routes(routeDeps));
  }
  return api;
}

export function defaultDeps(): Deps {
  const config = loadConfig();
  const frozen = config.NOW;
  const now = frozen ? () => new Date(frozen) : () => new Date();
  const stored = createRepo(config, now);
  // pg: the stored scenario replayed at the current hour. Memory is already live (zero shift).
  const repo = withTimeShift(stored, now);
  const weather = createWeatherService({
    fetch: config.WEATHER_FIXTURE === '1' ? workedExampleFetch : globalThis.fetch,
    repo: stored,
    now,
    lat: config.FARM_LAT,
    lon: config.FARM_LON,
    ttlSeconds: config.WEATHER_TTL_SECONDS,
  });
  return { config, repo, weather, now };
}

export const app = createApp(defaultDeps());
