/** The north-east arrow from the pill buttons; mirrors in RTL. */
export function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="rtl:-scale-x-100"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 11.5L11.5 4.5M6 4.5h5.5V10" />
    </svg>
  );
}
