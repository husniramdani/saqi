import { DayPlanSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { Deps } from '../app';
import { respond } from '../lib/http';
import { getPlanToday } from '../services/plan';

export const planRoutes = (deps: Deps) =>
  new Hono().get('/plan/today', async (c) => respond(c, DayPlanSchema, await getPlanToday(deps)));
