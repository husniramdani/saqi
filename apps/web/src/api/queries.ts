import {
  BlockDecisionSchema,
  DayPlanSchema,
  FarmSchema,
  IrrigationEventSchema,
  SensorSeriesSchema,
  TaskSchema,
  WeatherSchema,
  type Assignee,
  type IrrigationEvent,
  type NewIrrigationEvent,
  type Task,
  type TaskPatch,
} from '@saqi/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError, apiGet, apiPatch, apiPost } from './client';
import { keys } from './keys';
import { outbox } from './outbox';

const SeriesList = z.array(SensorSeriesSchema);
const EventList = z.array(IrrigationEventSchema);
const TaskList = z.array(TaskSchema);
const block = (id: string) => `/api/blocks/${encodeURIComponent(id)}`;

export const useFarm = () =>
  useQuery({ queryKey: keys.farm, queryFn: () => apiGet('/api/farm', FarmSchema) });

export const useWeather = () =>
  useQuery({ queryKey: keys.weather, queryFn: () => apiGet('/api/weather', WeatherSchema) });

export const usePlanToday = () =>
  useQuery({ queryKey: keys.planToday, queryFn: () => apiGet('/api/plan/today', DayPlanSchema) });

export const useReadings = (blockId: string, days = 14) =>
  useQuery({
    queryKey: keys.readings(blockId, days),
    queryFn: () => apiGet(`${block(blockId)}/readings?days=${days}`, SeriesList),
  });

export const useEvents = (blockId: string, days = 30) =>
  useQuery({
    queryKey: keys.events(blockId, days),
    queryFn: () => apiGet(`${block(blockId)}/events?days=${days}`, EventList),
  });

export const useRecommendation = (blockId: string) =>
  useQuery({
    queryKey: keys.recommendation(blockId),
    queryFn: () => apiGet(`${block(blockId)}/recommendation`, BlockDecisionSchema),
  });

export const useTasks = (date: string, assignee?: Assignee) =>
  useQuery({
    queryKey: keys.tasksFor(date, assignee),
    queryFn: () => {
      const query = new URLSearchParams({ date });
      if (assignee) query.set('assignee', assignee);
      return apiGet(`/api/tasks?${query}`, TaskList);
    },
  });

/**
 * Update a task, offline-safe (plan/02 §3.2): the cache updates at once; then PATCH. Without a
 * connection (offline, or no answer at all) a "done" goes to the outbox instead and syncs later.
 * Other failures (a 409 conflict, a validation error) roll back and reach the caller.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    // Offline is handled here (the outbox survives a reload); TanStack's own pause would not.
    networkMode: 'always',
    mutationFn: async ({
      id,
      ...patch
    }: TaskPatch & { id: string }): Promise<{ queued: boolean }> => {
      const queue = () => {
        outbox.enqueue({
          id: crypto.randomUUID(),
          type: 'task.done',
          taskId: id,
          clientUpdatedAt: patch.clientUpdatedAt,
          createdAt: new Date().toISOString(),
          ...(patch.note ? { note: patch.note } : {}),
        });
        return { queued: true };
      };
      if (patch.status === 'done' && !navigator.onLine) return queue();
      try {
        await apiPatch(`/api/tasks/${encodeURIComponent(id)}`, TaskSchema, patch);
        return { queued: false };
      } catch (err) {
        if (patch.status === 'done' && err instanceof ApiError && err.code === 'NETWORK')
          return queue();
        throw err;
      }
    },
    onMutate: async ({ id, status, note }) => {
      await queryClient.cancelQueries({ queryKey: keys.tasks });
      const previous = queryClient.getQueriesData<Task[]>({ queryKey: keys.tasks });
      queryClient.setQueriesData<Task[]>({ queryKey: keys.tasks }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status, ...(note ? { note } : {}) } : t)),
      );
      return { previous };
    },
    onError: (_err, _patch, context) => {
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: (result) => {
      // A queued change has nothing to fetch yet; the outbox sync refreshes after it lands.
      if (!result?.queued) void queryClient.invalidateQueries({ queryKey: keys.tasks });
    },
  });
}

export function useLogEvent(blockId: string) {
  const queryClient = useQueryClient();
  const eventsKey = [...keys.block(blockId), 'events'];
  return useMutation({
    mutationFn: (event: NewIrrigationEvent) =>
      apiPost(`${block(blockId)}/events`, IrrigationEventSchema, event),
    // Optimistic: the log shows at once, newest first; rolled back if the API refuses it.
    onMutate: async (event) => {
      await queryClient.cancelQueries({ queryKey: eventsKey });
      const previous = queryClient.getQueriesData<IrrigationEvent[]>({ queryKey: eventsKey });
      const pending: IrrigationEvent = {
        ...event,
        id: `pending-${event.startedAt}`,
        blockId,
        status: 'done',
        source: 'manual',
      };
      queryClient.setQueriesData<IrrigationEvent[]>({ queryKey: eventsKey }, (old) =>
        old ? [pending, ...old].sort((a, b) => b.startedAt.localeCompare(a.startedAt)) : old,
      );
      return { previous };
    },
    onError: (_err, _event, context) => {
      for (const [key, data] of context?.previous ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.block(blockId) }),
        queryClient.invalidateQueries({ queryKey: keys.planToday }),
      ]),
  });
}
