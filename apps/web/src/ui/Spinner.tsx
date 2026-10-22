import { useRef } from 'react';
import { spin, useGSAP, useMotion } from '@/motion';

/** Loading ring: turns through GSAP; still under reduced motion (the button says busy anyway). */
export function Spinner() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced } = useMotion();
  useGSAP(
    () => {
      if (ref.current) spin(ref.current, { reduced });
    },
    { dependencies: [reduced] },
  );
  return (
    <svg ref={ref} width="18" height="18" viewBox="0 0 18 18" fill="none" data-spinner>
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
