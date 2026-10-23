import type { RefObject } from 'react';
import { duration, ease, gsap, loadMapPlugins, stagger, useGSAP, useMotion } from '@/motion';

const REVEALED = 'saqi.mapRevealed';

const revealedThisSession = () => {
  try {
    return sessionStorage.getItem(REVEALED) === '1';
  } catch {
    return true; // storage blocked: don't risk replaying on every visit
  }
};
const markRevealed = () => {
  try {
    sessionStorage.setItem(REVEALED, '1');
  } catch {
    // Storage blocked: nothing to remember.
  }
};

/**
 * M1 · the map draws itself, once per session: block outlines draw, water fills in, textures
 * and pipes follow, tags rise, utilities appear (about 1.6 s, the `tide`). Any click or key
 * finishes it at once. Reduced motion: everything is simply there.
 *
 * The session flag is set when the reveal completes or is skipped, not when it starts, so
 * StrictMode's discarded first effect run can't swallow it.
 */
export function useMapReveal(scope: RefObject<HTMLElement | null>, enabled: boolean) {
  const { reduced } = useMotion();
  useGSAP(
    () => {
      const root = scope.current;
      if (!enabled || reduced || !root || revealedThisSession()) return;
      const q = gsap.utils.selector(root);
      const outlines = q('.layer-blocks rect:not([data-block-fill])');
      const hidden = [
        ...q('[data-block-fill]'),
        ...q('.layer-texture'),
        ...q('.layer-stale'),
        ...q('.layer-pipes path'),
        ...q('[data-tag]'),
        ...q('.layer-utilities > *'),
      ];
      gsap.set(hidden, { opacity: 0 });

      let cancelled = false;
      let tl: gsap.core.Timeline | null = null;
      const finish = () => tl?.progress(1);
      void loadMapPlugins()
        .then(() => {
          if (cancelled) return;
          // Not context.add(): under StrictMode useGSAP hands the second run the context the first
          // run's cleanup already reverted, which kills anything added to it. We own this one.
          {
            tl = gsap
              .timeline({ defaults: { ease: ease.reveal }, onComplete: markRevealed })
              .fromTo(
                outlines,
                { drawSVG: '0%' },
                { drawSVG: '100%', duration: duration.drift, stagger: stagger.list },
              )
              .to(
                q('[data-block-fill]'),
                { opacity: 1, duration: duration.drift, ease: ease.standard, stagger: 0.05 },
                '<0.2',
              )
              .to(
                [...q('.layer-texture'), ...q('.layer-stale')],
                { opacity: 1, duration: duration.settle },
                '<0.35',
              )
              .fromTo(
                q('.layer-pipes path'),
                { opacity: 1, drawSVG: '0%' },
                { drawSVG: '100%', duration: duration.drift, stagger: stagger.list },
                '<',
              )
              .fromTo(
                q('[data-tag]'),
                { opacity: 0, y: 6 },
                { opacity: 1, y: 0, duration: duration.settle, stagger: stagger.list },
                '<0.2',
              )
              .to(q('.layer-utilities > *'), { opacity: 1, duration: duration.settle }, '<');
          }
          window.addEventListener('pointerdown', finish, { once: true });
          window.addEventListener('keydown', finish, { once: true });
        })
        .catch(() => gsap.set(hidden, { opacity: 1 }));

      return () => {
        cancelled = true;
        tl?.kill();
        window.removeEventListener('pointerdown', finish);
        window.removeEventListener('keydown', finish);
      };
    },
    { scope, dependencies: [enabled, reduced] },
  );
}

/**
 * M2 · water flows along tonight's pipes: the dashes travel pump → block (stroke offset,
 * about 125 units/s, linear). Paused while the tab is hidden or the map is off-screen.
 * Reduced motion: the dashed route stays still.
 */
export function usePipeFlow(scope: RefObject<HTMLElement | null>, routeKey: string) {
  const { reduced } = useMotion();
  useGSAP(
    () => {
      const root = scope.current;
      if (reduced || !root) return;
      const flows = gsap.utils.toArray<SVGPathElement>('[data-flow]', root);
      if (flows.length === 0) return;
      // 160 = 10 dash periods (4 + 12), so the loop is seamless.
      const tween = gsap.to(flows, {
        strokeDashoffset: -160,
        duration: 1.28,
        ease: ease.water,
        repeat: -1,
      });

      let onScreen = true;
      const sync = () => (onScreen && !document.hidden ? tween.resume() : tween.pause());
      document.addEventListener('visibilitychange', sync);
      const observer =
        typeof IntersectionObserver === 'undefined'
          ? null
          : new IntersectionObserver(([entry]) => {
              onScreen = Boolean(entry?.isIntersecting);
              sync();
            });
      observer?.observe(root);
      return () => {
        document.removeEventListener('visibilitychange', sync);
        observer?.disconnect();
      };
    },
    // revertOnUpdate: a new route or reduced motion must stop the old loop (and run its
    // cleanup); without it the loops and listeners stack.
    { scope, dependencies: [routeKey, reduced], revertOnUpdate: true },
  );
}

/** M8 · hover / focus: the outline thickens and the tag lifts 2 px (`step`). Reduced: outline only. */
export function useHoverLift(scope: RefObject<HTMLElement | null>, activeId: string | null) {
  const { reduced } = useMotion();
  useGSAP(
    () => {
      if (!activeId || reduced) return;
      const group = scope.current?.querySelector(`[data-block="${activeId}"]`);
      const outline = group?.querySelector('.layer-hover');
      const tag = group?.querySelector('[data-tag]');
      if (outline)
        gsap.fromTo(
          outline,
          { strokeWidth: 1 },
          { strokeWidth: 3, duration: duration.step, ease: ease.standard },
        );
      if (tag) gsap.to(tag, { y: -2, duration: duration.step, ease: ease.standard });
    },
    // revertOnUpdate: the previous block settles back when another becomes active.
    { scope, dependencies: [activeId, reduced], revertOnUpdate: true },
  );
}
