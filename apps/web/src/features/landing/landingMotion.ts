import type { RefObject } from 'react';
import {
  duration,
  ease,
  gsap,
  loadMapPlugins,
  loadStoryPlugins,
  stagger,
  useGSAP,
  useMotion,
} from '@/motion';
import type { LandingDecisionKey } from './workedExample';

const sections = [
  '#about',
  '.landing-why',
  '#product',
  '#tonight',
  '#decide',
  '#instruments',
  '#field',
  '#making-of',
  '.landing-cta',
] as const;

const all = <T extends Element = HTMLElement>(selector: string, root: Element) =>
  gsap.utils.toArray<T>(selector, root);

function observeFlow(root: HTMLElement) {
  const flows = all<SVGPathElement>('.landing-map__flow path', root);
  if (flows.length === 0) return () => undefined;
  const tween = gsap.to(flows, {
    strokeDashoffset: -160,
    duration: duration.tide,
    ease: ease.water,
    repeat: -1,
  });
  const visible = new Set<Element>();
  const sync = () => (visible.size > 0 && !document.hidden ? tween.resume() : tween.pause());
  const observer =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          }
          sync();
        });
  const maps = all('.landing-map', root);
  for (const map of maps) observer?.observe(map);
  document.addEventListener('visibilitychange', sync);
  if (observer) sync();
  return () => {
    document.removeEventListener('visibilitychange', sync);
    observer?.disconnect();
    tween.kill();
  };
}

/** Progressive motion for the portfolio route. The complete content is the no-motion baseline. */
export function useLandingMotion(
  scope: RefObject<HTMLDivElement | null>,
  scenarioKey: LandingDecisionKey,
  farmView: 'map' | 'list',
) {
  const { reduced, dirSign } = useMotion();

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      if (reduced) {
        gsap.set(
          all(
            '.landing-hero__main > *, .landing-hero__map, .landing-section, .landing-why, .landing-cta',
            root,
          ),
          { opacity: 1, x: 0, y: 0, clearProps: 'transform' },
        );
        return;
      }

      let cancelled = false;
      let dispose: () => void = () => undefined;
      void Promise.all([loadMapPlugins(), loadStoryPlugins()])
        .then(([, { ScrollTrigger }]) => {
          if (cancelled) return;
          const mm = gsap.matchMedia(root);
          mm.add('(prefers-reduced-motion: no-preference)', () => {
            const context = gsap.context(() => {
              const hero = gsap.timeline({ defaults: { ease: ease.reveal } });
              hero
                .from('.landing-header', { opacity: 0, y: -8, duration: duration.settle })
                .from('.landing-hero h1', { opacity: 0, y: 16, duration: duration.drift }, '<')
                .from(
                  '.landing-hero__thesis, .landing-hero__body, .landing-hero__actions',
                  {
                    opacity: 0,
                    y: 8,
                    duration: duration.settle,
                    stagger: stagger.list,
                  },
                  '<0.2',
                )
                .from(
                  '.landing-hero__summary',
                  { opacity: 0, x: 18 * dirSign, duration: duration.drift },
                  '<',
                )
                .from('.landing-hero__map', { opacity: 0, y: -12, duration: duration.drift }, 0)
                .fromTo(
                  '.landing-hero .landing-map__pipes path',
                  { drawSVG: '0%' },
                  {
                    drawSVG: '100%',
                    duration: duration.drift,
                    stagger: stagger.list,
                  },
                  0,
                );

              for (const selector of sections) {
                const element = root.querySelector(selector);
                if (!element) continue;
                gsap.from(element, {
                  opacity: 0,
                  y: 18,
                  duration: duration.settle,
                  ease: ease.standard,
                  scrollTrigger: { trigger: element, start: 'top 86%', once: true },
                });
              }

              for (const groupSelector of [
                '.landing-products',
                '.landing-instruments',
                '.landing-making',
                '.landing-facts',
              ]) {
                const group = root.querySelector(groupSelector);
                if (!group) continue;
                gsap.from(group.children, {
                  opacity: 0,
                  y: 12,
                  duration: duration.settle,
                  ease: ease.standard,
                  stagger: stagger.list,
                  scrollTrigger: { trigger: group, start: 'top 82%', once: true },
                });
              }

              for (const drawing of all(
                '.landing-ring-value, .landing-et-stem, .landing-sensor-line, .landing-root',
                root,
              )) {
                gsap.fromTo(
                  drawing,
                  { drawSVG: '0%' },
                  {
                    drawSVG: '100%',
                    duration: duration.drift,
                    ease: ease.reveal,
                    scrollTrigger: {
                      trigger: drawing.closest('svg'),
                      start: 'top 86%',
                      once: true,
                    },
                  },
                );
              }

              for (const bar of all('[data-schedule-bar]', root)) {
                gsap.fromTo(
                  bar,
                  { scaleX: 0, transformOrigin: dirSign === -1 ? 'right center' : 'left center' },
                  {
                    scaleX: 1,
                    duration: duration.drift,
                    ease: ease.reveal,
                    scrollTrigger: { trigger: bar, start: 'top 90%', once: true },
                  },
                );
              }

              const parallax = gsap.matchMedia(root);
              parallax.add('(min-width: 768px)', () => {
                for (const target of all(
                  '.landing-hero__map, .landing-farm-map, .landing-phones',
                  root,
                )) {
                  gsap.fromTo(
                    target,
                    { yPercent: -3 },
                    {
                      yPercent: 3,
                      ease: ease.water,
                      scrollTrigger: {
                        trigger: target,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                      },
                    },
                  );
                }
                return () => undefined;
              });

              ScrollTrigger.refresh();
              return () => parallax.revert();
            }, root);
            const stopFlow = observeFlow(root);
            return () => {
              stopFlow();
              context.revert();
            };
          });
          dispose = () => mm.revert();
        })
        .catch(() => {
          gsap.set(all('.landing-map__pipes path', root), { clearProps: 'all' });
        });

      return () => {
        cancelled = true;
        dispose();
      };
    },
    { scope, dependencies: [reduced, dirSign] },
  );

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const targets = all('#decide .landing-reasons li, #decide .landing-recommendation', root);
      if (reduced) {
        gsap.set(targets, { opacity: 1, x: 0, y: 0, clearProps: 'transform' });
        return;
      }
      const mm = gsap.matchMedia(root);
      mm.add('(prefers-reduced-motion: no-preference)', () =>
        gsap.fromTo(
          targets,
          { opacity: 0, x: 8 * dirSign, y: 4 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: duration.settle,
            ease: ease.standard,
            stagger: stagger.reasons,
            clearProps: 'transform',
          },
        ),
      );
      return () => mm.revert();
    },
    { scope, dependencies: [scenarioKey, reduced, dirSign], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;
      const panel = root.querySelector('.landing-farm-map, .landing-farm-table-wrap');
      if (!panel || reduced) return;
      const mm = gsap.matchMedia(root);
      mm.add('(prefers-reduced-motion: no-preference)', () =>
        gsap.fromTo(
          panel,
          { opacity: 0, x: 12 * dirSign },
          {
            opacity: 1,
            x: 0,
            duration: duration.settle,
            ease: ease.standard,
            clearProps: 'transform',
          },
        ),
      );
      return () => mm.revert();
    },
    { scope, dependencies: [farmView, reduced, dirSign], revertOnUpdate: true },
  );
}
