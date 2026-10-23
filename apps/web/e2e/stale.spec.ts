import { expect, test } from './fixtures';

test('D-3’s silent 60 cm sensor shows as stale on the map and on its page, with low confidence', async ({
  page,
  todayPage,
}) => {
  await todayPage.goto();
  await expect(todayPage.block('D-3')).toHaveAccessibleName(/stale sensor/);

  await page.goto('/blocks/D-3');
  await expect(page.getByText(/60 cm sensor offline since/)).toBeVisible();
  await expect(page.getByText('Confidence: Low')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Why' })).toContainText(
    /The \u2066?60 cm\u2069? sensor has not reported for \d+\sh/,
  );
});
