import { defineConfig, devices } from '@playwright/test';

/**
 * E2E against the memory-backed API with a frozen clock (plan/07 §2). Both servers start fresh
 * for every run (no reuse), so the API's in-memory state never leaks between runs.
 *
 * - API on :8788 (the dev API keeps :8787): `NOW` freezes its clock at the same instant the
 *   browser's clock is frozen to (fixtures.ts), `WEATHER_FIXTURE=1` serves the recorded
 *   worked-example forecast, so no test touches the network for data.
 * - Web: the production build, served by `vite preview` on :4173, pointed at that API.
 *
 * Visual baselines are rendered by a Linux browser so they match CI: `pnpm e2e:docker` runs the
 * browser in the official Playwright image (PW_BROWSER_WS). Without it, on macOS, `pnpm e2e`
 * runs every journey but skips only the pixel comparisons.
 */
export const FROZEN_NOW = '2026-10-23T21:00:00+04:00';
const API = 'http://localhost:8788';
const WEB = 'http://localhost:4173';
const browserWs = process.env['PW_BROWSER_WS'];

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../playwright-report' }],
    // Read by scripts/test-stats.ts for the Making-of counters.
    ['json', { outputFile: '../.playwright/results.json' }],
  ],
  outputDir: '../test-results',
  // One baseline per screenshot for every OS: they're rendered on Linux (Docker or CI).
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  ignoreSnapshots: !browserWs && !process.env['CI'],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: {
    baseURL: WEB,
    timezoneId: 'Asia/Dubai',
    locale: 'en-GB',
    trace: 'on-first-retry',
    ...(browserWs
      ? { connectOptions: { wsEndpoint: browserWs, exposeNetwork: '<loopback>' } }
      : {}),
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: ['visual.spec.ts', 'field-offline.spec.ts'],
    },
    {
      // Field is phone-first, so the offline journey runs here (once: it changes server state).
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
      testMatch: ['today.spec.ts', 'stale.spec.ts', 'field-offline.spec.ts'],
    },
    {
      name: 'visual-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        contextOptions: { reducedMotion: 'reduce' },
      },
      testMatch: 'visual.spec.ts',
      grep: /@desktop/,
    },
    {
      name: 'visual-mobile',
      use: { ...devices['Pixel 7'], contextOptions: { reducedMotion: 'reduce' } },
      testMatch: 'visual.spec.ts',
      grep: /@mobile/,
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter api exec tsx src/server.ts',
      url: `${API}/api/health`,
      reuseExistingServer: false,
      env: {
        DATA_SOURCE: 'memory',
        PORT: '8788',
        NOW: new Date(FROZEN_NOW).toISOString(),
        WEATHER_FIXTURE: '1',
        CORS_ORIGIN: WEB,
      },
    },
    {
      command: 'pnpm exec vite build && pnpm exec vite preview --port 4173 --strictPort',
      url: WEB,
      cwd: '..',
      reuseExistingServer: false,
      env: { VITE_API_URL: API },
      timeout: 120_000,
    },
  ],
});
