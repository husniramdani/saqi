/**
 * pnpm --filter api seed
 * Memory mode: builds the deterministic seed and prints the scenario summary.
 * pg mode: TODO(T07) truncate and bulk-insert the same seed (needs the Neon client).
 */
import { blockPaw } from '@saqi/engine';
import { gstDate, sensorsForBlock } from '@saqi/shared';
import { loadConfig } from '../src/config';
import { createMemoryRepo } from '../src/repo/memory';
import { buildSeed, monthProjection, recordedEt0 } from '../src/sim/seed';

const started = performance.now();
const config = loadConfig();
if (config.DATA_SOURCE === 'pg') {
  console.error(
    'Seeding Postgres lands with T07 (Drizzle client + bulk insert). Run without DATA_SOURCE=pg.',
  );
  process.exit(1);
}

const seed = buildSeed();
const latest = await createMemoryRepo(seed).getLatestReadings();
const month = gstDate(seed.anchor).slice(0, 7);
const allocation = seed.allocations[month] ?? 0;

const rows = seed.farm.blocks.map((block) => {
  const series = sensorsForBlock(seed.farm, block.id).flatMap((s) => {
    const found = latest[s.id];
    return found ? [{ ...found, weight: s.weight }] : [];
  });
  const info = blockPaw(block, series, seed.anchor);
  const events = seed.events.filter((e) => e.blockId === block.id);
  return {
    block: block.id,
    'PAW at anchor %': info.paw === null ? 'n/a' : info.paw.toFixed(1),
    confidence: info.confidence,
    stale: info.staleSensors.map((s) => `${s.sensorId} ${s.hours} h`).join(', ') || '',
    'events (30 d)': events.length,
    'm³ used (30 d)': events.reduce((sum, e) => sum + e.volumeM3, 0).toFixed(1),
  };
});

console.log(`Seed anchor ${seed.anchor} (${gstDate(seed.anchor)} 21:00 GST)`);
console.table(rows);
console.log(
  `${seed.readings.length} readings · ${seed.events.length} events · ${seed.tasks.length} tasks`,
);
const projection = monthProjection(seed, recordedEt0());
const pct = (m3: number) => `${((m3 / allocation) * 100).toFixed(1)} %`;
console.log(
  `Allocation ${month}: ${allocation} m³ · projected ${pct(projection.beforeDeficit)} before deficit, ${pct(projection.afterFodderCut)} after the fodder cut`,
);
console.log(`Built in ${(performance.now() - started).toFixed(0)} ms`);
