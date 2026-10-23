/**
 * The only place GSAP plugins are registered. Core + useGSAP ship with every route; the map and
 * story plugins load on demand: Field fetches DrawSVG + Flip only when a task is confirmed (M9),
 * and never the story plugins (plan/06 §2, NFR2).
 */
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

gsap.registerPlugin(useGSAP);

let mapPlugins: Promise<void> | null = null;
let flip: (typeof import('gsap/Flip'))['Flip'] | null = null;
let storyPlugins: Promise<StoryPlugins> | null = null;
let scrollPlugin: Promise<void> | null = null;

/**
 * DrawSVG and Flip: Today's map reveal and Field's task done. (Water flow animates the stroke
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

export interface StoryPlugins {
  ScrollTrigger: (typeof import('gsap/ScrollTrigger'))['ScrollTrigger'];
  SplitText: (typeof import('gsap/SplitText'))['SplitText'];
}

/** ScrollTrigger and SplitText: the Making-of story only. Resolves with the registered classes. */
export function loadStoryPlugins(): Promise<StoryPlugins> {
  storyPlugins ??= Promise.all([import('gsap/ScrollTrigger'), import('gsap/SplitText')]).then(
    ([{ ScrollTrigger }, { SplitText }]) => {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      return { ScrollTrigger, SplitText };
    },
  );
  return storyPlugins;
}

/** ScrollTo: same-page links glide to their section instead of jumping. */
export function loadScrollPlugin(): Promise<void> {
  scrollPlugin ??= import('gsap/ScrollToPlugin').then(({ ScrollToPlugin }) => {
    gsap.registerPlugin(ScrollToPlugin);
  });
  return scrollPlugin;
}

/** Flip, once the map plugins have loaded (null before). */
export const getFlip = () => flip;

export { gsap, useGSAP };
