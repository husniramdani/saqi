/**
 * Small, reusable motion moments (plan/06 §3). Each takes its targets and `reduced`; reduced
 * motion sets the end state at once (no movement, nothing hidden). Transforms, opacity and SVG
 * stroke only. Every horizontal origin follows the element's reading direction.
 */
import { gsap } from './gsap';
import { duration, ease, stagger } from './tokens';

type Targets = gsap.TweenTarget;
const done = () => gsap.timeline().progress(1);

/** The reading direction at an element (the page's `dir`, or a nearer one). */
export function dirAt(el: Element | null | undefined): 1 | -1 {
  const dir = el?.closest('[dir]')?.getAttribute('dir') ?? document.documentElement.dir;
  return dir === 'rtl' ? -1 : 1;
}
const first = (targets: Targets): Element | null => gsap.utils.toArray<Element>(targets)[0] ?? null;
const originAt = (el: Element | null) => (dirAt(el) === -1 ? 'right center' : 'left center');

/** M7 · reasons and list rows: rise 8 px and fade in, one after another. */
export function fadeUpStagger(targets: Targets, { reduced = false } = {}) {
  if (reduced) {
    gsap.set(targets, { opacity: 1, y: 0 });
    return done();
  }
  return gsap.timeline().fromTo(
    targets,
    { opacity: 0, y: 8 },
    {
      opacity: 1,
      y: 0,
      duration: duration.settle,
      ease: ease.standard,
      stagger: stagger.reasons,
      clearProps: 'transform',
    },
  );
}

/** M6 · schedule bars: grow from their start edge (left in LTR, right in RTL). */
export function growFromStart(targets: Targets, { reduced = false } = {}) {
  const origin = originAt(first(targets));
  if (reduced) {
    gsap.set(targets, { scaleX: 1, transformOrigin: origin });
    return done();
  }
  return gsap
    .timeline()
    .fromTo(
      targets,
      { scaleX: 0, transformOrigin: origin },
      { scaleX: 1, duration: duration.drift, ease: ease.reveal, stagger: stagger.list },
    );
}

/**
 * M3 · counters: tween from the previous value (never from 0) to the new one, snapped to the
 * display precision; `format` writes the text so locale and digits stay right.
 */
export function countTo(
  el: Element,
  from: number,
  to: number,
  {
    precision = 1,
    format = (v: number) => v.toFixed(precision),
    reduced = false,
  }: { precision?: number; format?: (v: number) => string; reduced?: boolean } = {},
) {
  if (reduced || from === to) {
    el.textContent = format(to);
    return done();
  }
  const state = { v: from };
  const step = 1 / 10 ** precision;
  return gsap.timeline().to(state, {
    v: to,
    duration: duration.drift,
    ease: ease.standard,
    snap: { v: step },
    onUpdate: () => {
      el.textContent = format(state.v);
    },
  });
}

/** M4 · budget meter: the fill scales to its share from the inline start. */
export function meterTo(el: Element, share: number, { reduced = false } = {}) {
  const scaleX = Math.min(1, Math.max(0, share));
  const transformOrigin = originAt(el);
  if (reduced) {
    gsap.set(el, { scaleX, transformOrigin });
    return done();
  }
  return gsap
    .timeline()
    .to(el, { scaleX, transformOrigin, duration: duration.drift, ease: ease.reveal });
}

/** M10 · bottom sheet in: slides up while the backdrop dims. */
export function sheetIn(sheet: Element, backdrop: Element | null, { reduced = false } = {}) {
  if (reduced) {
    gsap.set(sheet, { yPercent: 0 });
    if (backdrop) gsap.set(backdrop, { opacity: 0.4 });
    return done();
  }
  const tl = gsap
    .timeline()
    .fromTo(
      sheet,
      { yPercent: 100 },
      { yPercent: 0, duration: duration.settle, ease: ease.reveal },
    );
  if (backdrop)
    tl.fromTo(
      backdrop,
      { opacity: 0 },
      { opacity: 0.4, duration: duration.settle, ease: ease.standard },
      0,
    );
  return tl;
}

/** M10 · bottom sheet out, quicker than in. */
export function sheetOut(sheet: Element, backdrop: Element | null, { reduced = false } = {}) {
  if (reduced) {
    gsap.set(sheet, { yPercent: 100 });
    if (backdrop) gsap.set(backdrop, { opacity: 0 });
    return done();
  }
  const tl = gsap
    .timeline()
    .to(sheet, { yPercent: 100, duration: duration.step, ease: ease.standard });
  if (backdrop) tl.to(backdrop, { opacity: 0, duration: duration.step, ease: ease.standard }, 0);
  return tl;
}

/** M12 · language switch: fade out, swap (the `dir` flip reflows unseen), fade back in. */
export function crossfadeSwap(
  el: Element,
  swap: () => void | Promise<void>,
  { reduced = false } = {},
) {
  if (reduced) {
    void swap();
    return done();
  }
  return gsap
    .timeline()
    .to(el, { opacity: 0, duration: duration.step, ease: ease.standard })
    .call(() => void swap())
    .to(el, { opacity: 1, duration: duration.step, ease: ease.standard });
}

/** Loading spinner: one turn per drift; reduced motion leaves the ring still. */
export function spin(el: Element, { reduced = false } = {}) {
  if (reduced) return done();
  return gsap.timeline({ repeat: -1 }).to(el, {
    rotation: 360,
    duration: duration.drift,
    ease: ease.water,
    transformOrigin: '50% 50%',
  });
}
