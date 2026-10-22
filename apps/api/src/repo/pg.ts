import { NotImplementedError, type Repo } from './types';

const todo = (method: string) => () =>
  Promise.reject(new NotImplementedError(`pg repo ${method}() is not implemented yet (T07)`));

/** TODO(T07): Drizzle queries over db/schema.ts via the Neon HTTP driver. */
export function createPgRepo(): Repo {
  return {
    getFarm: todo('getFarm'),
    getSeedAnchor: todo('getSeedAnchor'),
    getReadings: todo('getReadings'),
    getLatestReadings: todo('getLatestReadings'),
    getEvents: todo('getEvents'),
    addEvent: todo('addEvent'),
    getUsage: todo('getUsage'),
    getAllocation: todo('getAllocation'),
    getTasks: todo('getTasks'),
    updateTask: todo('updateTask'),
    getWeatherCache: todo('getWeatherCache'),
    setWeatherCache: todo('setWeatherCache'),
  };
}
