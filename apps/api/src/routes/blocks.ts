import { zValidator } from '@hono/zod-validator';
import {
  BlockDecisionSchema,
  IrrigationEventSchema,
  NewIrrigationEventSchema,
  SensorSeriesSchema,
} from '@saqi/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { RouteDeps } from '../app';
import { respond, throwOnInvalid } from '../lib/http';
import { NotFoundError } from '../repo/types';

const DAY_MS = 86_400_000;
const daysQuery = (fallback: number) =>
  z.object({ days: z.coerce.number().int().min(1).max(30).default(fallback) });

export function blockRoutes({ repo, now, plan }: RouteDeps) {
  const requireBlock = async (id: string) => {
    const farm = await repo.getFarm();
    if (!farm.blocks.some((b) => b.id === id)) throw new NotFoundError(`Block ${id} not found`);
  };
  const daysAgo = (days: number) => new Date(now().getTime() - days * DAY_MS).toISOString();

  return new Hono()
    .get('/blocks/:id/readings', zValidator('query', daysQuery(14), throwOnInvalid), async (c) => {
      const id = c.req.param('id');
      await requireBlock(id);
      const series = await repo.getReadings(id, daysAgo(c.req.valid('query').days));
      return respond(c, z.array(SensorSeriesSchema), series);
    })
    .get('/blocks/:id/events', zValidator('query', daysQuery(30), throwOnInvalid), async (c) => {
      const id = c.req.param('id');
      await requireBlock(id);
      const events = await repo.getEvents(id, daysAgo(c.req.valid('query').days));
      return respond(c, z.array(IrrigationEventSchema), events);
    })
    .post(
      '/blocks/:id/events',
      zValidator('json', NewIrrigationEventSchema, throwOnInvalid),
      async (c) => {
        const id = c.req.param('id');
        await requireBlock(id);
        const event = await repo.addEvent({
          ...c.req.valid('json'),
          blockId: id,
          status: 'done',
          source: 'manual',
        });
        plan.invalidate(); // a manual log changes this month's usage
        return respond(c, IrrigationEventSchema, event, 201);
      },
    )
    .get('/blocks/:id/recommendation', async (c) => {
      const id = c.req.param('id');
      const decision = (await plan.today()).decisions.find((d) => d.blockId === id);
      if (!decision) throw new NotFoundError(`Block ${id} not found`);
      return respond(c, BlockDecisionSchema, decision);
    });
}
