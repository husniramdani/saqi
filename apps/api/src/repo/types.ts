import type {
  Assignee,
  Farm,
  IrrigationEvent,
  SensorSeries,
  Task,
  TaskPatch,
  Weather,
} from '@saqi/shared';

/**
 * One data interface, two implementations (memory, pg), one contract suite (plan/03 §3).
 * Timestamps are stored un-shifted (seed time); time-shifting happens in services.
 */
export interface Repo {
  getFarm(): Promise<Farm>;
  /** The ISO hour the stored history ends on (meta.seed_anchor). */
  getSeedAnchor(): Promise<string>;
  getReadings(blockId: string, sinceIso: string): Promise<SensorSeries[]>;
  /** By sensorId, the last 48 h. */
  getLatestReadings(): Promise<Record<string, SensorSeries>>;
  getEvents(blockId: string, sinceIso: string): Promise<IrrigationEvent[]>;
  addEvent(e: Omit<IrrigationEvent, 'id'>): Promise<IrrigationEvent>;
  /** Sum of `done` irrigation, m³, for events starting in [sinceIso, untilIso). */
  getUsage(sinceIso: string, untilIso: string): Promise<number>;
  getAllocation(month: string): Promise<number>;
  getTasks(q: { date: string; assignee?: Assignee | undefined }): Promise<Task[]>;
  /** Throws ConflictError when `clientUpdatedAt` is older than the stored task. */
  updateTask(id: string, patch: TaskPatch): Promise<Task>;
  getWeatherCache(key: string): Promise<{ payload: Weather; fetchedAt: string } | null>;
  setWeatherCache(key: string, payload: Weather): Promise<void>;
}

export interface ReadingRow {
  sensorId: string;
  ts: string;
  paw: number;
  vwc: number;
}

/** Everything a repo is seeded with. T08's simulator produces the realistic version. */
export interface SeedData {
  /** ISO hour the data ends on (stored as meta.seed_anchor in pg). */
  anchor: string;
  farm: Farm;
  readings: ReadingRow[];
  events: IrrigationEvent[];
  tasks: Task[];
  /** Allocation in m³ by month (YYYY-MM). */
  allocations: Record<string, number>;
}

export class NotFoundError extends Error {
  override name = 'NotFoundError';
}

export class ConflictError extends Error {
  override name = 'ConflictError';
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export class UpstreamError extends Error {
  override name = 'UpstreamError';
}

export class NotImplementedError extends Error {
  override name = 'NotImplementedError';
}
