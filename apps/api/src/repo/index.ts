import type { Config } from '../config';
import { buildInlineSeed, createMemoryRepo } from './memory';
import { createPgRepo } from './pg';
import type { Repo } from './types';

export function createRepo(config: Config): Repo {
  return config.DATA_SOURCE === 'pg'
    ? createPgRepo()
    : createMemoryRepo(buildInlineSeed(new Date()));
}
