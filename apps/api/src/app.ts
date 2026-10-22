import { Hono } from 'hono';

export const app = new Hono();

app.get('/api/health', (c) => c.json({ ok: true, dataSource: 'memory', version: '0.1.0' }));
