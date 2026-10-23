import { useRef, type RefObject } from 'react';
import {
  duration,
  ease,
  gsap,
  loadStoryPlugins,
  stagger,
  useGSAP,
  useMotion,
  type StoryPlugins,
} from '@/motion';
import type { LandingDecisionKey } from './workedExample';

const NO_MOTION = '(prefers-reduced-motion: no-preference)';
type ScrollTriggerClass = StoryPlugins['ScrollTrigger'];

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

/** Count a figure up from zero, then hand back the exact rendered text. */
function countUp(el: HTMLElement, delay: number, trigger?: Element) {
  const to = Number(el.dataset['to']);
  const digits = Number(el.dataset['dec'] ?? 0);
  const final = el.textContent;
  const value = { v: 0 };
  const format = (v: number) =>
    v.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  gsap.to(value, {
    v: to,
    duration: duration.tide,
    ease: ease.reveal,
    delay,
    ...(trigger ? { scrollTrigger: { trigger, start: 'top 90%', once: true } } : {}),
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
}

/** Water keeps moving along tonight's pipes, only while the map is on screen. */
function flowLoop(svg: Element, ScrollTrigger: ScrollTriggerClass) {
  const tween = gsap.to(all('.flow', svg), {
    strokeDashoffset: -32,
    duration: 1.1,
    ease: ease.water,
    repeat: -1,
    paused: true,
  });
  ScrollTrigger.create({
    trigger: svg,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
  });
}

/** Farm plan: blocks settle, pipes draw, tags arrive, then water flows. */
function farmMotion(root: HTMLElement, withScroll: boolean) {
  const svg = root.querySelector('.farm-map');
  if (!svg) return;
  const timeline = gsap.timeline(
    withScroll ? { scrollTrigger: { trigger: svg, start: 'top 80%', once: true } } : {},
  );
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
          const heroMap = root.querySelector('.hero-map-in');
          if (heroMap) flowLoop(heroMap, ScrollTrigger);
          for (const el of q('.hero-card .cnt')) countUp(el, 1.2);

          const reveal = q('.rv');
          gsap.set(reveal, { opacity: 0, y: 28 });
          ScrollTrigger.batch(reveal, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: duration.drift,
                ease: ease.reveal,
                stagger: 0.08,
                overwrite: true,
                clearProps: 'transform,opacity',
              }),
          });
          for (const head of q('.sec-head')) {
            gsap.from(head.children, {
              opacity: 0,
              y: 24,
              duration: duration.drift,
              ease: ease.reveal,
              stagger: 0.1,
              scrollTrigger: { trigger: head, start: 'top 88%', once: true },
            });
          }
          for (const bar of q('.bar-x').filter((el) => !el.closest('.hero-card'))) {
            gsap.from(bar, {
              scaleX: 0,
              transformOrigin: origin,
              duration: duration.drift,
              ease: ease.reveal,
              delay: 0.2,
              scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
            });
          }
          for (const bar of q('.bar-y')) {
            gsap.from(bar, {
              scaleY: 0,
              transformOrigin: '50% 100%',
              duration: duration.drift,
              ease: ease.reveal,
              delay: 0.3,
              scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
            });
          }
          for (const ring of q('.ring-draw')) {
            const length = Number(ring.dataset['len']);
            gsap.fromTo(
              ring,
              { strokeDashoffset: length },
              {
                strokeDashoffset: 0,
                duration: duration.tide,
                ease: ease.emphasized,
                scrollTrigger: { trigger: ring, start: 'top 92%', once: true },
              },
            );
          }
          for (const svg of q('svg')) {
            if (svg.closest('.hero-map-in') || svg.classList.contains('farm-map')) continue;
            const trigger = { trigger: svg, start: 'top 92%', once: true };
            const draws = all<SVGGeometryElement>('.draw', svg);
            if (draws.length)
              drawIn(draws, { delay: 0.2, stagger: stagger.list, scrollTrigger: trigger });
            const pops = all('.pop', svg);
            if (pops.length) {
              gsap.from(pops, {
                opacity: 0,
                scale: 0,
                transformOrigin: '50% 50%',
                duration: duration.settle,
                ease: 'back.out(2)',
                stagger: 0.05,
                delay: 0.7,
                scrollTrigger: trigger,
              });
            }
          }
          for (const el of q('.cnt').filter((cnt) => !cnt.closest('.hero-card')))
            countUp(el, 0.2, el);

          farmMotion(root, true);
          const farm = root.querySelector('.farm-map');
          if (farm) flowLoop(farm, ScrollTrigger);

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
          gsap.from(q('.cta-hl'), {
            opacity: 0,
            y: 40,
            duration: duration.tide,
            ease: ease.reveal,
            scrollTrigger: { trigger: root.querySelector('.cta'), start: 'top 80%', once: true },
          });

          void document.fonts.ready.then(() => ScrollTrigger.refresh());
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
        if (farmView === 'map') {
          farmMotion(root, false);
          void loadStoryPlugins().then(({ ScrollTrigger }) => {
            const farm = root.querySelector('.farm-map');
            if (farm) flowLoop(farm, ScrollTrigger);
          });
        }
      });
      return () => mm.revert();
    },
    { scope, dependencies: [farmView] },
  );
}
