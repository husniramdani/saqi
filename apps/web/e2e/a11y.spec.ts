import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test, type Locale } from './fixtures';

/** Press Tab (or Shift+Tab) until `done` holds; fails after `max` presses. */
async function tabUntil(page: Page, done: () => Promise<boolean>, { back = false, max = 80 } = {}) {
  for (let i = 0; i < max; i++) {
    if (await done()) return;
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`focus never reached the target in ${max} presses`);
}

test('keyboard only: into the map, across blocks, open D-1, and back', async ({
  page,
  todayPage,
}) => {
  await todayPage.goto();
  const inMap = () =>
    page.evaluate(() =>
      Boolean(document.activeElement?.closest('[role="group"][aria-label^="Map of"]')),
    );
  await tabUntil(page, inMap);

  await page.keyboard.press('Home'); // first block in reading order
  await expect(todayPage.block('D-1')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(todayPage.block('D-1')).not.toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(todayPage.block('D-1')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(todayPage.block('D-1')).toHaveAttribute('aria-pressed', 'true');

  // The rail (before the map in reading order) now offers the selected block's page.
  const open = todayPage.openBlock('D-1');
  await tabUntil(page, () => open.evaluate((el) => el === document.activeElement), { back: true });
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/blocks\/D-1$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(todayPage.map()).toBeVisible();
});

const ROUTES = ['/', '/blocks/D-1', '/field', '/making-of'];
const LOCALES: Locale[] = ['en', 'ar'];

test.describe('axe', () => {
  // Scan end states: a stagger caught mid-fade would fail contrast on a frame no one reads.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      test(`axe: no serious or critical violations on ${route} (${locale})`, async ({ page }) => {
        await page.addInitScript((l) => localStorage.setItem('saqi.locale', l), locale);
        await page.goto(route);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        // Data panels settle (no loading status left) before scanning.
        await expect(page.getByRole('status', { name: /Loading|جارٍ التحميل/ })).toHaveCount(0);
        const { violations } = await new AxeBuilder({ page }).analyze();
        const serious = violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(serious).toEqual([]);
      });
    }
  }
});
