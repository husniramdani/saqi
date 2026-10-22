import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setTheme, storedTheme, type Theme } from './theme';

const ic = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
} as const;

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, set] = useState<Theme>(storedTheme);
  const next: Theme = theme === 'day' ? 'night' : 'day';
  return (
    <button
      type="button"
      aria-label={t(next === 'night' ? 'shell.theme.toNight' : 'shell.theme.toDay')}
      onClick={() => {
        setTheme(next);
        set(next);
      }}
      className="grid size-11 place-items-center rounded-full border border-border bg-surface text-text-primary"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        {theme === 'day' ? (
          <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" {...ic} />
        ) : (
          <>
            <circle cx="8" cy="8" r="3" {...ic} />
            <path
              d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"
              {...ic}
            />
          </>
        )}
      </svg>
    </button>
  );
}
