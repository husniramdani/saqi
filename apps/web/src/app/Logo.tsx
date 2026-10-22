/** Saqi's mark: an ink ring, tonight's orange wave, a drop of water (Nightfield canvas). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <circle
        cx="15"
        cy="15"
        r="13.5"
        fill="none"
        stroke="var(--color-text-primary)"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 16.5 Q10.25 13 15 16.5 T24.5 16.5"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="15" cy="9" r="1.8" fill="var(--color-water-4)" />
    </svg>
  );
}
