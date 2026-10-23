import { expect, test } from './fixtures';

test('Today shows tonight’s plan: seven blocks, D-1 irrigates 90.4 m³, two night runs, six pulses, a tight month', async ({
  page,
  todayPage,
}) => {
  await todayPage.goto();
  await expect(page).toHaveTitle('Tonight · Saqi');
  await expect(todayPage.map().getByRole('button')).toHaveCount(7);
  await expect(todayPage.block('D-1')).toHaveAccessibleName(/Irrigate, 90\.4 cubic metres/);

  await expect(todayPage.nightRuns()).toHaveCount(2);
  await expect(todayPage.nightRuns().first()).toHaveAccessibleName(/^D-1\W+22:00/);
  await expect(todayPage.pulses()).toHaveCount(6);

  await todayPage.openWaterTab();
  await expect(todayPage.planPanel().getByText('Tight', { exact: true })).toBeVisible();
  await expect(todayPage.planPanel()).toContainText('F-1 70%');
});
