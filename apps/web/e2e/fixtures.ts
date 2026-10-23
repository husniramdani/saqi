import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { FROZEN_NOW } from './playwright.config';

/**
 * Shared fixtures. Every test starts with the browser clock set to the API's frozen instant
 * (`NOW` in playwright.config.ts), so "today", "tonight" and staleness agree end to end.
 * The browser clock then flows (`setSystemTime`, not `setFixedTime`): GSAP's ticker reads
 * `Date.now()`, so a fixed time stalls every animation at frame zero (the language crossfade
 * never swaps, the sheet never closes). Seconds of drift never change a minute-precision label.
 * Page objects use roles, labels and visible text only: if a selector breaks, a user's way of
 * finding that thing broke too.
 */

export type Locale = 'en' | 'ar' | 'ur';
/** The language switch shows each language in its own script. */
const LANGUAGE_GLYPH: Record<Locale, string> = { en: 'EN', ar: 'ع', ur: 'ار' };

export class TodayPage {
  constructor(readonly page: Page) {}
  readonly map = () => this.page.getByRole('group', { name: /^Map of / });
  readonly block = (code: string) =>
    this.map().getByRole('button', { name: new RegExp(`^${code} `) });
  readonly schedule = () => this.page.getByRole('region', { name: 'Tonight’s schedule' });
  /** One row per night run, named "D-1, 22:00 → 01:01 GST, 90.4 m³". */
  readonly nightRuns = () => this.schedule().getByRole('button', { name: /m³$/ });
  readonly pulses = () => this.schedule().getByRole('time');
  readonly planPanel = () => this.page.getByRole('complementary', { name: 'Tonight’s plan' });
  readonly rail = () => this.page.getByRole('complementary', { name: 'Blocks' });
  /** The rail's link to a block's detail page (shown for the selected block). */
  readonly openBlock = (code: string) => this.rail().getByRole('link', { name: `Open ${code}` });

  async goto() {
    await this.page.goto('/today');
    await expect(this.map()).toBeVisible();
  }

  async openWaterTab() {
    await this.planPanel().getByRole('tab', { name: 'Water' }).click();
  }
}

export class BlockPage {
  constructor(readonly page: Page) {}
  readonly heading = () => this.page.getByRole('heading', { level: 1 });
  readonly reasons = () => this.page.getByRole('list', { name: 'Why' }).getByRole('listitem');
  readonly chart = () =>
    this.page.getByRole('img', { name: /Plant-available water over the last 14 days/ });
  readonly dailyTable = () =>
    this.page.getByRole('table', { name: 'Daily mean plant-available water, last 7 days' });
}

export class FieldPage {
  constructor(readonly page: Page) {}
  readonly banner = () => this.page.getByRole('main').getByRole('status').first();
  readonly task = (title: string) => this.page.getByRole('article').filter({ hasText: title });
  readonly doneToday = () => this.page.getByRole('group').filter({ hasText: /^Done today/ });

  async goto(worker: 'Rahim' | 'Imran' = 'Rahim') {
    await this.page.goto('/field');
    await this.page.getByRole('tab', { name: worker }).click();
    await expect(this.page.getByRole('article').first()).toBeVisible();
  }

  async markDone(title: string, note?: string) {
    await this.task(title).getByRole('button', { name: 'Mark done' }).click();
    const sheet = this.page.getByRole('dialog', { name: 'Mark done' });
    if (note) await sheet.getByLabel('Note (optional)').fill(note);
    await sheet.getByRole('button', { name: 'Confirm' }).click();
    await expect(sheet).toBeHidden();
  }
}

/** The header's language switch: the button showing the language's own glyph. */
export function languageButton(page: Page, locale: Locale): Locator {
  return page
    .getByRole('banner')
    .getByRole('button')
    .filter({ hasText: new RegExp(`^${LANGUAGE_GLYPH[locale]}$`) });
}

export async function switchLocale(page: Page, locale: Locale) {
  await languageButton(page, locale).click();
  await expect(page.locator('html')).toHaveAttribute('lang', locale);
}

interface Fixtures {
  todayPage: TodayPage;
  blockPage: BlockPage;
  fieldPage: FieldPage;
  frozenClock: undefined;
}

export const test = base.extend<Fixtures>({
  frozenClock: [
    async ({ page }, use) => {
      await page.clock.setSystemTime(new Date(FROZEN_NOW));
      await use(undefined);
    },
    { auto: true },
  ],
  todayPage: async ({ page }, use) => use(new TodayPage(page)),
  blockPage: async ({ page }, use) => use(new BlockPage(page)),
  fieldPage: async ({ page }, use) => use(new FieldPage(page)),
});

export { expect };
