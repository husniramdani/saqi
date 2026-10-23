/**
 * Smoke test against a deployed Saqi: `pnpm smoke --base <web URL> --api <API URL>`.
 * Checks the API's health, contracts (shared zod schemas), live weather, CORS, that dev
 * scenarios are off, and that the web serves the app shell on every deep link.
 * Runs on Node's type stripping (scripts/resolve-ts.ts loads @saqi/shared). Exits 1 on a failure.
 */
import { parseArgs } from 'node:util';
import { DayPlanSchema, HealthSchema, WeatherSchema } from '@saqi/shared';
import type { z } from 'zod';

const { values } = parseArgs({
  options: { base: { type: 'string' }, api: { type: 'string' } },
});
if (!values.base || !values.api) {
  console.error('Usage: pnpm smoke --base https://<web> --api https://<api>');
  process.exit(2);
}
const WEB = new URL(values.base).origin;
const API = new URL(values.api).origin;
const FOREIGN = 'https://example.com';
const TIMEOUT_MS = 20_000;

const get = (url: string, headers: Record<string, string> = {}, method = 'GET') =>
  fetch(url, { method, headers, signal: AbortSignal.timeout(TIMEOUT_MS) });

async function json<S extends z.ZodType>(path: string, schema: S): Promise<z.output<S>> {
  const res = await get(`${API}${path}`);
  if (!res.ok) throw new Error(`${path} answered ${res.status}`);
  return schema.parse(await res.json());
}

function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const checks: [name: string, run: () => Promise<string>][] = [
  [
    'API health, memory mode',
    async () => {
      const health = await json('/api/health', HealthSchema);
      expect(health.ok, 'health is not ok');
      expect(health.dataSource === 'memory', `dataSource is ${health.dataSource}`);
      return `v${health.version}, anchor ${health.seedAnchor}`;
    },
  ],
  [
    "Today's plan matches DayPlanSchema",
    async () => {
      const plan = await json('/api/plan/today', DayPlanSchema);
      return `${plan.date}, ${plan.decisions.length} blocks, budget ${plan.budget.status}`;
    },
  ],
  [
    'Weather is live (not stale)',
    async () => {
      const weather = await json('/api/weather', WeatherSchema);
      expect(!weather.stale, `stale since ${weather.fetchedAt}`);
      return `fetched ${weather.fetchedAt}`;
    },
  ],
  [
    'CORS allows the web origin, including the PATCH preflight',
    async () => {
      const simple = await get(`${API}/api/health`, { Origin: WEB });
      const allowed = simple.headers.get('access-control-allow-origin');
      expect(allowed === WEB, `allow-origin is ${allowed ?? 'missing'}`);
      const preflight = await get(
        `${API}/api/tasks/task-1`,
        {
          Origin: WEB,
          'Access-Control-Request-Method': 'PATCH',
          'Access-Control-Request-Headers': 'content-type',
        },
        'OPTIONS',
      );
      const methods = preflight.headers.get('access-control-allow-methods') ?? '';
      expect(preflight.ok, `preflight answered ${preflight.status}`);
      expect(methods.includes('PATCH'), `preflight allows "${methods}"`);
      return `allow-origin ${allowed}, preflight ${methods}`;
    },
  ],
  [
    'CORS refuses a foreign origin',
    async () => {
      const res = await get(`${API}/api/health`, { Origin: FOREIGN });
      const allowed = res.headers.get('access-control-allow-origin');
      expect(allowed === null, `allow-origin is ${allowed} for ${FOREIGN}`);
      return `no allow-origin for ${FOREIGN}`;
    },
  ],
  [
    '?scenario= has no effect',
    async () => {
      const weather = await json('/api/weather?scenario=weather-stale', WeatherSchema);
      expect(!weather.stale, 'weather-stale made the weather stale');
      const [normal, over] = await Promise.all([
        json('/api/plan/today', DayPlanSchema),
        json('/api/plan/today?scenario=budget-over', DayPlanSchema),
      ]);
      expect(
        over.budget.status === normal.budget.status,
        `budget-over changed the budget to ${over.budget.status}`,
      );
      return `weather fresh, budget ${over.budget.status} as without it`;
    },
  ],
  ...['/', '/blocks/D-1', '/field', '/making-of'].map((path): [string, () => Promise<string>] => [
    `Web ${path} serves the app shell`,
    async () => {
      const res = await get(`${WEB}${path}`);
      expect(res.status === 200, `answered ${res.status}`);
      const html = await res.text();
      expect(html.includes('<div id="root"></div>'), 'no #root in the page');
      const script = /<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"/.exec(html);
      expect(script?.[1] !== undefined, 'no built entry script');
      const entry = await get(`${WEB}${script[1]}`);
      const type = entry.headers.get('content-type') ?? '';
      expect(entry.ok && type.includes('javascript'), `entry is ${entry.status} ${type}`);
      return script[1];
    },
  ]),
  [
    'Social image resolves',
    async () => {
      const html = await (await get(`${WEB}/`)).text();
      const image = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
      expect(image !== undefined, 'no og:image');
      const res = await get(image);
      const type = res.headers.get('content-type');
      expect(res.ok && type === 'image/png', `${image} is ${res.status} ${type}`);
      return image;
    },
  ],
];

console.log(`Smoke: web ${WEB} · API ${API}\n`);
let failed = 0;
for (const [name, run] of checks) {
  try {
    console.log(`✓ ${name} (${await run()})`);
  } catch (err) {
    failed += 1;
    console.log(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
console.log(
  failed
    ? `\n${failed} of ${checks.length} checks failed.`
    : `\nAll ${checks.length} checks passed.`,
);
process.exit(failed ? 1 : 0);
