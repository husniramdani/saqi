/**
 * Plant-available water → water-0 (dry) … water-6 (wet), in seven equal steps:
 * step = min(6, floor(PAW / 100 × 7)), so 0–14 % is water-0 and 86–100 % is water-6 (design.md).
 */
export function moistureStep(paw: number | null): number | null {
  if (paw === null || !Number.isFinite(paw)) return null;
  return Math.min(6, Math.max(0, Math.floor((paw / 100) * 7)));
}

/** CSS colour for a PAW %, read from the theme so Day and Night both work. */
export function moistureToken(paw: number | null): string {
  const step = moistureStep(paw);
  return step === null ? 'var(--color-stale)' : `var(--color-water-${step})`;
}
