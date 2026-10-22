import type { Locale } from '@saqi/shared';
import { useTranslation } from 'react-i18next';
import { setLocale, useLocale } from '@/i18n';
import { cx } from '@/ui';

// Each language names itself in its own script; the accessible name says which it is.
const LANGUAGES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ar', label: 'ع' },
  { value: 'ur', label: 'ار' },
];

export function LanguageSwitch() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <div
      role="group"
      aria-label={t('shell.language')}
      className="flex rounded-full border border-border bg-surface p-0.5"
    >
      {LANGUAGES.map((l) => (
        <button
          key={l.value}
          type="button"
          lang={l.value}
          aria-pressed={l.value === locale}
          aria-label={t(`shell.languages.${l.value}`)}
          onClick={() => void setLocale(l.value)}
          className={cx(
            'num h-11 min-w-11 rounded-full px-2 text-xs font-medium',
            l.value === locale ? 'bg-primary text-primary-foreground' : 'text-text-secondary',
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
