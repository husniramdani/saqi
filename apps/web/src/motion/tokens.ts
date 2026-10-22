/**
 * Motion tokens from design.md → x-stylebase.motion (Nightfield canvas):
 * tick 0.12 · step 0.24 · settle 0.48 · drift 0.9 · tide 1.6 s;
 * standard power2.out · reveal expo.out · emphasized power3.inOut · water none.
 */
import { duration, ease, stagger } from '@saqi/tokens/motion';
import { gsap } from './gsap';

gsap.defaults({ duration: duration.settle, ease: ease.standard });

export { duration, ease, stagger };
