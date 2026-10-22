/** mulberry32: a tiny seeded PRNG. Same seed, same sequence, byte for byte. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Standard normal sample from a uniform PRNG (Box–Muller). */
export function gaussian(rng: () => number): number {
  const u = 1 - rng(); // (0, 1]: keeps log() finite
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}
