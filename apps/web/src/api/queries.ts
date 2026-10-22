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
  type TaskPatch,
} from '@saqi/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet, apiPatch, apiPost } from './client';
import { keys } from './keys';

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

// TODO(T17): optimistic update + offline outbox on network failure.
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: TaskPatch & { id: string }) =>
      apiPatch(`/api/tasks/${encodeURIComponent(id)}`, TaskSchema, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.tasks }),
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
