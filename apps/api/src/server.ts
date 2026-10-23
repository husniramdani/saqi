import { serve } from '@hono/node-server';
import { app } from './app';
import { loadConfig } from './config';

const port = loadConfig().PORT;
serve({ fetch: app.fetch, port }, () => {
  console.log(`api listening on http://localhost:${port}`);
});
