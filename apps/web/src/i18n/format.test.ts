import { describe, expect, it } from 'vitest';
import {
  formatDateGst,
  formatM3,
  formatMm,
  formatNumber,
  formatPct,
  formatTimeGst,
} from './format';

const easternDigits = /[٠-٩۰-۹]/;

describe('format', () => {
  it('sets units after the figure', () => {
    expect(formatM3(90.43, 'en')).toBe('90.4 m³');
    expect(formatMm(5.8, 'en')).toBe('5.8 mm');
    expect(formatPct(68, 'en')).toBe('68.0%');
  });

  it('rounds to the requested precision and groups thousands', () => {
    expect(formatNumber(6912.4, 'en', 0)).toBe('6,912');
    expect(formatM3(155.47, 'en')).toBe('155.5 m³');
  });

  it.each(['ar', 'ur'] as const)('keeps Western digits in %s', (locale) => {
    const out = [
      formatM3(1234.5, locale),
      formatPct(57.6, locale),
      formatTimeGst('2026-10-23T18:00:00Z', locale),
    ];
    for (const s of out) expect(s).not.toMatch(easternDigits);
    expect(out[0]).toContain('234');
  });

  it('shows times in GST (UTC+4) with the label', () => {
    expect(formatTimeGst('2026-10-23T18:00:00Z', 'en')).toBe('22:00 GST');
    expect(formatTimeGst('2026-10-23T21:01:00Z', 'en')).toBe('01:01 GST');
    expect(formatTimeGst('2026-10-23T18:00:00Z', 'ar')).toContain('22:00');
  });
});

describe('formatDateGst', () => {
  it('names the GST calendar day without shifting it', () => {
    expect(formatDateGst('2026-10-23', 'en')).toBe('Fri 23 Oct'); // 23 Oct 2026 is a Friday (plan docs say Thu);
  });

  it('keeps Western digits in Arabic', () => {
    expect(formatDateGst('2026-10-23', 'ar')).toContain('23');
  });
});
