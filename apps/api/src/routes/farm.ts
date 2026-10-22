import { FarmSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { Deps } from '../app';
import { respond } from '../lib/http';

export const farmRoutes = ({ repo }: Deps) =>
  new Hono().get('/farm', async (c) => {
    c.header('Cache-Control', 'public, max-age=3600');
    return respond(c, FarmSchema, await repo.getFarm());
  });
