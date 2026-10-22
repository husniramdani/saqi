import { DayPlanSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { RouteDeps } from '../app';
import { respond } from '../lib/http';

export const planRoutes = ({ plan }: RouteDeps) =>
  new Hono().get('/plan/today', async (c) => respond(c, DayPlanSchema, await plan.today()));
