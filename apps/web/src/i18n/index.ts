import { LocaleSchema, type Locale } from '@saqi/shared';
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next, useTranslation } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

const STORAGE_KEY = 'saqi.locale';

export const isRtl = (locale: Locale) => locale === 'ar';

function storedLocale(): Locale {
  try {
    return LocaleSchema.catch('en').parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return 'en'; // storage blocked (private mode, sandboxed iframe)
  }
}

function applyToDocument(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
}

export async function setLocale(locale: Locale) {
  await i18n.changeLanguage(locale);
  applyToDocument(locale);
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

/** The active locale, typed. */
export function useLocale(): Locale {
  const { i18n: instance } = useTranslation();
  return LocaleSchema.catch('en').parse(instance.language);
}

const initial = storedLocale();
void i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: initial,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
applyToDocument(initial);

export { i18n };
