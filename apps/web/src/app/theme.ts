import { colors, nightColors } from '@saqi/tokens';

export type Theme = 'day' | 'night';
const STORAGE_KEY = 'saqi.theme';

/** Day is the default (design.md); Night is the graphite dashboard theme. */
export function storedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'night' ? 'night' : 'day';
  } catch {
    return 'day'; // storage blocked
  }
}

/** Re-points every token via `[data-theme='night']`; components never branch on theme. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'night') root.dataset['theme'] = 'night';
  else delete root.dataset['theme'];
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'night' ? nightColors.background : colors.background);
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}
