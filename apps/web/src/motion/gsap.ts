/**
 * The only place GSAP plugins are registered. Core + useGSAP ship with every route; the map and
 * story plugins load on demand, so Field never downloads them (plan/06 §2, NFR2).
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

let mapPlugins: Promise<void> | null = null;
let flip: (typeof import('gsap/Flip'))['Flip'] | null = null;
let storyPlugins: Promise<void> | null = null;

/**
 * DrawSVG and Flip: Today's map reveal and the block Flip. (Water flow animates the stroke
 * offset, as on the Nightfield canvas, so MotionPath isn't needed.)
 */
export function loadMapPlugins(): Promise<void> {
  mapPlugins ??= Promise.all([import('gsap/DrawSVGPlugin'), import('gsap/Flip')]).then(
    ([{ DrawSVGPlugin }, { Flip }]) => {
      gsap.registerPlugin(DrawSVGPlugin, Flip);
      flip = Flip;
    },
  );
  return mapPlugins;
}

/** ScrollTrigger and SplitText: the Making-of story only. */
export function loadStoryPlugins(): Promise<void> {
  storyPlugins ??= Promise.all([import('gsap/ScrollTrigger'), import('gsap/SplitText')]).then(
    ([{ ScrollTrigger }, { SplitText }]) => {
      gsap.registerPlugin(ScrollTrigger, SplitText);
    },
  );
  return storyPlugins;
}

/** Flip, once the map plugins have loaded (null before). */
export const getFlip = () => flip;

export { gsap, useGSAP };
