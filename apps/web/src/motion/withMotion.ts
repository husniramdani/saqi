import { gsap } from './gsap';

/**
 * Runs `full` normally and `reduced` when the OS (or `forceReduced`) asks for reduced motion,
 * inside gsap.matchMedia(), so a preference change mid-session reverts and re-runs correctly.
 * Returns the revert function (call it from useGSAP cleanup).
 */
export function withMotion(
  full: () => void,
  reduced: () => void,
  forceReduced = false,
): () => void {
  // A forced end state needs no media query (and must not depend on one matching).
  if (forceReduced) {
    const ctx = gsap.context(reduced);
    return () => ctx.revert();
  }
  const mm = gsap.matchMedia();
  mm.add(
    {
      full: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      if (context.conditions?.['reduced']) reduced();
      else full();
    },
  );
  return () => mm.revert();
}
