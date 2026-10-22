import type { Config } from '../config';
import { createHourlyMemoryRepo } from './hourly';
import { createPgRepo } from './pg';
import type { Repo } from './types';

/**
 * Memory mode rebuilds the simulated scenario for the current hour (real wall-clock history).
 * pg mode stores one seed and is time-shifted on read (services/timeshift.ts).
 */
export function createRepo(config: Config, now: () => Date): Repo {
  return config.DATA_SOURCE === 'pg' ? createPgRepo() : createHourlyMemoryRepo(now);
}
