# Saqi

Saqi tells a UAE farm how much to irrigate each block tonight, and why. The farm (Farm 07, Al Ain) is fictional and its sensors are simulated.

> **Status: skeleton.** Structure, contracts, wiring and tests run end to end. The engine maths, simulator, live weather and all visual design are placeholders. See [NOTES.md](NOTES.md).

## Run it locally

```bash
nvm use            # Node 22
pnpm i             # pnpm 9
pnpm dev           # web http://localhost:5173 · API http://localhost:8787
```

## Tests and CI

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # the gate before every commit
pnpm e2e           # Playwright: 7 journeys, axe (en, ar), memory API, frozen clock (~25 s)
pnpm e2e:docker    # the same with the browser in Linux, so visual snapshots are compared
pnpm stats         # after test:ci + e2e: writes apps/web/public/test-stats.json
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
│   │       ├── routes/      today, block, field, making-of, not-found (lazy-loaded)
│   │       ├── api/         typed fetch client, query keys, hooks, outbox interface
│   │       ├── i18n/        en/ar/ur strings, setLocale (lang + dir), formatters
│   │       ├── features/    empty seams: farm-map, schedule, budget, weather, recommendation, tasks, moisture-chart
│   │       ├── ui/          empty seam: design primitives
│   │       └── motion/      empty seam: GSAP setup
│   └── api/                 Hono on Node (:8787) and Vercel
│       └── src/
│           ├── app.ts       createApp(deps): middleware, error mapping, routes
│           ├── routes/      health, farm, weather, plan, blocks, tasks
│           ├── services/    plan (calls the engine), weather, timeshift
│           ├── repo/        Repo interface, memory + pg implementations, contract suite
│           ├── db/          Drizzle schema + migrations
│           └── sim/         seeded PRNG (simulator comes in T08)
└── packages/
    ├── shared/              zod contracts, inferred types, Farm 07 fixture, task templates
    ├── engine/              pure planDay pipeline (placeholder maths)
    └── tokens/              design.md → Tailwind @theme + TS tokens (Day and Night), validated
```

## API

| Method + path                              | Returns                                        |
| ------------------------------------------ | ---------------------------------------------- |
| `GET /api/health`                          | `{ ok, dataSource, version }`                  |
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

## What is still placeholder

- **Engine:** every block is `skip` with 0 m³ and the schedule is empty (T05, T06).
- **Data:** memory mode serves 2 days of flat readings ending at the server's start hour (T08 simulator). Postgres mode throws `NotImplemented` (T07).
- **Weather:** a committed fixture, not Open-Meteo yet (T09).
- **Field:** marking a task done needs a connection; the offline outbox is a no-op (T17).
- **Design:** tokens, Tailwind and fonts are wired from `design.md` (Saqi Nightfield); components, screens and motion are not built yet, so pages are still plain HTML on the themed page (T03, T12–T15).
- **Arabic and Urdu:** UI strings are English copies; fixture names are translated (T18).
