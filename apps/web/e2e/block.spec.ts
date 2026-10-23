import { expect, test } from './fixtures';

test('selecting D-1 on the map and opening it shows why, with the moisture chart', async ({
  page,
  todayPage,
  blockPage,
}) => {
  await todayPage.goto();
  await todayPage.block('D-1').click();
  await expect(todayPage.block('D-1')).toHaveAttribute('aria-pressed', 'true');
  await todayPage.openBlock('D-1').click();

  await expect(page).toHaveURL(/\/blocks\/D-1$/);
  await expect(page).toHaveTitle('D-1 Khalas palms · Saqi');
  await expect(blockPage.heading()).toHaveText(/D-1\s*Khalas palms/);
  await expect(blockPage.reasons().nth(3)).toBeVisible(); // four reasons or more
  await expect(
    blockPage.reasons().filter({ hasText: 'Falls below the 65% threshold' }),
  ).toHaveCount(1);

  await expect(blockPage.chart()).toBeVisible();
  // The chart's text alternative: a header row plus the last seven days.
  await expect(blockPage.dailyTable().getByRole('row')).toHaveCount(8);
});
