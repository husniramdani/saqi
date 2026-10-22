// Rounding happens only at the edge, when building output (plan/04 §2.5).
// Internal maths stays unrounded.

/** PAW, mm and m³ to 0.1. */
export const round1 = (x: number): number => Math.round(x * 10) / 10;

/** Litres per tree to the nearest 10 L. */
export const round10 = (x: number): number => Math.round(x / 10) * 10;
