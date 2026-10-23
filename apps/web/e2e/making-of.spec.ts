import { expect, test } from './fixtures';

const SCENES = [
  'One file decides how it looks.',
  'Water first.',
  'Every decision explains itself.',
  'Tested like production.',
  'Built by Husni Ramdani.',
];

test.describe('with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('every scene is on the page, readable, and nothing is pinned', async ({ page }) => {
    await page.goto('/making-of');
    await expect(page).toHaveTitle('How Saqi is built · Saqi');
    for (const name of SCENES) {
      const scene = page.getByRole('region', { name });
      await scene.scrollIntoViewIfNeeded();
      await expect(scene.getByRole('heading', { level: 2 })).toBeVisible();
    }
    // The formula's figures are the engine's, already final.
    await expect(page.getByRole('region', { name: 'Water first.' })).toContainText('90.4');
  });
});

test('with motion, scrolling into scene 4 counts the tests up from zero', async ({ page }) => {
  await page.goto('/making-of');
  await expect(page.getByRole('main')).toHaveAttribute('data-story', 'pinned');
  const tested = page.getByRole('region', { name: 'Tested like production.' });
  const engine = tested.getByRole('definition').first();
  await expect(engine).toHaveText('0'); // counters start from zero while pinned
  // Pinned and scrubbed: scroll to where the pin starts, then most of the way through it.
  await tested.evaluate((el) => {
    // The pinned section sits in its pin spacer; the spacer marks where the pin starts.
    const pinStart = (el.parentElement ?? el).getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, pinStart + window.innerHeight * 0.8);
  });
  await expect.poll(async () => engine.textContent(), { timeout: 5_000 }).not.toBe('0');
  await expect(engine).toHaveText(/^\d+$/);
});
