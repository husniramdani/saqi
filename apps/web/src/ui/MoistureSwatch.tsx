import { moistureToken } from './moisture';

/** Small water-scale swatch. Decorative: the PAW figure beside it carries the meaning. */
export function MoistureSwatch({ paw, size = 14 }: { paw: number | null; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-[4px] border border-border"
      style={{ inlineSize: size, blockSize: size, background: moistureToken(paw) }}
    />
  );
}
