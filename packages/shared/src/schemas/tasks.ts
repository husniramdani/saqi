import { z } from 'zod';
import { I18nTextSchema, IsoDateSchema, IsoDateTimeSchema } from './common';

export const TaskKindSchema = z.enum(['inspect', 'maintenance', 'record', 'pest']);
export const AssigneeSchema = z.enum(['rahim', 'imran']);
export type Assignee = z.infer<typeof AssigneeSchema>;
export const TaskStatusSchema = z.enum(['todo', 'done']);

export const TaskSchema = z.object({
  id: z.string(),
  blockId: z.string().nullable(),
  kind: TaskKindSchema,
  title: I18nTextSchema,
  dueDate: IsoDateSchema,
  assignee: AssigneeSchema,
  status: TaskStatusSchema,
  note: z.string().optional(),
  updatedAt: IsoDateTimeSchema,
});
export type Task = z.infer<typeof TaskSchema>;

/** Body of `PATCH /api/tasks/:id`; 409 when `clientUpdatedAt` is older than the stored task. */
export const TaskPatchSchema = z.object({
  status: TaskStatusSchema,
  note: z.string().max(500).optional(),
  clientUpdatedAt: IsoDateTimeSchema,
});
export type TaskPatch = z.infer<typeof TaskPatchSchema>;

export const TaskTemplateSchema = TaskSchema.pick({
  blockId: true,
  kind: true,
  title: true,
  assignee: true,
}).extend({ key: z.string() });
export type TaskTemplate = z.infer<typeof TaskTemplateSchema>;
