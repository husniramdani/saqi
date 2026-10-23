# Saqi

[![CI](https://github.com/husniramdani/saqi/actions/workflows/ci.yml/badge.svg)](https://github.com/husniramdani/saqi/actions/workflows/ci.yml)

Saqi tells a UAE farm how much to irrigate each block tonight, and why. The farm (Farm 07, Al Ain) is fictional and its sensors are simulated.

Live: **[saqi.spindyzel.com](https://saqi.spindyzel.com)** (also [saqi-web.vercel.app](https://saqi-web.vercel.app); API: [saqi-api.vercel.app/api/health](https://saqi-api.vercel.app/api/health)). Weather and ET₀ are live from Open-Meteo; the sensors are simulated and the UI says so. Working notes and decisions: [NOTES.md](NOTES.md).

## Run it locally

```bash
nvm use            # Node 22
pnpm i             # pnpm 9
pnpm dev           # web http://localhost:5173 · API http://localhost:8787 (memory data, SCENARIOS=1)
```

## Tests and CI

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # the gate before every commit
pnpm e2e           # Playwright: 7 journeys, axe (en, ar), memory API, frozen clock (~25 s)
pnpm e2e:docker    # the same with the browser in Linux, so visual snapshots are compared
pnpm stats         # after test:ci + e2e: writes apps/web/public/test-stats.json
pnpm og            # re-renders apps/web/public/og.png (dev /og route, Linux browser in Docker)
```

GitHub Actions (`.github/workflows/ci.yml`) runs on every push and pull request, with no secrets:
`verify` (design check, lint, types, unit and API tests, build), then `e2e` inside the
Playwright image that renders the visual baselines, which also writes the test stats.
`snapshots.yml` re-renders the baselines on demand.

## Structure

```
saqi/
├── apps/
│   ├── web/                 Vite + React 19, React Router 7, TanStack Query, react-i18next
│   │   └── src/
│   │       ├── app/         router, providers, AppShell, QueryState
│   │       ├── routes/      landing, today, block, field, making-of, not-found (lazy-loaded)
│   │       ├── api/         typed fetch client, query keys, hooks, outbox interface
│   │       ├── i18n/        en/ar/ur strings, setLocale (lang + dir), formatters
│   │       ├── features/    landing, farm-map, moisture-chart, recommendation, schedule, budget, weather, tasks, attention
│   │       ├── ui/          Nightfield design primitives
│   │       └── motion/      GSAP setup, tokens, presets (reduced motion jumps to the end)
│   └── api/                 Hono on Node (:8787) and Vercel
│       └── src/
│           ├── app.ts       createApp(deps), and the default export Vercel serves
│           ├── routes/      health, farm, weather, plan, blocks, tasks
│           ├── services/    plan (calls the engine), weather, timeshift, dev scenarios
│           ├── repo/        Repo interface, memory + pg implementations, contract suite
│           ├── db/          Drizzle schema + migrations
│           └── sim/         seeded PRNG, simulator, recorded Open-Meteo fixtures
└── packages/
    ├── shared/              zod contracts, inferred types, Farm 07 fixture, task templates
    ├── engine/              pure planDay pipeline: PAW, decisions, budget guard, schedule
    └── tokens/              design.md → Tailwind @theme + TS tokens (Day and Night), validated
```

## API

| Method + path                              | Returns                                        |
| ------------------------------------------ | ---------------------------------------------- |
| `GET /api/health`                          | `{ ok, dataSource, version, seedAnchor }`      |
| `GET /api/farm`                            | `Farm`                                         |
| `GET /api/weather`                         | `Weather`                                      |
| `GET /api/plan/today`                      | `DayPlan`                                      |
| `GET /api/blocks/:id/readings?days=1..30`  | `SensorSeries[]`                               |
| `GET /api/blocks/:id/events?days=1..30`    | `IrrigationEvent[]`                            |
| `POST /api/blocks/:id/events`              | `IrrigationEvent` (201)                        |
| `GET /api/blocks/:id/recommendation`       | `BlockDecision`                                |
| `GET /api/tasks?date=YYYY-MM-DD&assignee=` | `Task[]`                                       |
| `PATCH /api/tasks/:id`                     | `Task`, or 409 when `clientUpdatedAt` is stale |

Errors always look like `{ "error": { "code", "message", "details"? } }` with codes `NOT_FOUND` (404), `VALIDATION` (422), `CONFLICT` (409), `UPSTREAM` (502) and `INTERNAL` (500).

## Production

Two Vercel projects build from this repo's `main`: **saqi-web** (root `apps/web`, Vite, `pnpm build` → `dist`) and **saqi-api** (root `apps/api`, Hono). Both use Node 22 and pnpm 9.15.9 from `packageManager` (`ENABLE_EXPERIMENTAL_COREPACK=1`); the install runs at the workspace root, so the shared packages and the tokens' `postinstall` come along.

**The API runs in memory mode, with no database.** Each function instance builds Farm 07's scenario for the current hour (`repo/hourly.ts`, 60–180 ms) and rebuilds it when the hour turns, so every time on screen is real wall-clock time. There is no seed to run and nothing to migrate. The Postgres repo was never built (`repo/pg.ts`); its schema and migrations stay for later.

What that costs: a Field "Mark done" or a manual irrigation log lives in the memory of the function instance that took it. It lasts for that instance and that GST day, and can reset when Vercel recycles an instance or starts another. Field says so under its heading.

**API build:** the zero-config Hono entry is the default export of `src/app.ts`. The project sets `VERCEL_EXPERIMENTAL_BACKENDS=1`, Vercel's newer backend build. It compiles the workspace packages, which export TypeScript source with extensionless imports, and the JSON fixtures. The default build fails on them.

| Project  | Environment variables (Production)                                                                                                                                                                                                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saqi-api | `DATA_SOURCE=memory`, `CORS_ORIGIN=https://saqi.spindyzel.com,https://saqi-web.vercel.app` (comma-separated list), `FARM_LAT=24.21`, `FARM_LON=55.74`, `WEATHER_TTL_SECONDS=1800`, `VERCEL_EXPERIMENTAL_BACKENDS=1`, `ENABLE_EXPERIMENTAL_COREPACK=1` |
| saqi-web | `VITE_API_URL=https://saqi-api.vercel.app` (read at build time), `ENABLE_EXPERIMENTAL_COREPACK=1`                                                                                                                                                     |

The dev switches `NOW`, `WEATHER_FIXTURE` and `SCENARIOS` stay off: the API refuses to start with any of them on Vercel. No variable is a secret, and none is committed.

**Redeploy:** push to `main` and both projects build. To deploy the working tree instead, run `vercel deploy --prod` in `apps/api` or `apps/web` (after `vercel link --repo` at the root). If you change `VITE_API_URL`, rebuild the web; the API picks up its variables on the next deploy. Before a release, refresh the Making-of counters with `pnpm test:ci && pnpm e2e && pnpm stats` and commit `apps/web/public/test-stats.json`: Vercel builds from git, not from CI.

**Check it:**

```bash
pnpm smoke --base https://saqi.spindyzel.com --api https://saqi-api.vercel.app
```

It checks health (memory mode), the plan against `DayPlanSchema`, live weather, CORS both ways, that `?scenario=` does nothing, the public landing page on `/`, the cockpit on `/today`, the SPA entries `/blocks/D-1`, `/field`, and `/making-of`, and the social image.
