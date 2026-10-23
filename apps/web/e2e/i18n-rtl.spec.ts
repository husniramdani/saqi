import { expect, switchLocale, test } from './fixtures';

test('Arabic mirrors the app, time runs right to left, and the choice survives a reload', async ({
  page,
  todayPage,
}) => {
  await todayPage.goto();
  await switchLocale(page, 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page).toHaveTitle('الليلة · Saqi');

  // D-1 runs from 22:00, the start of the night window, so in RTL its bar starts at the right.
  const d1 = page
    .getByRole('region', { name: 'جدول الليلة' })
    .getByRole('button', { name: /^D-1\b/ });
  const { barRight, trackRight, barLeft, trackLeft } = await d1.evaluate((row) => {
    const bar = row.querySelector('[data-schedule-bar]');
    const track = bar?.parentElement;
    const b = bar?.getBoundingClientRect();
    const t = track?.getBoundingClientRect();
    return { barRight: b?.right, trackRight: t?.right, barLeft: b?.left, trackLeft: t?.left };
  });
  expect(Math.abs((trackRight ?? 0) - (barRight ?? 0))).toBeLessThan(2);
  expect((barLeft ?? 0) - (trackLeft ?? 0)).toBeGreaterThan(10);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS(
    'font-family',
    /IBM Plex Sans Arabic/,
  );
  expect(
    await page.evaluate(() => document.fonts.check('16px "IBM Plex Sans Arabic"', 'العربية')),
  ).toBe(true);
});
