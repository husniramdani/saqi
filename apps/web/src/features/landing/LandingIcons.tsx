/** Icons and the brand mark as drawn on the landing reference (classes carry the theme colours). */

export function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="flip">
      <path d="M4.5 11.5L11.5 4.5M6 4.5h5.5V10" className="ic" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="flip">
      <path d="M6 3.5L10.5 8 6 12.5" className="ic" />
    </svg>
  );
}

export function LandingLogo() {
  return (
    <>
      <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
        <circle cx="15" cy="15" r="13.5" className="lg-ring" />
        <path d="M5.5 16.5 Q10.25 13 15 16.5 T24.5 16.5" className="lg-wave" />
        <circle cx="15" cy="9" r="1.8" className="lg-dot" />
      </svg>
      <span className="logo-t">Saqi</span>
      <span className="logo-ar" lang="ar">
        ساقي
      </span>
    </>
  );
}

/** Section index tag: `05 —— How it decides`. */
export function SectionIndex({ number, label }: { number: string; label: string }) {
  return (
    <span className="idx">
      <span>{number}</span>
      <i />
      <b>{label}</b>
    </span>
  );
}
