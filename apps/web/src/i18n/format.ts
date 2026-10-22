import type { Locale } from '@saqi/shared';

// Western digits in every locale (design.md): figures stay comparable across languages.
const TAGS: Record<Locale, string> = {
  en: 'en-GB',
  ar: 'ar-AE-u-nu-latn',
  ur: 'ur-PK-u-nu-latn',
};

export const intlLocale = (locale: Locale) => TAGS[locale];

export const formatNumber = (value: number, locale: Locale, digits = 1) =>
  new Intl.NumberFormat(TAGS[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

export const formatM3 = (value: number, locale: Locale, digits = 1) =>
  `${formatNumber(value, locale, digits)} m³`;

export const formatMm = (value: number, locale: Locale, digits = 1) =>
  `${formatNumber(value, locale, digits)} mm`;

export const formatPct = (value: number, locale: Locale, digits = 1) =>
  `${formatNumber(value, locale, digits)}%`;

/** Wall-clock time in Gulf Standard Time, always labelled. */
export const formatTimeGst = (iso: string, locale: Locale) =>
  `${new Intl.DateTimeFormat(TAGS[locale], {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso))} GST`;
