/**
 * Writes apps/web/public/test-stats.json for the Making-of counters (scene 4) from the test
 * runners' own JSON reports: Vitest per package (`pnpm test:ci`) and Playwright (`pnpm e2e`).
 * Runs on Node's built-in type stripping: `pnpm stats` locally, after the e2e job in CI.
 * Refuses to write from a red run: the page only ever shows counts that passed.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'apps/web/public/test-stats.json');

const VitestReport = z.object({
  success: z.boolean(),
  numPassedTests: z.number().int().nonnegative(),
  numFailedTests: z.number().int().nonnegative(),
  startTime: z.number(),
  testResults: z.array(z.object({ endTime: z.number() })),
});
const PlaywrightReport = z.object({
  stats: z.object({
    expected: z.number().int().nonnegative(),
    unexpected: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative(),
    duration: z.number().nonnegative(),
  }),
});

/** Same shape the web validates (routes/making-of/data.ts), plus provenance. */
const TestStats = z.object({
  engine: z.number().int().nonnegative(),
  api: z.number().int().nonnegative(),
  web: z.number().int().nonnegative(),
  e2e: z.number().int().nonnegative(),
  durationSec: z.number().nonnegative().nullable(),
  commit: z.string(),
  at: z.iso.datetime(),
});

function read<S extends z.ZodType>(path: string, schema: S, howToMake: string): z.output<S> {
  const file = join(ROOT, path);
  if (!existsSync(file)) throw new Error(`${path} is missing. Produce it with: ${howToMake}`);
  return schema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

function vitest(pkg: string) {
  const r = read(`${pkg}/.vitest/results.json`, VitestReport, 'pnpm test:ci');
  if (!r.success || r.numFailedTests > 0)
    throw new Error(`${pkg} has failing tests; not writing stats.`);
  const end = Math.max(r.startTime, ...r.testResults.map((t) => t.endTime));
  return { passed: r.numPassedTests, ms: end - r.startTime };
}

const engine = vitest('packages/engine');
const api = vitest('apps/api');
const web = vitest('apps/web');
const e2e = read('apps/web/.playwright/results.json', PlaywrightReport, 'pnpm e2e').stats;
if (e2e.unexpected > 0) throw new Error('E2E has failing tests; not writing stats.');

/** GITHUB_SHA in Actions; git locally; "unknown" in a copy without history (provenance only). */
function commitSha(): string {
  const fromCi = process.env['GITHUB_SHA'];
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'unknown';
  }
}
const commit = commitSha();

const stats = TestStats.parse({
  engine: engine.passed,
  api: api.passed,
  web: web.passed,
  e2e: e2e.expected + e2e.flaky,
  // Summed test runtime (each runner's own clock), not the CI job's wall time.
  durationSec: Math.round((engine.ms + api.ms + web.ms + e2e.duration) / 1000),
  commit,
  at: new Date().toISOString(),
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(stats, null, 2)}\n`);
console.log(`test-stats.json: ${JSON.stringify(stats)}`);
