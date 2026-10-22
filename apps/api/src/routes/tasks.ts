import { zValidator } from '@hono/zod-validator';
import { AssigneeSchema, IsoDateSchema, TaskPatchSchema, TaskSchema } from '@saqi/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Deps } from '../app';
import { respond, throwOnInvalid } from '../lib/http';

const TasksQuery = z.object({ date: IsoDateSchema, assignee: AssigneeSchema.optional() });

export const taskRoutes = ({ repo }: Deps) =>
  new Hono()
    .get('/tasks', zValidator('query', TasksQuery, throwOnInvalid), async (c) =>
      respond(c, z.array(TaskSchema), await repo.getTasks(c.req.valid('query'))),
    )
    .patch('/tasks/:id', zValidator('json', TaskPatchSchema, throwOnInvalid), async (c) =>
      respond(c, TaskSchema, await repo.updateTask(c.req.param('id'), c.req.valid('json'))),
    );
