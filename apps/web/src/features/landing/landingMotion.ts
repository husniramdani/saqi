import { useRef, type RefObject } from 'react';
import { duration, ease, gsap, loadStoryPlugins, stagger, useGSAP, useMotion } from '@/motion';
import type { LandingDecisionKey } from './workedExample';

const NO_MOTION = '(prefers-reduced-motion: no-preference)';

const all = <T extends Element = HTMLElement>(selector: string, root: ParentNode) =>
  gsap.utils.toArray<T>(root.querySelectorAll(selector));

/** Draw a stroke in from its start (stroke-dashoffset), as the reference does without DrawSVG. */
function drawIn(
  paths: SVGGeometryElement[],
  vars: gsap.TweenVars,
  timeline?: gsap.core.Timeline,
  at?: number,
) {
  for (const path of paths) {
    const length = path.getTotalLength();
    if (!length) continue;
    path.style.strokeDasharray = String(length);
    const tween = { strokeDashoffset: 0, duration: duration.tide, ease: ease.emphasized, ...vars };
    if (timeline) timeline.fromTo(path, { strokeDashoffset: length }, tween, at);
    else gsap.fromTo(path, { strokeDashoffset: length }, tween);
  }
}

/**
 * Plays reveals when their element is actually on screen. IntersectionObserver reads live
 * geometry, so layout that shifts after load (fonts, live weather, sizing) can't leave a reveal
 * stuck hidden, as stale ScrollTrigger start positions did on phones. Content is only hidden
 * once an observer exists to show it again.
 */
function createRevealer() {
  const plays = new Map<Element, gsap.core.Animation[]>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const animation of plays.get(entry.target) ?? []) void animation.play();
        plays.delete(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  return {
    /** Play `animation` (created paused) the first time `trigger` comes on screen. */
    onVisible(trigger: Element | null, animation: gsap.core.Animation) {
      if (!trigger) {
        animation.progress(1);
        return;
      }
      const queued = plays.get(trigger);
      if (queued) queued.push(animation);
      else {
        plays.set(trigger, [animation]);
        observer.observe(trigger);
      }
    },
    disconnect: () => observer.disconnect(),
  };
}
type Revealer = ReturnType<typeof createRevealer>;

/** Count a figure up from zero, then hand back the exact rendered text. */
function countUp(el: HTMLElement, delay: number, revealer?: Revealer) {
  const to = Number(el.dataset['to']);
  const digits = Number(el.dataset['dec'] ?? 0);
  const final = el.textContent;
  const value = { v: 0 };
  const format = (v: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const tween = gsap.to(value, {
    v: to,
    duration: duration.tide,
    ease: ease.reveal,
    delay,
    paused: Boolean(revealer),
    onStart: () => {
      el.textContent = format(0);
    },
    onUpdate: () => {
      el.textContent = format(value.v);
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
  revealer?.onVisible(el, tween);
}

/** Water keeps moving along tonight's pipes, only while the map is on screen. */
function flowLoop(svg: Element) {
  const tween = gsap.to(all('.flow', svg), {
    strokeDashoffset: -32,
    duration: 1.1,
    ease: ease.water,
    repeat: -1,
    paused: true,
  });
  const observer = new IntersectionObserver(([entry]) =>
    entry?.isIntersecting ? tween.play() : tween.pause(),
  );
  observer.observe(svg);
  return () => observer.disconnect();
}

/** Farm plan: blocks settle, pipes draw, tags arrive, then water flows. */
function farmMotion(root: HTMLElement, revealer?: Revealer) {
  const svg = root.querySelector('.farm-map');
  if (!svg) return;
  const timeline = gsap.timeline({ paused: Boolean(revealer) });
  timeline.from(
    all('.fblk', svg),
    { opacity: 0, duration: duration.drift, ease: ease.standard, stagger: 0.07 },
    0,
  );
  drawIn(all<SVGGeometryElement>('.fdraw', svg), { ease: ease.emphasized }, timeline, 0.3);
  timeline.from(
    all('.plate-g', svg),
    { opacity: 0, y: 8, duration: duration.settle, ease: ease.reveal, stagger: 0.05 },
    1.1,
  );
  timeline.from(all('.flow', svg), { opacity: 0, duration: duration.settle }, 1.6);
  revealer?.onVisible(svg, timeline);
}

/**
 * The reference's motion, on the landing tokens: an orchestrated hero reveal, section and number
 * reveals on scroll, the farm plan drawing itself, and gentle scrubbed parallax. Under reduced
 * motion nothing runs: the markup is already the final state.
 */
export function useLandingMotion(
  scope: RefObject<HTMLDivElement | null>,
  scenarioKey: LandingDecisionKey,
  farmView: 'map' | 'list',
) {
  const { reduced, dirSign } = useMotion();
  const origin = dirSign > 0 ? 'left center' : 'right center';

  useGSAP(
    () => {
      const root = scope.current;
      if (!root || reduced) return;
      let mm: gsap.MatchMedia | null = null;
      let cancelled = false;
      void loadStoryPlugins().then(({ ScrollTrigger }) => {
        if (cancelled) return;
        mm = gsap.matchMedia(root);
        mm.add(NO_MOTION, () => {
          const q = (selector: string) => all(selector, root);
          const hero = gsap.timeline({ defaults: { ease: ease.reveal, duration: duration.tide } });
          hero
            .from(q('.hl-line > span'), { yPercent: 112, stagger: 0.09 }, 0.15)
            .from(q('.hero-map-in'), { opacity: 0, y: 90, duration: 2, ease: ease.emphasized }, 0)
            .from(
              q('.hero-map-in .hb'),
              { opacity: 0, stagger: 0.06, duration: duration.drift, ease: ease.standard },
              0.5,
            )
            .from(
              q('.hero-fade'),
              { opacity: 0, y: 14, stagger: 0.07, duration: duration.drift },
              0.7,
            )
            .from(q('.hero-card'), { opacity: 0, y: 36, duration: duration.drift }, 1.1)
            .from(
              q('.hero-card .bar-x'),
              { scaleX: 0, transformOrigin: origin, stagger: 0.12, duration: duration.drift },
              1.4,
            )
            .from(q('.hero-map-in .flow'), { opacity: 0, duration: duration.settle }, 2.2);
          drawIn(all<SVGGeometryElement>('.hero-map-in .draw', root), {}, hero, 0.9);
          all<SVGGeometryElement>('.topo', root).forEach((path, index) =>
            drawIn([path], { duration: 2.4 }, hero, 0.2 + index * 0.06),
          );
          for (const el of q('.hero-card .cnt')) countUp(el, 1.2);

          // Without IntersectionObserver nothing is hidden: the page simply stays as rendered.
          const cleanups: (() => void)[] = [];
          if (typeof IntersectionObserver !== 'undefined') {
            const heroMap = root.querySelector('.hero-map-in');
            if (heroMap) cleanups.push(flowLoop(heroMap));
            const revealer = createRevealer();
            cleanups.push(revealer.disconnect);

            // Cards and tiles rise in together, as many as come on screen at once.
            const reveal = q('.rv');
            gsap.set(reveal, { opacity: 0, y: 28 });
            const batch = new IntersectionObserver(
              (entries) => {
                const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
                if (shown.length === 0) return;
                for (const el of shown) batch.unobserve(el);
                gsap.to(shown, {
                  opacity: 1,
                  y: 0,
                  duration: duration.drift,
                  ease: ease.reveal,
                  stagger: 0.08,
                  overwrite: true,
                  clearProps: 'transform,opacity',
                });
              },
              { rootMargin: '0px 0px -8% 0px' },
            );
            for (const el of reveal) batch.observe(el);
            cleanups.push(() => batch.disconnect());

            for (const head of q('.sec-head')) {
              revealer.onVisible(
                head,
                gsap.from(head.children, {
                  opacity: 0,
                  y: 24,
                  duration: duration.drift,
                  ease: ease.reveal,
                  stagger: 0.1,
                  paused: true,
                }),
              );
            }
            // Bars are watched through their track: a bar scaled to zero has no area to see.
            for (const bar of q('.bar-x').filter((el) => !el.closest('.hero-card'))) {
              revealer.onVisible(
                bar.parentElement,
                gsap.from(bar, {
                  scaleX: 0,
                  transformOrigin: origin,
                  duration: duration.drift,
                  ease: ease.reveal,
                  delay: 0.2,
                  paused: true,
                }),
              );
            }
            for (const bar of q('.bar-y')) {
              revealer.onVisible(
                bar.parentElement,
                gsap.from(bar, {
                  scaleY: 0,
                  transformOrigin: '50% 100%',
                  duration: duration.drift,
                  ease: ease.reveal,
                  delay: 0.3,
                  paused: true,
                }),
              );
            }
            for (const ring of q('.ring-draw')) {
              const length = Number(ring.dataset['len']);
              revealer.onVisible(
                ring,
                gsap.fromTo(
                  ring,
                  { strokeDashoffset: length },
                  {
                    strokeDashoffset: 0,
                    duration: duration.tide,
                    ease: ease.emphasized,
                    paused: true,
                  },
                ),
              );
            }
            for (const svg of q('svg')) {
              if (svg.closest('.hero-map-in') || svg.classList.contains('farm-map')) continue;
              const draws = all<SVGGeometryElement>('.draw', svg);
              const pops = all('.pop', svg);
              if (draws.length === 0 && pops.length === 0) continue;
              const timeline = gsap.timeline({ paused: true });
              draws.forEach((path, index) =>
                drawIn([path], {}, timeline, 0.2 + index * stagger.list),
              );
              if (pops.length) {
                timeline.from(
                  pops,
                  {
                    opacity: 0,
                    scale: 0,
                    transformOrigin: '50% 50%',
                    duration: duration.settle,
                    ease: 'back.out(2)',
                    stagger: 0.05,
                  },
                  0.7,
                );
              }
              revealer.onVisible(svg, timeline);
            }
            for (const el of q('.cnt').filter((cnt) => !cnt.closest('.hero-card')))
              countUp(el, 0.2, revealer);

            farmMotion(root, revealer);
            const farm = root.querySelector('.farm-map');
            if (farm) cleanups.push(flowLoop(farm));

            revealer.onVisible(
              root.querySelector('.cta'),
              gsap.from(q('.cta-hl'), {
                opacity: 0,
                y: 40,
                duration: duration.tide,
                ease: ease.reveal,
                paused: true,
              }),
            );
          }

          gsap.to(q('.hero-stage'), {
            yPercent: 10,
            ease: ease.water,
            scrollTrigger: {
              trigger: root.querySelector('.hero'),
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
          gsap.fromTo(
            q('.farm-faded'),
            { x: 60 * dirSign },
            {
              x: -60 * dirSign,
              ease: ease.water,
              scrollTrigger: {
                trigger: root.querySelector('.farm-panel'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
          gsap.fromTo(
            q('.phone-b'),
            { y: 60 },
            {
              y: -40,
              ease: ease.water,
              scrollTrigger: {
                trigger: root.querySelector('.phones'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
              },
            },
          );
          // The scrubbed parallax keeps ScrollTrigger; its positions follow every layout change
          // after load (fonts, live weather), not just the first one.
          let frame = 0;
          const resize = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => ScrollTrigger.refresh());
          });
          resize.observe(root);
          return () => {
            resize.disconnect();
            cancelAnimationFrame(frame);
            for (const cleanup of cleanups) cleanup();
          };
        });
      });
      return () => {
        cancelled = true;
        mm?.revert();
      };
    },
    { scope, dependencies: [reduced, dirSign] },
  );

  // A new decision: reasons slide in from the inline start, the verdict rises.
  const previousScenario = useRef(scenarioKey);
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || previousScenario.current === scenarioKey) return;
      previousScenario.current = scenarioKey;
      if (reduced) return;
      const mm = gsap.matchMedia(root);
      mm.add(NO_MOTION, () => {
        gsap.fromTo(
          all('.reason-row', root),
          { opacity: 0, x: 18 * dirSign },
          {
            opacity: 1,
            x: 0,
            duration: duration.settle,
            ease: ease.reveal,
            stagger: 0.05,
            clearProps: 'transform,opacity',
            overwrite: true,
          },
        );
        gsap.fromTo(
          all('.dec-anim', root),
          { opacity: 0, yPercent: 30 },
          {
            opacity: 1,
            yPercent: 0,
            duration: duration.settle,
            ease: ease.reveal,
            stagger: 0.06,
            clearProps: 'transform,opacity',
            overwrite: true,
          },
        );
      });
      return () => mm.revert();
    },
    { scope, dependencies: [scenarioKey] },
  );

  // Map ⇄ list: the new view rises into place; the map draws itself again.
  const previousView = useRef(farmView);
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || previousView.current === farmView) return;
      previousView.current = farmView;
      if (reduced) return;
      const mm = gsap.matchMedia(root);
      mm.add(NO_MOTION, () => {
        gsap.fromTo(
          all('.farm-view', root),
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: duration.settle,
            ease: ease.reveal,
            clearProps: 'transform,opacity',
          },
        );
        if (farmView !== 'map') return undefined;
        // The user just asked for the map, so it is on screen: draw it now.
        farmMotion(root);
        const farm = root.querySelector('.farm-map');
        return farm && typeof IntersectionObserver !== 'undefined' ? flowLoop(farm) : undefined;
      });
      return () => mm.revert();
    },
    { scope, dependencies: [farmView] },
  );
}
