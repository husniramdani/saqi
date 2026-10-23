/**
 * Renders the social card: screenshots the dev-only `/og` route at 1200 × 630 into public/og.png.
 * Run it through `pnpm og` (e2e/docker.sh og), so the browser is the Linux one from the
 * Playwright image, with the same fonts as CI's visual baselines. Node's type stripping runs it.
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const wsEndpoint = process.env['PW_BROWSER_WS'];
if (!wsEndpoint) throw new Error('PW_BROWSER_WS is not set; run `pnpm og`.');

const PORT = 5179;
const URL_OG = `http://localhost:${PORT}/og`;
const OUT = fileURLToPath(new URL('../public/og.png', import.meta.url));
const WEB_DIR = fileURLToPath(new URL('..', import.meta.url));

const vite = spawn('pnpm', ['exec', 'vite', '--port', String(PORT), '--strictPort'], {
  cwd: WEB_DIR,
  stdio: 'ignore',
});

try {
  for (let i = 0; ; i++) {
    if (i > 60) throw new Error(`Vite did not answer on :${PORT}`);
    const up = await fetch(URL_OG).then(
      (r) => r.ok,
      () => false,
    );
    if (up) break;
    await sleep(500);
  }

  const browser = await chromium.connect(wsEndpoint, { exposeNetwork: '<loopback>' });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'en-GB',
    timezoneId: 'Asia/Dubai',
  });
  await page.goto(URL_OG, { waitUntil: 'networkidle' });
  await page.locator('[data-og] svg').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT, animations: 'disabled' });
  await browser.close();
  console.log(`Wrote ${OUT}`);
} finally {
  vite.kill();
}
