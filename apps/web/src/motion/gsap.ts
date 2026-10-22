/**
 * The only place GSAP plugins are registered. Core + useGSAP ship with every route; the map and
 * story plugins load on demand, so Field never downloads them (plan/06 §2, NFR2).
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

let mapPlugins: Promise<void> | null = null;
let storyPlugins: Promise<void> | null = null;

/** DrawSVG, MotionPath and Flip: Today's map reveal, water flow and the block Flip. */
export function loadMapPlugins(): Promise<void> {
  mapPlugins ??= Promise.all([
    import('gsap/DrawSVGPlugin'),
    import('gsap/MotionPathPlugin'),
    import('gsap/Flip'),
  ]).then(([{ DrawSVGPlugin }, { MotionPathPlugin }, { Flip }]) => {
    gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin, Flip);
  });
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

export { gsap, useGSAP };
