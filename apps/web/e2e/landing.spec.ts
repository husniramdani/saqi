import { expect, switchLocale, test } from './fixtures';

test('the landing page explains a decision, lists every block and opens the cockpit', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Water what the soil asks for.');

  // The decision explorer: Irrigate → Skip swaps the recommendation to D-2, holding tonight.
  const explorer = page.getByRole('group', { name: 'Choose a decision' });
  const recommendation = page.getByRole('complementary', { name: 'Recommendation' });
  await expect(recommendation).toContainText('Khalas palms');
  await explorer.getByRole('button', { name: /D-2 Skip/ }).click();
  await expect(explorer.getByRole('button', { name: /D-2 Skip/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(recommendation).toContainText('Lulu palms');
  await expect(recommendation).toContainText('Skip');
  await expect(recommendation).toContainText('0m³');

  // Map → List: the table alternative shows all seven Farm 07 blocks.
  const views = page.getByRole('group', { name: 'Farm view' });
  await views.getByRole('button', { name: 'List' }).click();
  await expect(views.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  const table = page.getByRole('table', { name: /tonight’s decisions, all blocks/ });
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(8);

  await page.getByRole('link', { name: 'See tonight’s plan' }).click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tonight');
});

test('Arabic mirrors the landing page but keeps Western digits and the farm plan', async ({
  page,
}) => {
  await page.goto('/');
  await switchLocale(page, 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const recommendation = page.getByRole('complementary', { name: 'التوصية' });
  await expect(recommendation).toContainText('90.4');
  // The plan is geography: it never mirrors, whatever the reading direction.
  const map = page.getByRole('img', { name: /^خريطة/ }).first();
  await expect(map).toHaveAttribute('viewBox', '0 0 1000 620');
});
