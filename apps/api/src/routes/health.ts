import { HealthSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { Deps } from '../app';
import { VERSION } from '../config';
import { respond } from '../lib/http';

export const healthRoutes = ({ config }: Deps) =>
  new Hono().get('/health', (c) =>
    respond(c, HealthSchema, { ok: true, dataSource: config.DATA_SOURCE, version: VERSION }),
  );
