import { z } from 'zod';

export const LocaleSchema = z.enum(['en', 'ar', 'ur']);
export type Locale = z.infer<typeof LocaleSchema>;

export const I18nTextSchema = z.object({
  en: z.string().min(1),
  ar: z.string().min(1),
  ur: z.string().min(1),
});
export type I18nText = z.infer<typeof I18nTextSchema>;

/** ISO 8601 instant; the API emits UTC (`Z`), the engine may emit `+04:00`. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });
export const IsoDateSchema = z.iso.date();
export const HhmmSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');
export const MonthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');
