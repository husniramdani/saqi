# CLAUDE.md — Saqi

You are building **Saqi**, an irrigation decision cockpit for a fictional farm near Al Ain, UAE. It is a portfolio piece for a senior frontend application, so polish, honesty and code quality matter more than feature count.

## Where things are

- This repo (`saqi/`, a pnpm monorepo) is the code. Run commands from here unless a task says otherwise.
- The plan lives in `../plan/` and the tasks in `../tasks/`, done in the order `../tasks/00-HOW-TO-RUN.md` gives (skeleton first, then design, then T05 onward).
- The design system is `./design.md` (Saqi Nightfield, Day and Night themes). It is canonical; `../design.md` is a copy for the plan docs, and the old "Saqi Sand" system is archived in `../design-archive/`.
- `NOTES.md` lists every placeholder seam and the task that fills it. Read it before starting a task.
- When a task says "read X", read it before writing code.

## Non-negotiables

1. **design.md is the source of truth for UI.** Use only its tokens (generated into `packages/tokens`). Follow its `ai-rules.always` and `ai-rules.never` lists literally.
2. **TypeScript strict everywhere.** No `any`, no `@ts-ignore`. Validate every API boundary with zod schemas from `@saqi/shared`.
3. **Business logic is pure and tested.** The recommendation engine (`@saqi/engine`) has no I/O and is covered by table-driven Vitest tests.
4. **All motion uses GSAP** (`gsap` + `@gsap/react` `useGSAP`) with durations and eases from `design.md` → `x-stylebase.motion`, wrapped in `gsap.matchMedia()` so `prefers-reduced-motion: reduce` jumps to the end state. No CSS transitions on layout properties, no framer-motion.
5. **RTL from day one.** Use CSS logical properties and `dir` on `<html>`; never hard-code left/right for layout or for GSAP x offsets (multiply by `dir === 'rtl' ? -1 : 1`).
6. **Honest data.** Weather and ET₀ are live from Open-Meteo. Sensors are simulated and the UI always says so ("Simulated sensors" badge). Never invent a real company, client or brand; the farm is fictional.
7. **Every data panel has four states:** loading (skeleton), empty, error (with retry), and stale (sensor older than 3 h).
8. **Accessibility:** keyboard reachable, visible focus ring (the `focus` token), text contrast ≥ 4.5:1, the SVG map has an accessible list alternative.

## Stack (do not swap without being asked)

- Web: Vite, React 19, TypeScript, React Router 7 (library mode), TanStack Query v5, Tailwind CSS v4 (tokens via `@theme`), GSAP 3.13+, `@gsap/react`, react-i18next, zod.
- API: Hono (Node runtime, deploys to Vercel), Drizzle ORM, Neon Postgres, zod. `DATA_SOURCE=memory|pg`.
- Shared packages: `@saqi/shared` (zod contracts + types), `@saqi/engine` (pure logic), `@saqi/tokens` (generated from design.md).
- Tests: Vitest (unit, API), Playwright (E2E + visual snapshots). CI: GitHub Actions.

## Commands

- `pnpm dev`: web on :5173, API on :8787 (memory data by default)
- `pnpm design:check`: validates `design.md` against the Stylebase v1 schema and regenerates tokens (exists from T02)
- `pnpm lint && pnpm typecheck && pnpm test`: must pass before every commit
- `pnpm e2e`: Playwright against the memory-backed API (exists from T21)

## Working rules

- Keep each task inside its stated scope. If you find something out of scope that is broken, note it in `NOTES.md` instead of fixing it.
- Small, readable components. Co-locate a component's test next to it.
- Commit at the end of each task with the commit message the task gives, using Conventional Commits.
- Timestamps: store UTC, display in Gulf Standard Time (`Asia/Dubai`, label "GST").
