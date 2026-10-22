import type { Assignee } from '@saqi/shared';

export const keys = {
  farm: ['farm'] as const,
  weather: ['weather'] as const,
  planToday: ['plan', 'today'] as const,
  block: (blockId: string) => ['blocks', blockId] as const,
  readings: (blockId: string, days: number) => ['blocks', blockId, 'readings', days] as const,
  events: (blockId: string, days: number) => ['blocks', blockId, 'events', days] as const,
  recommendation: (blockId: string) => ['blocks', blockId, 'recommendation'] as const,
  tasks: ['tasks'] as const,
  tasksFor: (date: string, assignee?: Assignee) => ['tasks', date, assignee ?? 'all'] as const,
};
