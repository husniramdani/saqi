import type { Config } from '../config';
import { buildSeed } from '../sim/seed';
import { createMemoryRepo } from './memory';
import { createPgRepo } from './pg';
import type { Repo } from './types';

/** Memory mode serves the deterministic simulator seed, built once per process. */
export function createRepo(config: Config): Repo {
  return config.DATA_SOURCE === 'pg' ? createPgRepo() : createMemoryRepo(buildSeed());
}
