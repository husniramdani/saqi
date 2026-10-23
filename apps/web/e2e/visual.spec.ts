import type { Page } from '@playwright/test';
import { expect, test, type Locale } from './fixtures';

/** Reduced motion (project setting) and settled fonts, so every frame is the end state. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByRole('status', { name: /Loading|جارٍ التحميل|لوڈ ہو رہا ہے/ }),
  ).toHaveCount(0);
}

for (const locale of ['en', 'ar'] as Locale[]) {
  test(`Today, ${locale} @desktop`, async ({ page, todayPage }) => {
    await page.addInitScript((l) => localStorage.setItem('saqi.locale', l), locale);
    await page.goto('/');
    await expect(todayPage.map().or(page.getByRole('group', { name: /^خريطة/ }))).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot(`today-${locale}.png`, { fullPage: true });
  });
}

for (const locale of ['en', 'ar', 'ur'] as Locale[]) {
  // Imran's list: the offline journey changes Rahim's tasks on the shared API.
  test(`Field, ${locale} @mobile`, async ({ page }) => {
    await page.addInitScript((l) => {
      localStorage.setItem('saqi.locale', l);
      localStorage.setItem('saqi.worker', 'imran');
    }, locale);
    await page.goto('/field');
    await expect(page.getByRole('article').first()).toBeVisible();
    await settle(page);
    // The phone's own view: a full-page capture would paint the fixed bottom nav mid-page.
    await expect(page).toHaveScreenshot(`field-${locale}.png`);
  });
}
