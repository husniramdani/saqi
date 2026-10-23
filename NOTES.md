# Notes

Working notes for whoever (human or Claude Code) picks up the next task. Read this before starting one.

## Pixel-perfect port: token deviations

- **Cockpit and app header (`app/shell.css`, `features/cockpit/cockpit.css`) follow `design/dashboard*.html` literally.** Where the reference's value differs from a token, the reference literal is used:
  - `--accent-t` Day `#A84B0C` (token `accent-text` is `#A04709`); Night matches the token.
  - `--flow` (tonight's moving dashes) `#FFFFFF` in both themes (token `tag-text` is `#F2F1EE` at night).
  - Latin pages use the reference's font stack `Geist, ui-sans-serif, system-ui` (token `font-sans` puts IBM Plex Sans Arabic second), so glyphs Geist lacks (₀) fall back the same way.
  - The map's grid and the schedule track's hour ticks are CSS gradients, the language buttons are 32 px and the bar's icon buttons 38 px, all as in the reference (design.md asks for no gradients and 44 px targets).
  - Kept from the tokens on purpose: the focus ring colour (`focus`, ≥ 3 : 1; the reference's fill orange is 2.63 : 1 on the Day page).
- **Farm geometry differs from the reference by a few units:** `farm07` draws the RO unit 50 × 40 at y 520 and the TSE inlet with r 10; every reference draws them 50 × 36 at y 522 and r 12. Left as data (it is the API's farm); change `farm07.utilities` if the drawing should match exactly.
- **The reference at 390 px overflows sideways** (its top bar is wider than the phone). Today reproduces it; Field and block pages let the bar wrap instead.
- **Supersedes the T11–T13 notes below where they disagree:** the header tabs are Today · Blocks · Schedule · Budget · Field (Blocks, Schedule and Budget are `/today#blocks`, `#schedule`, `#budget`: the rail, the schedule card and the Water tab, focused on arrival); the bar keeps the reference's FM badge and sizes; under 1180 px the cockpit is one column in the reference's order (rail, map, plan) and a bottom bar replaces the hidden tabs. The map has no Map | List switch (`BlockList` is gone): the Blocks rail is its text alternative, as the reference's map label says. The schedule card floats over the map. Risk order is irrigate, deficit, low confidence, then water now, driest first (`risk.ts`). The rail's 14-day chart card is the link to the block page ("Open D-1"), so the reference's layout stays intact.
- **Landing (`routes/landing/landing.css`) is a literal merge of `design/landing.html` and `design/landing-night.html`.** Day variables point at tokens where the hex matches; these differ and use the reference literal: `--tree` `rgba(22,32,27,.18)` (token `tree` 16 %), `--shadow` (not `shadow-raised`), the inverse panels' `--raised #243029`, `--raised2 #2A362F`, `--line #2E3A33`, `--line-s #3C4A42`, `--text-3 #9AA49E`, `--ok #7CC59A` and their own water scale, and the reference's font stacks. Night is the reference's green-black palette (`#0B1410` page, `#0F1C16` panels, sage text, its own water scale): only `--ember` matches a token (`accent`). Glow and scrim gradients, the Night hero card's blur and the uppercase mono micro-labels are kept, as the reference renders them.
- **Night landing reproduces the reference's class typos:** its About and Instruments cards are `class="tilerv"` / `"tilespan2 rv"`, so at night they render without card chrome and the wide instruments don't span two columns. The port keeps that (no `.tile`/`.span2` rules at night) so both themes match their reference exactly; restoring the chrome is one rule each if wanted.
- **Landing differences from the reference that are on purpose:** the header has a theme toggle (the nav pill sits 28 px further left); the weather tile and status strip show live Open-Meteo values (the reference's 31 °C / 38 % / 14 km/h are fixed); the Today card's route reads `/today`; chapter 3 counts the real engine tests (`test-stats.json`) instead of "14 table-driven engine cases"; IBM Plex Sans Arabic loads a real 600 weight, so the Arabic phone's bold labels are lighter than the reference's synthesised bold. Arabic and Urdu mirror the layout; drawings keep LTR geometry and labels.

## TODO seams and the task that fills each

Search the code for `TODO(Txx)` to find each seam.

| Seam                                            | Where                                                    | Filled by                                      |
| ----------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| Postgres repo, Neon client, `db:migrate` driver | `apps/api/src/repo/pg.ts` (throws `NotImplementedError`) | T07 (never built; production runs memory, T23) |

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

## Deploy (T23)

- **Live:** web <https://saqi.spindyzel.com> (custom domain, DNS on Cloudflare: `saqi` CNAME to the Vercel target, DNS only) and <https://saqi-web.vercel.app>, API <https://saqi-api.vercel.app> (Vercel account husniramdani, scope `husniramdanis-projects`). The API's `CORS_ORIGIN` lists both web origins. Both projects are connected to `husniramdani/saqi`, production branch `main`, so a push deploys both. Root `.vercel/repo.json` (gitignored) links the repo for CLI deploys from `apps/api` or `apps/web`. Memory mode, no Neon (see Deviations). README "Production" has the env table and how to redeploy.
- **Install:** Vercel runs `pnpm install` at the workspace root. `ENABLE_EXPERIMENTAL_COREPACK=1` makes it use `packageManager` (log: "Done … using pnpm v9.15.9"). Node is pinned to 22.x in both projects' settings (Vercel doesn't read `.nvmrc`; the functions report `nodejs22.x`).
- **The default Hono build fails on this repo.** `@vercel/hono` 0.2.76 compiles file by file through `@vercel/node` and turns type errors into build errors. It reported `Property 'ok' does not exist on type 'Response'` in `services/weather.ts`, which `tsc` accepts. [INFERENCE] Its module resolution doesn't follow pnpm's isolated layout, so `@types/node` can't reach `undici-types` and `Response` comes out empty. Even with types passing, it emits per-file ESM with extensionless imports, which Node can't load. **`VERCEL_EXPERIMENTAL_BACKENDS=1`** (Vercel's newer backend build, opt-in since Jan 2026) builds it: entry `src/app.ts`, typecheck passes, and the output holds the compiled `packages/shared` and `packages/engine` plus the JSON fixtures as `.mjs` modules. The built handler, imported locally, answered `/api/health` and `/api/plan/today`. It's labelled experimental: if a Vercel change breaks it, the fallback is bundling `src/app.ts` ourselves (esbuild/rolldown) into a function entry.
- **One function instance for every route.** The build emits a function per route (`api/tasks.func`, `api/plan/today.func`, …), all symlinks to `index.func`. Checked on production that they share memory: a PATCH to `/api/tasks/task-2` showed as done on six GETs of `/api/tasks`, then was set back to todo.
- **Dev switches off in production:** `?scenario=` needs `SCENARIOS=1`. Config refuses `SCENARIOS=1`, `NOW` and `WEATHER_FIXTURE=1` when `VERCEL` is set (Vercel sets it in every build and function), as it already did in pg mode. `config.test.ts` and `scenario.test.ts` cover it: off by default, ignored with `VERCEL=1`, refusal at startup.
- **`pnpm smoke`** (`scripts/smoke.ts`, 11 checks) runs on Node type stripping with `--import ./scripts/resolve-ts.ts`. `@saqi/shared` exports `.ts` source with extensionless relative imports, which Node's resolver rejects, so the hook retries a failed relative import with `.ts`. `@saqi/shared` is a root dev dependency. On top of the task's list, it checks the PATCH preflight (Field's writes need it), that the entry script is served as JavaScript, and that `og:image` resolves to a PNG.
- **OG image:** dev-only `/og` route (`routes/dev-og.tsx`): the Today map on the demo night (the kitchen's `scenario.ts`), legend, logo, and "Saqi · irrigation cockpit" in Geist 300. `pnpm og` (`e2e/docker.sh og` → `e2e/og.ts`) starts Vite on :5179 and screenshots it at 1200 × 630, reduced motion, with the browser in `playwright:v1.64.1-noble`. Meta: `og:*` (with image size and alt) and `twitter:card=summary_large_image`, absolute production URLs. Also added `public/robots.txt`: without it `/robots.txt` was rewritten to the HTML shell and Lighthouse SEO flagged it (91 → 100).
- **Visual baselines re-rendered** (`pnpm e2e:docker --update-snapshots`): the Field demo line changes the Field shots.
- **Phone check (production, 375 × 812, iPhone UA, throttled to ~1.6 Mbps / 150 ms over CDP, en and ar):** Today, Block D-1 and Field load in 4–6.5 s to network idle, with `dir`/`lang` right (`rtl`/`ar`), no horizontal scroll, no console errors, and "Simulated sensors" present. Not tested on a physical phone over a real carrier.
- **Lighthouse 13.5.0** (`npx lighthouse@13.5.0`, mobile preset with simulated throttling, headless Chrome for Testing 156 from Playwright's cache via `CHROME_PATH`), production, two runs each:

  | Page     | Performance | Accessibility | Best practices | SEO |
  | -------- | ----------- | ------------- | -------------- | --- |
  | `/`      | 60, 65      | 100           | 100            | 100 |
  | `/field` | 91, 92      | 100           | 100            | 100 |

  Lighthouse 13 adds a fifth category, "agentic browsing" (39 on `/`, 50 on `/field`), not tracked here. Fixed: SEO 91 → 100 with `robots.txt`. **Not fixed: Today's performance (60–65).** FCP 3.3–3.7 s and LCP 4.3–4.7 s, against 2.5 s / 2.6 s on Field: the shell paints nothing until the lazy Today route resolves, and the entry chunk carries about 95 KiB of unused JS on first load (React, Router, Query, zod, i18next + ICU, GSAP core). Also **CLS 0.228**: Lighthouse names the "Tonight's plan" aside, which moves down in the one-column layout (under 1180 px). [INFERENCE] The map card above it grows from skeleton to map, legend and schedule. Fixing them means reserving the map card's final height and splitting the entry chunk, a design and bundling change, not a quick one. Tried: loading the Google Fonts CSS without blocking render (Lighthouse estimated 1.3 s). It made no difference beyond run-to-run noise (Today 56, Field 88) and added a font swap, so it was reverted.

- **Out of scope, broken (seen on the phone check):** on Block D-1's chart, the in-plot labels ("68.0%" at the latest point, "65% threshold") sit on top of the lines at 375 px, in both languages. In Arabic the threshold label also renders as "65 عتبة%": the `%` is pulled to the wrong side of the bidi run. Both come from `features/moisture-chart` (T14/T18).
- **E2E gotchas seen while re-rendering:** with `CI=true` in a local shell, plain `pnpm e2e` on macOS compares the Linux baselines and fails; unset it (`env -u CI pnpm e2e`). Under heavy machine load, `pnpm e2e:docker` hit the 5 s "map visible" wait on cold loads (Today, Field offline); the same tests passed on the next runs.

## CI (T22)

- **`ci.yml`:** `verify` (install, design check, lint, typecheck, `pnpm test:ci`, build; uploads each package's Vitest JSON) then `e2e` (needs verify). `concurrency` per ref with cancel-in-progress, `permissions: contents: read`, no secrets.
- **`e2e` runs inside `mcr.microsoft.com/playwright:v1.64.1-noble`**, the image that renders the visual baselines, instead of `ubuntu-latest` + a cached `playwright install --with-deps` (the task's version). Same Chromium and fonts means the screenshot comparisons are like for like, and its browsers are preinstalled, so there's nothing to cache. Bump the image tag together with `@playwright/test` and `e2e/docker.sh`.
- **`pnpm test:ci`** is `pnpm -r run test --reporter=default --reporter=json --outputFile=.vitest/results.json` (`run`: pnpm's built-in `test` command swallows the flags). Playwright also writes `apps/web/.playwright/results.json` (not `test-results/`, which it clears on every run). Both folders are gitignored; the artifact upload needs `include-hidden-files`.
- **`scripts/test-stats.ts`** (`pnpm stats`, Node's built-in type stripping, zod on both reports) writes `{ engine, api, web, e2e, durationSec, commit, at }`. It refuses to write when any suite failed (checked with a deliberately broken engine test), and names the command that produces a missing report. **`durationSec` is summed test runtime** from the runners' own clocks, not the CI job's wall time, so the Making-of label now says "Test minutes" (en/ar/ur). The committed default was generated locally at `97d9e1a` (56 / 96 / 154 / 23, 52 s); CI uploads a fresh one as the `test-stats` artifact. Vercel builds from git, so refresh the committed file with `pnpm test:ci && pnpm e2e && pnpm stats` before a release.
- **`snapshots.yml`** (manual) re-renders the baselines in the same image and uploads them as an artifact, rather than opening a PR: that would need write permissions or a third-party action.
- **Broken-test drill:** changing D-1's expected volume to 90.5 made `pnpm test:ci` exit 1 with "FAIL decide.test.ts > … D-1 at PAW 68 → irrigate" and a `volumeM3` 90.5 / 90.4 diff. Reverted.
- **Local dry run of both jobs inside `playwright:v1.64.1-noble`** (working tree copied without `node_modules`, `CI=true`): frozen-lockfile install 82 s, design check, all unit and API suites green, **E2E 23/23 in 39 s with the five screenshot comparisons live**, then stats. It caught one bug: without `GITHUB_SHA` and without a `.git` folder the script crashed on `git rev-parse`; the commit now falls back to "unknown" (Actions always sets `GITHUB_SHA`). The workflows parse with the intended job graph; **actionlint was not run** (its Docker Hub image pull hung); `snapshots.yml`'s `--project` flags reach Playwright (checked with `--list`).
- **Remote:** `origin` is github.com/husniramdani/saqi (public); the README carries the CI badge.

## Playwright E2E (T21)

- **Run:** `pnpm e2e` (about 25 s, 23 tests), `pnpm e2e:ui`, `pnpm e2e:docker` (same suite, browser in Linux). Config, fixtures and specs live in `apps/web/e2e/`; Vitest only picks up `src/**/*.test.*`.
- **Determinism, both ends:** the API runs on :8788 with `NOW` (frozen clock, memory mode only) and `WEATHER_FIXTURE=1` (the recorded Open-Meteo payload with ET₀ pinned to 5.8 mm, `sim/workedExample.ts`, shared with the route tests), so every run lands on the plan's story: D-1 Irrigate 90.4 m³, F-1 Deficit 155.5 m³, D-3 stale, the month tight, two night runs, six pulses. Config refuses both switches outside memory mode (tested).
- **Browser time flows from the frozen instant (`setSystemTime`, not `setFixedTime`).** GSAP's ticker reads `Date.now()`: with a fixed time every animation stalls at frame zero, so the language crossfade never swapped and the sheet never closed. Found by the first run.
- **Bug found by the offline journey:** M9 lazy-loads DrawSVG + Flip before committing the "done". Offline, that import rejected and the tap was silently lost. `confirm` now always commits (animation errors fall back to an instant move), and Field preloads the plugins while online.
- **Bugs found by axe 4.14 (`label-content-name-mismatch`, WCAG 2.5.3), which axe 4.10 in T20 didn't run:** the home link, language buttons and schedule rows weren't named by what they show. Now: the home link is named by its content plus ", Today"; language buttons are "EN, English" (axe drops parenthesised text, so "English (EN)" still failed); schedule rows take their name from their content with the window as screen-reader text, and the bar inside is decorative.
- **Selectors are roles, names and text.** Two markup changes made that possible and help screen readers too: the reasons list is named by its "Why" heading, and pulse times are `<time dateTime>`. Only the RTL check measures `[data-schedule-bar]` geometry (after finding the row by name).
- **Journeys vs plan/07:** on Today a map click selects the block and the rail's "Open D-1" navigates (the product flow since T13), so block and keyboard specs go through it. "14 day ticks" is asserted through the chart's text alternative (header + 7 rows) because the ticks live inside an `img`. The offline journey runs once, on `mobile` (it changes server state); the visual Field shots use Imran so they never see it.
- **axe scans** run with reduced motion: contrast is judged on end states, not a stagger caught mid-fade.
- **Visual baselines are rendered on Linux** by the browser in `mcr.microsoft.com/playwright:v1.64.1-noble` (`e2e/docker.sh`, `playwright run-server` + `exposeNetwork: '<loopback>'`), stored without a platform suffix. Plain `pnpm e2e` on macOS runs every journey and skips only pixel comparisons (`ignoreSnapshots`). **For T22:** run the e2e job in that same image (or connect to it) so the comparisons match; regenerate with `pnpm e2e:docker --update-snapshots`. Fonts come from Google Fonts, so screenshots depend on that CDN.
- **Acceptance:** `pnpm --filter web build && pnpm e2e` ×3: 23/23 each time (22–24 s). `pnpm e2e:docker`: 23/23 with the five snapshot comparisons live.

## Unhappy states and accessibility (T20)

- **Scenario switcher (dev):** `?scenario=<name>` on any page URL, or the buttons in `/dev/kitchen`. The web client keeps it in sessionStorage for the tab (in-app links drop the query) and forwards it to every API call; `?scenario=normal` clears it. Dev builds only on the web; on the API, only with `SCENARIOS=1` (T23: `pnpm dev` sets it; config refuses it on Vercel and in pg mode, tested). Each scenario is a small override on the normal deps (`services/scenario.ts`) served by a second copy of the routes, so the normal path is untouched and each scenario memoises its own plan. `api-down` is web-only: the client points at `http://127.0.0.1:9`.
- **Spot-check list (walked 2026-10-23, 1280 px, en):**

  | Scenario                | Today                                                                                                                                     | Block                                                                                                | Field                                   | Making-of               |
  | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------- |
  | `normal`                | ✓                                                                                                                                         | ✓                                                                                                    | ✓                                       | ✓                       |
  | `api-down`              | every panel: "Can’t reach Saqi right now…" + Retry; heading keeps today's date; map key hidden; Water tab errors (was a skeleton forever) | name falls back to the code; each panel errors                                                       | worker switch stays usable; list errors | static; stats fall back |
  | `weather-stale`         | weather shown with warning "Last updated 02:00 GST (forecast unavailable)"                                                                | n/a                                                                                                  | n/a                                     | n/a                     |
  | `no-irrigation-tonight` | "No irrigation needed tonight. Saves 182 m³ against a fixed schedule." + tomorrow's pulses                                                | Skip cards                                                                                           | n/a                                     | n/a                     |
  | `budget-over`           | "Over 160 %"; note lists each cut block at its own share ("F-1 70% and D-1 85%")                                                          | Deficit decision                                                                                     | n/a                                     | n/a                     |
  | `all-sensors-stale-D3`  | D-3 stale tag on rail and map                                                                                                             | banner "Every sensor on this block is offline…", Skip, low confidence, both sensors named with hours | task to check the sensor                | n/a                     |

- **Bugs found by the walk:** the deficit note put every cut block at one share (it read "F-1, D-1 run at 85%" when F-1 was at 70%); a sub-1 % overshoot read "heading 0% over" (now one decimal under 1 %); raw "Failed to fetch" leaked into error copy; the Water tab never left its skeleton when the plan failed; the chart's screen-reader table read ISO dates.
- **404:** one `NotFound` (app/NotFound.tsx) for unknown routes and unknown blocks, with Today and Field links.
- **Focus:** route changes focus the page `<h1>` (falls back to `<main>` while a page loads); after a Field confirm, focus moves to "Done today" (the opener is gone). Tab follows the visual order on narrow Today via `reading-flow: grid-order` (Chromium 137+; other engines keep DOM order, which matches desktop).
- **axe (axe-core 4.10.2 injected into the dev page):** zero serious/critical on `/`, `/blocks/D-1`, `/field`, `/making-of` in Day/en, Night/en and Night/ar. The one finding (the events table's scroll box wasn't keyboard-reachable) is fixed with a labelled, focusable `role="region"`; the jsx-a11y rule now allows `tabIndex` on `region` for exactly that pattern. axe isn't a dependency; T21 can add `@axe-core/playwright` to lock it in.
- **text-muted** stays for labels, units and column heads (design.md); essential small text moved to `text-secondary`: task notes, the photo notice, "No data", the decision list's window and volume, Making-of's rounding note and "After the first CI run".
- **Looping GSAP hooks** (`Spinner`, `usePipeFlow`, `useHoverLift`) now use `revertOnUpdate: true`: turning reduced motion on left the running spin and water-flow loops going, and a new route stacked a second flow loop with its listeners. `Spinner.test.tsx` fails without the fix.
- **Titles:** "Tonight · Saqi", "D-1 Khalas palms · Saqi", "Field · Saqi", "How Saqi is built · Saqi", "Page not found · Saqi", localised. Meta description and an SVG favicon (ink square, accent drop) added.
- **theme-color stays `#F3F1EB`** (design.md's `background`); the task's `#F5F1EA` comes from the archived Saqi Sand palette.

## Making-of story (T19)

- **Honest by construction:** the code panel is the real `design.md` colour block (`?raw`, 18 lines: `colors:`, the first eight tokens, an ellipsis, the water scale and `stale`); the formula and the three decision cards are computed by `@saqi/engine` (now a web dependency) from the worked example (plan/04 §3), so they read 90.4 m³, Skip and Deficit 155.5 m³ because the engine says so. `data.test.ts` pins all three.
- **The formula shows projected PAW as 60.35 %, not 60.3 %:** with the one-decimal value the terms multiply out to 90.6, not the engine's 90.4. The engine never rounds inside; the scene says so.
- **Mini map:** D-3, D-4 and G-2 have no worked-example PAW, so the story gives them plausible skips (76, 81, 78 %). It's `inert` and `aria-hidden`; the code panel and palette carry the meaning.
- **Test counts:** `FALLBACK_STATS` was counted by hand on 2026-10-23 (engine 56, API 86, web 151 at T19; refreshed after T21 to API 96, web 154, E2E 23). CI minutes show "—" with "After the first CI run" until T22's `public/test-stats.json` exists (schema `{ engine, api, web, e2e, durationSec }`, validated with zod; a missing file falls back, since the dev server answers it with `index.html`).
- **Author links:** "Open the app", the GitHub repo (added once it existed: github.com/husniramdani/saqi) and Stylebase. **T24 fills LinkedIn and email** in `LINKS` (`routes/making-of/scenes.tsx`) plus their `makingOf.scene5.links.*` strings; none of them exist in the repo or the plan, and none were invented.
- **Scene 5 doesn't pin:** it's the ending; its links fade in once. Scenes 1–4 pin for one screen each and hold their finished state for the last third of the pin, so counters aren't still climbing at release.
- **Remount on language change:** `<Story key={locale}>`. SplitText and pin spacers rewrite the DOM, and React must never reconcile text inside a node GSAP rewrote; remounting runs the revert first.
- **`useGSAP` gotcha:** with `dependencies` but without `revertOnUpdate: true`, a dependency change does **not** revert the previous run; it stacks a new one. The story built twice (20 triggers, 8 pins) when the stats query resolved; fixed with `revertOnUpdate: true`. T20 fixed the looping/stateful ones too (see below); one-shot tweens keep the default.
- **Vite dev gotcha:** after replacing `routes/making-of.tsx` with a `routes/making-of/` folder, the running dev server kept the old resolution until `router.tsx` was touched.
- **Lighthouse and the 4× CPU-throttle fps check were not run** (no DevTools in the built-in browser). Checked instead: one build (10 triggers, 4 pins of exactly one screen), clean revert across the 768 px breakpoint, no horizontal scroll at 375 px, RTL prose with LTR code and arithmetic.

## Arabic and Urdu, RTL (T18)

- **Translations are machine-assisted** and reviewed for consistency; `apps/web/src/i18n/TRANSLATIONS.md` has the rules and a glossary. Native review welcome.
- **`i18n/parity.test.ts`** fails on a missing or extra key, different ICU params (read from the parsed AST: a regex took `{runs}` plural branches for params), a message that doesn't compile, or a Latin-only string that isn't on its allowlist (brand, `budgetUsed`, `context`, `RO`).
- **Arabic plurals use all six categories** where a count shows; Urdu uses one/other. Messages whose English plural only changes a verb keep a plural in Arabic and Urdu too, so the params match.
- **Most RTL was already in place** from T03–T17: logical properties everywhere (the audit grep found only the map tooltip, physical on purpose), the chart x-axis and the schedule track flow with the reading direction, `growFromStart`, the strike line and `Arrow` mirror.
- **"Geist Mono for numbers only", applied:** map utility labels hold words, so they drop `font-mono` in `ar`/`ur` (Arabic in a mono fallback lost its joins); the header's "Updated" pill renders only the time as `num`, with the words in the locale's font, in every language. Block code tags stay mono.
- **No letter-spacing in `ar`/`ur`** via an unlayered `:where(:lang(ar), :lang(ur))` rule, which outranks Tailwind's layered `tracking-*` utilities without `!important`. Plex Sans Arabic now also loads weight 300 for the display headings.
- **Varieties** (Khalas, Fard, …) are plain strings in the fixture, so the web translates them through `block.variety.*` with the raw string as fallback, instead of changing the shared contract, the DB and the seed.
- **Arrows in reason text** point with the reading direction (`←` in `ar`/`ur`). `formatTimeRangeGst` stays `→` inside its LTR-isolated figure.
- **M12** crossfades `#root` around the switch. Gotcha: in a hidden tab `requestAnimationFrame` stops, so a switch made there would hold at opacity 0 until the tab is visible again.
- **Kept Latin on purpose:** units (`m³`, `mm`, `cm`, `m³/h`), `GST`, `ET₀`, block codes, `RO`, `TSE`, `Saqi`, `Open-Meteo`.

## Field companion (T17)

- **The route stays `routes/field.tsx`** (the task says `routes/field/FieldPage.tsx`); every other route is one flat file exporting `Component` for the router's `lazy`.
- **Outbox flow:** `useUpdateTask` updates the cache at once, then PATCHes. Offline (`navigator.onLine` false, or a `NETWORK` error) a "done" goes to `saqi.outbox.v1` instead. `useOutboxSync` (mounted in the shell) flushes on `online`, on window focus and every 30 s while anything is queued. One flush at a time. A 409 drops the action, refetches (the server's value wins) and toasts. Queued task ids render as done even after a refetch.
- **`networkMode: 'always'` on the task mutation.** TanStack's default pauses mutations while offline, so `mutationFn` never ran and nothing reached the outbox (found in the browser, not in tests). The paused mutation would also have lived only in memory and been lost on reload.
- **The sheet is a native `<dialog>` opened with `showModal()`**: the browser does the focus trap, the inert page, Escape and returning focus. The backdrop is a real element so M10 can animate it (GSAP can't reach `::backdrop`). jsdom has no `showModal`; `test-setup.ts` stubs it to toggle `open` only, so the tests prove modal-ness, not the trap itself (T21's Playwright can).
- **Buttons:** "Mark done" is `ink` and Confirm is `accent`. The task says `secondary` and `water`; `Button` has neither, and design.md calls `ink` the secondary pill and allows one accent per view (the sheet's Confirm).
- **M9** (`features/tasks/taskDone.ts`): the check draws and the strike grows from the inline start, in place; then Flip state is recorded, the mutation commits, and `Flip.from` runs once the done list changes. It reuses `loadMapPlugins()` (DrawSVG + Flip only). Reduced motion skips straight to the move.
- **Context line** is "kind · block name", not "No data since 12:00": the seeded task titles already carry the sensor detail ("Check 60 cm sensor, no data since 20:00").
- **Tap targets at 375 px:** everything on Field is ≥ 56 px (`SegmentedControl` gained `size="field"`). The shell header controls (logo, EN/ع/ار, theme) stay 44 px per design.md; T20 can decide whether Field's acceptance line covers the shell too.
- **After confirm, focus lands on `<body>`** because the opener ("Mark done") unmounts as the card moves. T20 could focus the "Done today" summary instead.

## Signature motion (T16)

- **M1 map reveal** (`features/farm-map/mapMotion.ts`, Today only, once per session): block outlines draw (DrawSVG), water fills fade in, textures and the stale hatch follow, pipes draw, tags rise, utilities appear; about 1.9 s. Any pointerdown or keydown finishes it. The session flag (`saqi.mapRevealed`) is set on complete/skip, not at start.
- **M2 water flow:** the dashes on tonight's pipes travel pump → block by animating `strokeDashoffset` (as on the canvas), not capsules on a MotionPath. MotionPath is therefore not loaded at all. Paused on `visibilitychange` and when the map is off-screen (IntersectionObserver). Reduced motion: still dashes.
- **M3** counters in `Figure` (from the previous value, never 0; the first render is final). **M4** meter fills from 0 on first show, then from the previous share. **M6** schedule bars grow from the start edge, then pulse chips fade in. **M7** reasons rise one by one. **M8** hover thickens the outline and lifts the tag 2 px; the tooltip enters with a 4 px rise.
- **M5 Flip (removed):** the morph was built for a map click that navigated. In the cockpit a map click only selects and navigation starts from the rail, so the swatch flew out of the map wherever you clicked. The Block page now arrives as a plain route change (plan/06's own fallback); see Deviations.
- **A StrictMode trap, fixed and commented:** `useGSAP` hands the second dev run the context the first run's cleanup reverted, so anything `context.add`-ed after an async load is killed on arrival. The reveal owns its timeline and kills it in its own cleanup.
- **Verification note:** the Claude browser pane throttles animation frames while hidden, so GSAP looked frozen. Moments were verified by driving `gsap.ticker.tick()` by hand:
  - reveal at 500 ms: outlines drawing, fills at 0.77, tags pending; done by 2.3 s;
  - flow offset moving;
  - Flip from the map block's box (794, 345, 223 × 125) to the 32 × 32 swatch;
  - no replay on back/forward;
  - one flow tween after three visits to Today;
  - no GSAP console warnings.
- **Not verified here:** frame rate under Chrome's 4× CPU throttle (T16 asks ≥ 55 fps) and the OS reduced-motion setting end to end (each preset's reduced path is unit-tested). Both go on T21's or the manual QA list.
- **Bundle:** DrawSVG 1.9 kB and Flip 9.3 kB gzip are lazy chunks. Field's first load is about 207 kB gzip (entry 205.5 kB, which now holds GSAP core and the shared UI), under NFR2's 250 kB.

## Motion foundation (T15)

- `apps/web/src/motion/`:
  - `gsap.ts` is the only plugin registration. `loadMapPlugins()` (DrawSVG, MotionPath, Flip) and `loadStoryPlugins()` (ScrollTrigger, SplitText) are cached dynamic imports.
  - `tokens.ts` re-exports design.md's tokens and sets `gsap.defaults` to settle / power2.out.
  - `MotionProvider` + `useMotion()` give `{ reduced, dirSign, originStart, forceReduced }` and set `<html data-motion>`.
  - `withMotion(full, reduced)` wraps `gsap.matchMedia()`.
  - `presets.ts`: `fadeUpStagger` (M7), `growFromStart` (M6), `countTo` (M3), `meterTo` (M4), `sheetIn` / `sheetOut` (M10), `crossfadeSwap` (M12), `spin`.
- **Plan/06 motion names map onto the Nightfield tokens:**
  - reasons: settle 0.48 s, `power2.out`, stagger 0.06;
  - bars and meter: drift 0.9 s, `expo.out` (as on the canvas);
  - counters: drift, snapped to the display precision;
  - sheet: settle in, step out;
  - language crossfade: step each way;
  - spinner: one turn per drift, linear.
- **RTL comes from the element**, not the page: presets read the nearest `dir` (`dirAt`), so a mirrored wrapper (the kitchen) mirrors too. `useMotion().dirSign` follows the locale.
- **Reduced motion:** every preset sets its end state when `reduced`. `withMotion(…, forceReduced = true)` runs the reduced branch directly, because GSAP's `matchMedia` only runs a callback when one of its queries matches (found by the jsdom stub; a browser without `matchMedia` would otherwise leave from-states applied). The kitchen's switch simulates reduced motion through `forceReduced`.
- **Click-time animations** join the component's GSAP context via `context.add(fn)` from `useGSAP`. The React Compiler lint flags `contextSafe(fn)` created during render when `fn` reads refs.
- `Button`'s loading ring is now `Spinner`: it spins through GSAP and stays still under reduced motion.
- **Bundle:** no plugin chunks exist yet (nothing calls the loaders until T16). Field's first load is about 205 kB gzip (entry 110 + shared `ui` 93, which now includes GSAP core, + 1), under NFR2's 250 kB. The only "ScrollTrigger" string in `ui` is GSAP core's lookup hook, not the plugin. Re-check after T16 adds the map plugins.

## Live scenario: memory mode rebuilds hourly (decided after T14)

- **Memory mode builds the scenario for the current hour** (`repo/hourly.ts`): anchor = `floorHour(now)`, rebuilt when the hour turns (about 60–180 ms, once an hour). History ends now and every past time is real wall-clock: night refills at 22:00 GST, pulses at 07/11/15, D-3's probe silent for the last 9 h. `withTimeShift` stays in the chain but sees a zero shift.
- **Why:** the hourly time-shift from T10 moved wall-clock times with the hour the app was opened (refills showed at 18:00 when opened at 17:00 GST).
- **Writes survive the rebuild:** manual irrigation logs keep their ids; task updates carry over within the same GST day; a new GST day starts with that day's tasks fresh. Weather's repo cache resets hourly, which is harmless (the weather service keeps its own TTL cache).
- **The scenario now lands at the current hour, not 21:00.** The budget is evaluated at that moment and the allocation is calibrated for it, so "fodder on deficit, month tight" holds whenever the demo is opened (route test).
- **D-3's task title is written from the anchor** ("no data since 10:00" when opened at 19:00 GST), fixing the T10 note.
- **pg mode (T07) still stores one seed and time-shifts on read**, so wall-clock times drift there. T07/T23 should either re-seed on a schedule or shift by whole days for history while keeping the latest hour live.
- `/api/health` `seedAnchor` is the current hour in memory mode.

## Block detail (T14)

- `features/moisture-chart/` (hand SVG + pure `chart.ts`), `features/recommendation/` (card, events table, manual log), `features/tasks/BlockTasks`. The page: header with the block's water swatch, chart panel with the stale banner, recommendation card, events, the block's tasks and the manual log.
- **Chart:**
  - Block PAW is the weighted mean per hour over the sensors that reported (as the engine does), so D-3's line continues on the 30 cm sensor while the dashed 60 cm line stops (no interpolation across gaps; tested).
  - Time runs with the reading direction; RTL is computed into the coordinates, so the SVG is `direction: ltr` inside (otherwise text anchors flip twice).
  - Day labels thin out by available space (every 2 days on desktop, every 5 at 375 px).
  - Event markers have `<title>` on hover; the events table is the keyboard and screen-reader alternative, since the markers aren't actions. Summary in `<title>`/`<desc>` plus a hidden table of 7 daily means.
- **Manual log:** a disclosure form validated with the API's `NewIrrigationEventSchema`. The end time comes from the block's flow (`volume ÷ flowM3h`). Saved optimistically with rollback; the plan is invalidated.
- **Not done:** reason numbers aren't set in mono (ReasonText renders one ICU string; splitting numbers out is a T18 concern). No sparkline in the Today rail yet; the chart could be reused there.
- **Layout gotcha:** a grid without explicit columns sizes its implicit column to the widest content. The events table's 420 px minimum made the whole page 478 px on a phone. Both pages now say `grid-cols-[minmax(0,1fr)]`.

## Today cockpit (T13)

- **Layout follows the Nightfield Dashboard:** Blocks rail (330 px) | map card (heading with planned / saved, map, legend, tonight's schedule) | Tonight's plan (340 px) with Plan and Water tabs. Under 1180 px it becomes one column ordered map → plan → rail, so the answer ("what tonight, how much") comes first on a phone.
- **Deviations from the canvas and from T13's text:**
  - Selecting a block (map, rail, decision row, schedule row) **selects in place** and keeps all four in sync, as on the canvas; the rail's "Open D-1" pill goes to the detail page. T13 asked map clicks to navigate. Default selection is the riskiest block, derived (no effect).
  - The schedule sits **below** the map instead of floating over it, so it never hides blocks on small screens.
  - No Layers tab yet (map layer toggles); no per-sensor values or 14-day sparkline in the rail (T14 builds that chart); no crop icons on rail rows (design.md: no icon on every line).
  - Budget, ET₀, weather and sources live in the **Water** tab (canvas), not a full-width weather strip (plan/05).
- **The budget status moves with live ET₀**, as intended: with today's forecast the month sat at 96.99 %, "On track", while F-1 was still cut. The allocation is calibrated on recorded ET₀ (see T08), so the tight/ok line can flip between forecasts.
- **Bidi gotcha:** the `num` utility sets `direction: ltr` (so "90.4 m³" never reorders). Never put it on a layout container whose children should follow the reading direction (the schedule ruler did, and ran backwards in RTL). Keep separators outside `num` spans.
- **Targets:** each schedule row is one 44 px button spanning the ruler's columns (`grid-cols-subgrid`); the bars inside are graphics.
- `features/attention/risk.ts` is the single "needs attention" rule (the header count uses it too).
- Not checked visually: the API-down states on Today (each panel has its error state; T20's scenario switcher will exercise them).

## Farm map (T12)

- `features/farm-map/`: `FarmMap` (site plan SVG), `MapTooltip`, `MapLegend`, `BlockList` (the full text alternative), `FarmMapPanel` (Panel with a Map | List switch and loading / error / empty states; the loading skeleton is the plan's outlines at the final size). Pure helpers in `geometry.ts` and `window.ts`; `scenario.ts` holds the demo night for the kitchen and tests only.
- **Drawn as on the Nightfield canvas**, not the older T12 text:
  - Tags carry only the block code (no PAW% or decision chip); figures live in the tooltip and the list.
  - Selection is an orange outline plus an orange tag.
  - Blocks are rounded rectangles (radius 10) from the polygon's bounding box; Farm 07's blocks are all axis-aligned.
  - Utility labels are sentence case ("Well W-1", "RO", "Pump 60 m³/h"), not the canvas's uppercase (design.md bans micro-caps).
- **Legibility rule implemented, not in the canvas:** the map measures its width (ResizeObserver) and grows tag text so codes stay ≥ 12.5 px on screen. The size is capped at 40 units so a tag still fits G-2, which gives exactly 12 px at 375 px. Utility labels hide below 12 px.
- **The plan never mirrors in RTL.** Tooltip anchoring uses physical `left` on purpose (comment in `MapTooltip`). The tooltip opens inward at the plan's edges so it never leaves a narrow map. Arrow keys follow reading order: rows top to bottom, then the reading direction within a row.
- **Accessibility:**
  - The `<svg>` is `role="group"` with a summary label (`role="img"` would hide the block buttons inside it).
  - Each block is a `<g role="button" tabIndex={0} aria-pressed>` named "D-1 Khalas palms, 68 percent water, Irrigate, 90.4 cubic metres".
  - SVG can't show `:focus-visible` outlines reliably, so focus draws its own ring in the `focus` token.
- **Motion hooks for T16:** `.layer-*` groups, `data-block-fill` on fills, `data-scheduled` on tonight's pipes. Tonight's flow is a static dashed line until GSAP animates it.
- **Night's water scale runs dark → light** (charcoal → mint), as on the canvas: in Night, lighter means wetter. design.md's "darker always means wetter" holds for Day only; the token check accepts either direction as long as lightness is ordered.
- `/dev/kitchen` shows the map with the demo night (D-3 stale). T13 puts `FarmMapPanel` on Today and wires `onSelect` to the block route.

## App shell (T11)

- **Header follows the Nightfield Dashboard top bar:** logo mark, section tabs (Today, Field, Making-of; the canvas's Blocks/Schedule/Budget tabs are anchors inside Today and arrive with T13), "Simulated sensors", "Updated hh:mm GST" (the newest successful query, via the query cache), "N need attention" (irrigate, deficit or low confidence; links to `/#attention`), EN / ع / ار, and the Day/Night toggle.
- **Deviations from the canvas:**
  - The "Simulated sensors" pill is always visible; the canvas hides it with CSS, but CLAUDE.md requires it. On phones it shrinks to its dashed dot with the words kept for screen readers.
  - No "FM" avatar: there are no accounts.
  - The language buttons and header pills are 44 px tall, not 32/38 px, to meet design.md's target rule; segmented controls are 44 px too.
- **Night toggle shipped here** (planned for the Today screen): stored as `saqi.theme`, applied in `main.tsx` before the first paint, `theme-color` meta follows it. Day is the default.
- **Route changes move focus to `<main>`** without scrolling; `ScrollRestoration` resets scroll. A test renders under StrictMode, since its double effects once made focus jump on first load and hide the header.
- Breakpoints: tabs from `md`, freshness from `sm`, farm name and attention pill from `xl`; phones get the bottom bar (Today, Field, About). **Gotcha:** a class string carrying both `inline-flex` and `hidden` resolves by stylesheet order, not class order, so shared class strings must not set `display`.
- Pages (Today, Block, Field, Making-of, 404) are interim layouts on the Nightfield primitives; T13, T14, T17 and T19 replace them. `formatDateGst` gives "Fri 23 Oct". **23 Oct 2026 is a Friday**: plan/05 and the canvas say "Thu 23 Oct".

## UI primitives (T03, Nightfield)

- `apps/web/src/ui/` holds the Nightfield pieces, not T03's generic list: pill `Button` (accent / ink / ghost, `arrow`, `loading`, sizes md / field 56 px / icon 44 px) plus `buttonClasses` for links, `Panel`, `Figure` and `Stat`, `Chip` with `DECISION_CHIP`, `SourceDot`, `SegmentedControl` (tablist, arrow keys follow the reading direction), `Toggle`, `Meter` (scaleX fill for M4), `TimeTrack` (hour ticks, `data-schedule-bar`), `MoistureSwatch` with `moistureStep` / `moistureToken`, and the states `Skeleton`, `EmptyState`, `ErrorState`, `StaleTag`. `QueryState` now uses them.
- **Feature-level pieces stay with their screens**: the decision row and map tag go with T12/T13, since they need domain data.
- **Units scale with the figure.** The canvas's raised 0.42em unit is for lead figures only; at small sizes it came out around 6.5 px, so small figures use a baseline unit one step smaller.
- `/dev/kitchen` (dev builds only) shows every primitive with Day/Night and LTR/RTL switches. A test fails if a primitive contains a hex colour.
- Geist has no subscript `₀`, so "ET₀" draws its zero in a fallback font. Decide in T13 whether to set "ET₀" with Geist Mono or the `<sub>0</sub>` markup.

## Deviations from the plan

- **Arabic farm name uses Western digits** ("مزرعة 07"), not `٠٧` as in plan/03 §1, per the design.md rule.
- **No M5 block → detail Flip.** plan/06 morphs the clicked map block into the detail header. The cockpit's map click selects instead of navigating, and the rail opens the page, so the morph had no click to come from. A plain route change is plan/06's fallback for M5.
- **Night is the default theme** (on request; design.md's description and "what this system is not" were updated to match). `storedTheme()` falls back to night, `index.html` ships `data-theme="night"` and the night `theme-color` so the first paint is already dark, and only a stored `day` changes it. Tokens keep Day as the base with Night as the `[data-theme='night']` override. Visual baselines are now Night.
- **No zoom controls on phones (≤ 640 px).** On a 330 px plan the zoom column sat on F-1 (D-3 in Arabic) and took its taps, and 2× shows only the farm's middle with no panning. Phones zoom the page with a pinch. From 641 px up the controls stay; at a limit they are `aria-disabled` (still focusable) rather than `disabled`.
- **The selected block's running route belongs to "Tonight's water".** Selecting a block points the moving water at it alone (tonight's other routes stay orange and still); switching that layer off hides all of it, the selected route included.
- **Product cards ("Four surfaces, one decision") are a feature + list, not the reference's four equal cards:** Today, where the decision is made, is the feature card; the other three surfaces sit beside it (stacked under it below 1100 px), and every card's open arrow sits with its title, so short descriptions no longer end in an empty band.
- **Hero glow, hero scrim and CTA glow stay (on request), despite design.md's "no gradient surfaces".** A later pass replaced them with solid plates behind each headline line; the owner asked for the original look back, so the reference's gradients are restored as they were. The hero card's "Worked example" label stays.
- **Field section phones:** the overlapping pair needs about 560 px, so the points/phones split is one column up to 1260 px (phones under the text, both full size) and each phone hugs its own screen (`align-items: flex-start`).
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
- **Production runs `DATA_SOURCE=memory`, not Neon** (T23 steps 1, 2 and 5 replaced: no Neon project, no migrate, no seed). The Postgres repo (`repo/pg.ts`) was never built; only the schema and migrations exist. Memory mode is the live hourly scenario every test proves (`repo/hourly.ts`), with real wall-clock times, and the pg path would also need the re-seed/shift work noted under "Live scenario". The cost: Field "Mark done" and manual irrigation logs live in a function instance's memory. They last within an instance and the same GST day, and can reset when Vercel recycles an instance or adds one. Field says so (`field.demoNote`, en/ar/ur), and so does the README.
- **No `src/vercel.ts` (`hono/vercel` `handle`).** Vercel's current Hono support is zero-config: it serves the default export of `src/app.ts`, so `app.ts` exports the app and the separate entry is gone.
- **The SPA rewrite skips `/assets/`** (`/((?!assets/).*)` instead of `/(.*)`). Vercel serves existing files before rewrites either way, but with the plain pattern a missing hashed chunk (an open tab after a redeploy) came back as `index.html` with 200, which fails as a module MIME error; now it's an honest 404 (checked on production).
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
- **Landing micro-labels are uppercase** (`routes/landing/landing.css`: eyebrows, card kickers, table heads, footer heads at 11–12 px), as in the reference HTML. The plan's design.md reading asks for sentence case at 12.5 px or more; decide once and apply it across the landing stylesheet rather than per section.
- **`useGSAP` with `dependencies` must say `revertOnUpdate: true`** whenever the callback hides content with `from()`/`set()` or returns a cleanup. Without it the previous run is left in place on a dependency change and the new run's `from()` tweens record the old hidden state as their end state (sections never appearing after a language change on the landing page). Cockpit hooks only use `clearProps`/`fromTo`, so they are safe as they are.
- **ESLint lints `apps/web/playwright-report/`.** It is git-ignored but missing from `eslint.config` `ignores`, so after an E2E run that records a trace (any retry), `pnpm lint` fails on thousands of errors in the trace viewer's minified assets. Delete the folder, or add `'**/playwright-report/**'` to the ignores.
- **Schedule bar ranges in Arabic read backwards.** The bar text is `22:00 → 00:58`; in an RTL line the arrow (not a mirrored glyph) ends up pointing at the start time (`00:58 → 22:00` on screen). Use `←` in RTL or a bidi-isolated LTR run.
- **Map tooltips are placed in px from their own measured size** (`placeTooltip` in `farm-map/geometry.ts`) and keyed per block. Don't position them with Tailwind `translate-*` again: GSAP writes `translate: none` inline when it tweens the entrance, which cancels those classes and left the card off the map on phones.
- **Same-page links glide** (`motion/smoothScroll.ts`, GSAP ScrollTo, mounted once in `app/providers.tsx`): a capture-phase click listener, ahead of React Router's `<Link>` and ScrollRestoration, which would jump. On arrival it sets the hash so the URL, history and the focus starting point match a native jump. Arriving at `/today#attention` from another page still lands at once (ScrollRestoration scrolls to the hash first); only same-page clicks glide.
- **Left from the 2026-10-24 UI audit** (the rest was fixed):
  - **Memory data drifts hourly** (`repo/hourly.ts` rebuilds on the hour): between 19:55 and 20:05 GST D-1's history start moved from 22:00 to 23:00 while tonight's run still said 22:00, and D-3's "offline" age jumped 10 h → 8 h; the landing, the D-3 task and the stale banner name three different hours. Needs a data decision, not a UI fix.
  - **2× zoom can't pan** and always centres on the farm (`zoomViewBox`); centring it on the selected block would be the next step.
  - **Touch targets under 44 px** in the shell and cockpit (header controls 34–38 px, zoom 38, tabs 40, schedule rows 28). Fine for a mouse; the phone header keeps today's sizes.
  - **Times without "GST"** in the decision list windows, task titles and the landing night-window chip; **uppercase micro labels** on the app map ("WELL W-1", "TSE INLET") and landing soil section; **desktop soil-section labels** at 10.8 px.
  - **Block chart labels** ("68.0%", "65% threshold") sit on the data line; in Arabic the threshold label reads "65 عتبة%" (bidi).
  - **Accessible-name nits:** a stray space in schedule row names ("D-1 , 22:00"); bidi isolate characters inside decision button names.

## Languages and production copy

- **English and Arabic only.** Urdu was removed on request (Abu Dhabi uses Arabic): `LocaleSchema` and `I18nTextSchema` in `@saqi/shared` are `en | ar`, so the farm and task fixtures, the API seed, `ur.json`, the switch button, `:lang(ur)` rules and the Urdu tests and screenshot went with it. A stored `saqi.locale = 'ur'` falls back to English through `LocaleSchema.catch('en')`. Older sections above still mention Urdu as history.
- **No developer content on user pages.** Route paths, engine/test/CI talk, code-font formulas, token names, internal sensor IDs and the Field demo note are gone; the Making-of page tells its story in plain words. Prose has no em dashes or semicolons (both languages).
