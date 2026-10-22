import { WeatherSchema } from '@saqi/shared';
import { Hono } from 'hono';
import type { Deps } from '../app';
import { respond } from '../lib/http';

export const weatherRoutes = ({ weather }: Deps) =>
  new Hono().get('/weather', async (c) => {
    c.header('Cache-Control', 'public, max-age=300');
    return respond(c, WeatherSchema, await weather.getWeather());
  });
