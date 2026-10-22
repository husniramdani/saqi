# Notes

Working notes for whoever (human or Claude Code) picks up the next task. Read this before starting one.

## TODO seams and the task that fills each

Search the code for `TODO(Txx)` to find each seam.

| Seam                                                 | Where                                                    | Filled by    |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------ |
| GSAP setup, MotionProvider                           | `apps/web/src/motion/` (empty), `app/providers.tsx`      | T15          |
| Postgres repo, Neon client, `db:migrate` driver      | `apps/api/src/repo/pg.ts` (throws `NotImplementedError`) | T07          |
| Shell freshness, Badge, SegmentedControl, mobile nav | `apps/web/src/app/AppShell.tsx`                          | T11          |
| Today, Block detail and Field screens                | `apps/web/src/routes/*`, `src/features/*` (empty)        | T12–T14, T17 |
| Offline outbox and optimistic task updates           | `apps/web/src/api/outbox.ts` (no-op), `useUpdateTask`    | T17          |
| Arabic and Urdu UI strings                           | `apps/web/src/i18n/ar.json`, `ur.json` (English copies)  | T18          |
| Making-of story                                      | `apps/web/src/routes/making-of.tsx`                      | T19          |

## Reason params (engine → web contract)

`en.json` already renders every `ReasonCode`, so the engine must emit these param names:

| Code                                 | Params                                                  |
| ------------------------------------ | ------------------------------------------------------- |
| `PAW_NOW`                            | `paw`                                                   |
| `PAW_PROJECTED`                      | `from`, `to`, `etcMm`                                   |
| `ABOVE_THRESHOLD`, `BELOW_THRESHOLD` | `threshold`                                             |
| `ET0_FORECAST`                       | `mm`                                                    |
| `REFILL_TO_TARGET`                   | `target`, `netMm`, `grossMm`                            |
| `SAVES_VS_FIXED`                     | `m3`                                                    |
| `GREENHOUSE_PULSES`                  | `count`, `m3` (per pulse; times come from the schedule) |
| `BUDGET_DEFICIT`                     | `factor`                                                |
| `SENSOR_STALE`                       | `sensorId`, `hours`                                     |
| `LOW_CONFIDENCE`                     | none                                                    |
| `WINDOW_ASSIGNED`                    | `start`, `end` (formatted `HH:mm`)                      |
| `WINDOW_OVERFLOW`                    | `cutM3`                                                 |

The engine passes pre-rounded numbers. Avoid ICU `#` and `{x, number}` in messages: they format with the locale's digits, which breaks the Western-digits rule in Arabic. A plain `{x}` stays Western.

## Design system: Saqi Nightfield (replaces Saqi Sand)

- `design.md` is now **Saqi Nightfield v1.1**, transcribed from the Nightfield canvas (claude.ai design, artifact `YUcyDc9cn8fSxXjHvRs5zb`). The old "Saqi Sand" file is at `../design-archive/saqi-sand.design.md`. The plan docs (`../plan/05`, `06`) and the T03/T12–T16 task texts still describe Sand (IBM Plex, water-blue accent, bins at 35/50/…%, motion names quick/base/slow/story). **design.md wins wherever they disagree.** Motion names map tick ≈ instant, step ≈ quick, settle ≈ base, drift ≈ slow, tide ≈ story.
- **Changed from the canvas on purpose:** Day `focus` is `accent-text` #A04709. The canvas's fill-orange ring is 2.63 : 1 on the page, under the 3 : 1 that WCAG 1.4.11 asks of a focus indicator.
- **Not on the canvas, added:** `error` and `error-soft` in both themes, Night `inverse-*`, the Night `floating` shadow. Day `accent-text` is #A04709 (design-system board); the dashboard board had #A84B0C.
- The canvas's "Nightfield Night" design-system board uses a green-black palette (#0B1410) that its own token table and the Night dashboard don't. Graphite (#111214) is used.
- Night tokens exist (`[data-theme='night']` re-points every `--color-*` and `--shadow-*`); nothing sets `data-theme` yet. The toggle lands with the Today screen.
- **Tokens pipeline (T02):** `pnpm design:check` validates against the committed Stylebase v1 schema plus 17 contrast rules per theme (text-primary ≥ 7 : 1, secondary/muted/accent-text ≥ 4.5 : 1, focus ≥ 3 : 1, …), the night theme defining every day colour, and a lightness-ordered water scale. It writes `packages/tokens/dist/` (gitignored, rebuilt on `postinstall`). Tailwind's default palette, type scale, radii and shadows are reset, so only design.md tokens compile. `@theme static` emits every variable, so `var(--color-water-3)` works in SVG and GSAP even when no utility uses it.

## Time-shift and the API (T10)

- **The API serves a frozen scenario replayed at the current hour.** `withTimeShift(repo, now)` (`services/timeshift.ts`) wraps the stored repo. Readings and irrigation events move by `floorHour(now) − seedAnchor` both ways, so query bounds are un-shifted going in. Manual event logs are stored in seed time and age with the rest of the farm. Task due dates move by whole GST days.
- **Task `updatedAt` is never shifted.** It's a real version stamp: a shifted one would jump back every hour and turn honest edits into 409s.
- **The budget is evaluated at the scenario's own moment**, not the real calendar: the seed's month, its day of month, its usage up to seed "now" (`services/plan.ts`). The allocation is calibrated for that moment, so "fodder on deficit, month tight" holds on any day the demo is opened (tested at three dates). Deviates from T10's "usage in the current GST month", which made the status flip to ok after midnight. `budget.month` is therefore the seed's month.
- **Repo interface changes:** `getSeedAnchor()` was added; `getMonthUsage(month)` became `getUsage(sinceIso, untilIso)` (half-open), so the shifted view can translate bounds. `/api/health` returns `seedAnchor`.
- **Every timestamp leaves the API as UTC `Z`**, including schedule times (the engine works in `+04:00`). Reason params keep `HH:mm` in GST.
- **`/api/plan/today` is memoised** per (hour, weather `fetchedAt`) for 5 minutes; `POST /api/blocks/:id/events` invalidates it.
- **D-3's task title is static seed text** ("no data since 12:00") while the stale gap now moves with the clock. T17: render the time from the sensor's `lastAt` instead.

## UI primitives (T03, Nightfield)

- `apps/web/src/ui/` holds the Nightfield pieces, not T03's generic list: pill `Button` (accent / ink / ghost, `arrow`, `loading`, sizes md / field 56 px / icon 44 px) plus `buttonClasses` for links, `Panel`, `Figure` and `Stat`, `Chip` with `DECISION_CHIP`, `SourceDot`, `SegmentedControl` (tablist, arrow keys follow the reading direction), `Toggle`, `Meter` (scaleX fill for M4), `TimeTrack` (hour ticks, `data-schedule-bar`), `MoistureSwatch` with `moistureStep` / `moistureToken`, and the states `Skeleton`, `EmptyState`, `ErrorState`, `StaleTag`. `QueryState` now uses them.
- **Feature-level pieces stay with their screens**: the decision row and map tag go with T12/T13, since they need domain data.
- **Units scale with the figure.** The canvas's raised 0.42em unit is for lead figures only; at small sizes it came out around 6.5 px, so small figures use a baseline unit one step smaller.
- **Loading spinner is static** until T15 animates it with GSAP (motion only through GSAP).
- `/dev/kitchen` (dev builds only) shows every primitive with Day/Night and LTR/RTL switches. A test fails if a primitive contains a hex colour.
- Geist has no subscript `₀`, so "ET₀" draws its zero in a fallback font. Decide in T13 whether to set "ET₀" with Geist Mono or the `<sub>0</sub>` markup.
- Console warning "No `HydrateFallback` element" comes from lazy routes on first load (React Router 7). Harmless; silence it in T11 with a root `HydrateFallback`.

## Deviations from the plan

- **Arabic farm name uses Western digits** ("مزرعة 07"), not `٠٧` as in plan/03 §1, per the design.md rule.
- **`FarmSchema.utilities`** (well, RO, tank, pump, TSE inlet) comes from T04; plan/03 §2 doesn't list it. The `farms` table gains a `utilities jsonb` column to match.
- **Added schemas:** `NewIrrigationEventSchema` (POST body, 0.1–500 m³), `TaskTemplateSchema`, `HealthSchema`, `MonthSchema`. The shared error type is exported as `ApiErrorBody`, leaving the short name `ApiError` free for the web's thrown error class.
- **`pawNow` and `pawProjected` are nullable** (T05). When every sensor is stale there is no honest PAW, so the API sends `null` instead of a made-up 0. The web shows "No data".
- **`blockPaw` takes `WeightedSeries`** (a `SensorSeries` plus its `weight`). Weights live on `farm.sensors`, not on readings, so `planDay` attaches them. The positional signature from plan/04 §1 is unchanged.
- **The engine is split across files**: `paw.ts`, `decide.ts`, `budget.ts`, `schedule.ts`, `time.ts` and `round.ts`, with `index.ts` holding `planDay`.
- **`schedule()` returns `{ items, decisions }`** instead of mutating the decisions to add `WINDOW_*` reasons (plan/04 §1). The engine stays free of mutation; `planDay` uses the returned decisions.
- **Schedule times leave the engine as ISO with `+04:00`**, rounded to the minute. T10 decides whether the API re-emits them as UTC `Z`; the schema accepts both.
- **Budget cuts scale the already-rounded decision** (222.1 × 0.7 = 155.5 m³, matching plan/04 §3), so net, gross and L/tree of a deficit block can differ from the unrounded maths by 0.1.
- **Window overflow also lowers `volumeM3`** on the decision, so totals and the recommendation card show what will actually run.
- **`gstDate()` lives in `@saqi/shared/time.ts`** so the API, engine and web share one GST date helper. The engine's `time.ts` adds GST wall-clock helpers on top.
- **`/making-of` sits outside the app shell**, per plan/05 §0.
- **The API has no `build` script yet.** Vercel bundles `src/vercel.ts` itself (T23). Check there that the JSON import (`with { type: 'json' }`) in `services/weather.ts` bundles cleanly.
- **Memory mode serves `buildSeed()`** (T08): 30 days ending at the latest 21:00 GST, built once per process (about 60 ms). Restarting the API (including `tsx watch` reloads) resets it, task updates included.
- **Allocation rule changed** (T08, plan/03 §1 and the T08 task text corrected): `round(projectedAfterFodderCut / 0.985)` instead of `round(projectedWithoutDeficit / 1.04)`. With a fixed 4 % overshoot, how much the fodder cut saved depended on the days left in the month; late in a month the engine also cut the palms, so D-1 showed Deficit instead of Irrigate. Tests cover anchors on 2, 23 and 28 October.
- **The allocation is calibrated with the recorded past-week ET₀.** At request time the engine uses the live forecast, so the after-cut share can drift a little within (or just outside) the tight band. That's the product working, not a bug.
- **The simulator reads ET₀ by day index, not date** (day k of 30 → recorded day k), so any anchor works with one fixture. The fixture is real: Open-Meteo, Al Ain, 2026-09-22 → 10-21.
- **Weather (T09) is live from Open-Meteo**, with an in-process TTL cache over the repo cache. When Open-Meteo fails it serves the last good payload (or `sim/fixtures/weather-fallback.json`) with `stale: true`, and waits 60 s before trying again so a slow upstream doesn't add the 4 s timeout to every request. Route tests inject a fake `fetch` returning `sim/fixtures/openmeteo-forecast.json` (recorded 2026-10-22). The `WEATHER_FIXTURE=1` switch for E2E is still T21's.
- **The fallback fixture is served as recorded** (old dates, old `fetchedAt`) rather than re-dated to today. It's stale data and says so.
- **`pnpm --filter api seed` in pg mode exits with a message** until T07 provides the Drizzle client for truncate + bulk insert.
- **Tasks query requires `date`.** plan/02 §4 lists it as a parameter without saying whether it's optional.

## Toolchain pins (latest majors that broke the stack)

- **TypeScript `~6.0`.** 7.0 (the native port) is `latest`, but typescript-eslint 8 supports `<6.1`.
- **ESLint `^9`.** eslint-plugin-jsx-a11y 6.10 peers on ESLint ≤ 9.
- **React Router `^7`.** v8 is `latest`; the stack says RR7.
- Also in use: zod 4, Vite 8 (rolldown), Vitest 5, Hono 4, drizzle-orm 0.45, TanStack Query 5, i18next 26.
- pnpm is pinned to 9.15.9 via `packageManager`. On this machine `pnpm` is a shell alias to a missing `sfw`; use a real pnpm 9 binary or `corepack`.

## Watch list

- **Web bundle:** the entry chunk is about 150 kB gzip (React, Router, Query, zod 4, i18next + ICU). NFR2 caps the field route at 250 kB. Consider `zod/mini` on the web or trimming ICU before GSAP lands.
- **Retries:** TanStack Query `retry: 1` also retries 404/422. T20 could skip retries on 4xx.
- **pg contract suite:** `repo/contract.test.ts` runs only when `DATABASE_URL` is set, and it expects the database to be seeded with the current hour as anchor (T07/T08).
