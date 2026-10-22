import { HealthSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { Deps } from '../app';
import { VERSION } from '../config';
import { respond } from '../lib/http';

export const healthRoutes = ({ config, repo }: Deps) =>
  new Hono().get('/health', async (c) =>
    respond(c, HealthSchema, {
      ok: true,
      dataSource: config.DATA_SOURCE,
      version: VERSION,
      seedAnchor: await repo.getSeedAnchor(),
    }),
  );
