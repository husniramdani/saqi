# Notes

Working notes for whoever (human or Claude Code) picks up the next task. Read this before starting one.

## TODO seams and the task that fills each

Search the code for `TODO(Txx)` to find each seam.

| Seam                                            | Where                                                    | Filled by |
| ----------------------------------------------- | -------------------------------------------------------- | --------- |
| Postgres repo, Neon client, `db:migrate` driver | `apps/api/src/repo/pg.ts` (throws `NotImplementedError`) | T07       |

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

## Making-of story (T19)

- **Honest by construction:** the code panel is the real `design.md` colour block (`?raw`, 18 lines: `colors:`, the first eight tokens, an ellipsis, the water scale and `stale`); the formula and the three decision cards are computed by `@saqi/engine` (now a web dependency) from the worked example (plan/04 §3), so they read 90.4 m³, Skip and Deficit 155.5 m³ because the engine says so. `data.test.ts` pins all three.
- **The formula shows projected PAW as 60.35 %, not 60.3 %:** with the one-decimal value the terms multiply out to 90.6, not the engine's 90.4. The engine never rounds inside; the scene says so.
- **Mini map:** D-3, D-4 and G-2 have no worked-example PAW, so the story gives them plausible skips (76, 81, 78 %). It's `inert` and `aria-hidden`; the code panel and palette carry the meaning.
- **Test counts:** `FALLBACK_STATS` was counted by hand on 2026-10-23 (engine 56, API 86, web 151). E2E and CI minutes show "—" with "After the first CI run" until T22's `public/test-stats.json` exists (schema `{ engine, api, web, e2e, durationSec }`, validated with zod; a missing file falls back, since the dev server answers it with `index.html`).
- **Author links:** only "Open the app" and Stylebase are listed. **T24 fills the GitHub repo, LinkedIn and email** in `LINKS` (`routes/making-of/scenes.tsx`) plus their `makingOf.scene5.links.*` strings; none of them exist in the repo or the plan, and none were invented.
- **Scene 5 doesn't pin:** it's the ending; its links fade in once. Scenes 1–4 pin for one screen each and hold their finished state for the last third of the pin, so counters aren't still climbing at release.
- **Remount on language change:** `<Story key={locale}>`. SplitText and pin spacers rewrite the DOM, and React must never reconcile text inside a node GSAP rewrote; remounting runs the revert first.
- **`useGSAP` gotcha (also for T20):** with `dependencies` but without `revertOnUpdate: true`, a dependency change does **not** revert the previous run; it stacks a new one. The story built twice (20 triggers, 8 pins) when the stats query resolved. Fixed here with `revertOnUpdate: true`. Other calls use the same pattern: `Spinner` (an infinite spin, deps `[reduced]`), `mapMotion` (pipe flow loops, deps `[routeKey, reduced]`), `Meter`, `Figure`, `MapTooltip`, `RecommendationCard`, `SchedulePanel`, `block.tsx`. Most are one-shot tweens that harmlessly overwrite, but the looping ones can stack on change. Not fixed here (out of scope); T20 should audit them.
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
- **M5 Flip:** "Open D-1" in the rail records the map block (`motion/flip.ts`); the Block page morphs its header swatch out of it (settle, power3.inOut, absolute + scale). Today preloads the map plugins so Flip is ready by the first click. Only a click records, so back/forward and deep links never play it.
- **Two StrictMode traps, both fixed and commented:**
  - `useGSAP` hands the second dev run the context the first run's cleanup reverted, so anything `context.add`-ed after an async load is killed on arrival. The reveal owns its timeline and kills it in its own cleanup.
  - The Block page's double mount consumed the Flip state before the real mount. `takeBlock` lets the same block retake it within 300 ms, never later. Tested with fake timers.
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

- `features/moisture-chart/` (hand SVG + pure `chart.ts`), `features/recommendation/` (card, events table, manual log), `features/tasks/BlockTasks`. The page: header with the Flip swatch (`data-flip-id="block-…"`, for T16), chart panel with the stale banner, recommendation card, events, the block's tasks and the manual log.
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
- **Motion hooks for T16:** `.layer-*` groups, `data-flip-id="block-…"` on fills, `data-scheduled` on tonight's pipes. Tonight's flow is a static dashed line until GSAP animates it.
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
