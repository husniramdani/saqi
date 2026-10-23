import type { Locale } from '@saqi/shared';
import { useRef, type RefObject } from 'react';
import { formatNumber } from '@/i18n/format';
import { dirAt, duration, ease, gsap, stagger, useGSAP, withMotion } from '@/motion';

/** The header settles in once per page load, not on every return to Today. */
let headerShown = false;

/** Counters (`[data-count]`) roll up from zero to the figure they show. */
function countUp(root: Element, locale: Locale, delay: number) {
  for (const el of root.querySelectorAll<HTMLElement>('[data-count]')) {
    const to = Number(el.dataset['count']);
    const digits = Number(el.dataset['digits'] ?? 0);
    const state = { v: 0 };
    gsap.to(state, {
      v: to,
      duration: duration.tide,
      ease: ease.reveal,
      delay,
      onStart: () => {
        el.textContent = formatNumber(0, locale, digits);
      },
      onUpdate: () => {
        el.textContent = formatNumber(state.v, locale, digits);
      },
      onComplete: () => {
        el.textContent = formatNumber(to, locale, digits);
      },
    });
  }
}

/**
 * design/dashboard.html's intro: the bar, then the rails slide in from their own sides, the map
 * settles, rows rise, the map's overlays and the schedule card arrive, tonight's flow fades on
 * and the totals count up. The map's own draw-in, the schedule bars and the rail chart keep
 * their owners. Reduced motion: the final state, at once.
 */
export function useCockpitIntro(
  root: RefObject<HTMLElement | null>,
  ready: boolean,
  locale: Locale,
  forceReduced: boolean,
) {
  useGSAP(
    () => {
      const el = root.current;
      if (!el || !ready) return;
      return withMotion(
        () => {
          const q = gsap.utils.selector(el);
          const dir = dirAt(el);
          const tl = gsap.timeline({
            defaults: {
              ease: ease.reveal,
              duration: duration.drift,
              clearProps: 'transform,opacity',
            },
          });
          const top = document.querySelector('[data-shell-top]');
          if (top && !headerShown)
            tl.from(
              top.children,
              { opacity: 0, y: -10, stagger: 0.06, duration: duration.settle },
              0,
            );
          headerShown = true;
          tl.from(q('.lp'), { opacity: 0, x: -24 * dir }, 0.1)
            .from(q('.rp'), { opacity: 0, x: 24 * dir }, 0.15)
            .from(q('.map'), { opacity: 0, scale: 0.985 }, 0.1)
            .from(
              q('.blk'),
              { opacity: 0, y: 10, stagger: stagger.list, duration: duration.settle },
              0.35,
            )
            .from(
              q('.drow'),
              { opacity: 0, x: 12 * dir, stagger: stagger.list, duration: duration.settle },
              0.4,
            )
            .from(
              q('.map-top > *, .zoom, .toast'),
              { opacity: 0, y: -8, stagger: 0.06, duration: duration.settle },
              1.0,
            )
            .from(q('.sched'), { opacity: 0, y: 16 }, 1.1)
            .from(q('[data-flow]'), { opacity: 0, duration: duration.settle }, 2.0);
          countUp(el, locale, 0.8);
        },
        () => undefined,
        forceReduced,
      );
    },
    // Once per visit: the plan arriving starts it; locale and tabs never replay it.
    { scope: root, dependencies: [ready, forceReduced] },
  );
}

/**
 * The right panel's view changes: its rows slide in from the reading direction; the Water
 * meter grows from its start; the Plan totals count up again. Not on first render.
 */
export function useTabSwitch(
  body: RefObject<HTMLElement | null>,
  tab: string,
  locale: Locale,
  reduced: boolean,
) {
  const shown = useRef(tab);
  useGSAP(
    () => {
      const el = body.current;
      if (!el || shown.current === tab) return;
      shown.current = tab;
      if (reduced) return;
      const dir = dirAt(el);
      gsap.from(el.querySelectorAll('.drow, .lrow, .sect, .rp-sum'), {
        opacity: 0,
        x: 12 * dir,
        stagger: 0.035,
        duration: duration.settle,
        ease: ease.reveal,
        clearProps: 'transform,opacity',
      });
      if (tab === 'water')
        gsap.from(el.querySelectorAll('[data-meter-fill]'), {
          scaleX: 0,
          transformOrigin: dir > 0 ? 'left center' : 'right center',
          duration: duration.drift,
          ease: ease.reveal,
          delay: 0.15,
        });
      if (tab === 'plan') countUp(el, locale, 0.1);
    },
    { scope: body, dependencies: [tab] },
  );
}

/** A newly selected block's outline, tag and running route fade up (`step`); reduced: at once. */
export function useSelectionFade(
  root: RefObject<HTMLElement | null>,
  selected: string | null | undefined,
  reduced: boolean,
) {
  const shown = useRef(selected);
  useGSAP(
    () => {
      const el = root.current;
      if (!el || shown.current === selected) return;
      shown.current = selected;
      if (reduced || !selected) return;
      gsap.fromTo(
        el.querySelectorAll(`.layer-selected, .layer-route, [data-block="${selected}"] [data-tag]`),
        { opacity: 0 },
        { opacity: 1, duration: duration.step, ease: ease.standard },
      );
    },
    { scope: root, dependencies: [selected, reduced] },
  );
}
