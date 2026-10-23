import type { Flip } from 'gsap/Flip';
import { duration, ease, gsap, stagger, type StoryPlugins } from '@/motion';

/**
 * M11 · the Making-of story (plan/06). Desktop with motion: each scene pins for one screen of
 * scroll and scrubs its own timeline (`scrub: 0.6`); headings reveal line by line (SplitText).
 * Phones: each scene fades in once. Reduced motion: nothing runs; the page is already complete.
 * Transforms and opacity only. Returns the revert, which restores every split, pin and counter.
 *
 * One-off reveals play from an IntersectionObserver, not ScrollTrigger positions: on phones
 * those positions go stale when layout shifts after measuring, leaving content hidden.
 */

type FlipPlugin = typeof Flip;
export interface StoryMotionPlugins extends StoryPlugins {
  Flip: FlipPlugin;
}
type Format = (value: number, digits: number) => string;
type Reveal = (trigger: Element, play: () => void) => void;

const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)';
const PHONE = '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)';

export function buildStory(root: HTMLElement, plugins: StoryMotionPlugins, format: Format) {
  const mm = gsap.matchMedia(root);
  mm.add({ desktop: DESKTOP, phone: PHONE }, (context) => {
    const enter = enterObserver();
    const reveal = enter?.reveal ?? null;
    let revert: (() => void) | undefined;
    if (context.conditions?.['desktop']) revert = pinned(root, plugins, format, reveal);
    else if (context.conditions?.['phone'] && reveal) revealOnce(root, reveal);
    return () => {
      enter?.disconnect();
      revert?.();
    };
  });
  return () => mm.revert();
}

/**
 * Plays each registered reveal once its trigger is on screen. Null without IntersectionObserver:
 * then nothing is hidden, because the written page is already complete.
 */
function enterObserver() {
  if (typeof IntersectionObserver === 'undefined') return null;
  const plays = new Map<Element, () => void>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        plays.get(entry.target)?.();
        plays.delete(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  const reveal: Reveal = (trigger, play) => {
    plays.set(trigger, play);
    io.observe(trigger);
  };
  return { reveal, disconnect: () => io.disconnect() };
}

const all = <T extends Element = HTMLElement>(selector: string, scope: Element) =>
  gsap.utils.toArray<T>(selector, scope);

/**
 * Tween vars that move `el` exactly onto `target`, measured when the tween starts and again
 * on every ScrollTrigger refresh (`invalidateOnRefresh`), so a resize can't leave it off target.
 */
function fitOnto(Flip: FlipPlugin, el: Element, target: Element): gsap.TweenVars {
  let vars: Record<string, number> = {};
  const measure = () => {
    vars = Flip.fit(el, target, { getVars: true, scale: true }) as Record<string, number>;
    return vars['x'] ?? 0;
  };
  return {
    x: measure,
    y: () => vars['y'] ?? 0,
    scaleX: () => vars['scaleX'] ?? 1,
    scaleY: () => vars['scaleY'] ?? 1,
  };
}

function pinned(
  root: HTMLElement,
  { ScrollTrigger, SplitText, Flip }: StoryMotionPlugins,
  format: Format,
  reveal: Reveal | null,
) {
  root.dataset['story'] = 'pinned';
  let built = false;

  // Headings reveal line by line once on screen (only with an observer to show them again).
  // A heading already revealed stays revealed when SplitText re-splits it.
  const revealed = new WeakSet<Element>();
  for (const heading of reveal ? all('[data-split]', root) : []) {
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit(self) {
        // A re-split (resize, font swap) changes line boxes: let the pins re-measure.
        if (built) requestAnimationFrame(() => ScrollTrigger.refresh());
        if (revealed.has(heading)) return undefined;
        const tween = gsap.from(self.lines, {
          yPercent: 100,
          duration: duration.settle,
          ease: ease.reveal,
          stagger: stagger.list,
          paused: true,
        });
        reveal?.(heading, () => {
          revealed.add(heading);
          tween.play();
        });
        return tween;
      },
    });
  }

  const scene = (n: number) => root.querySelector<HTMLElement>(`[data-scene="${n}"]`);
  const timelines: gsap.core.Timeline[] = [];
  const timeline = (trigger: HTMLElement) => {
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    timelines.push(tl);
    return tl;
  };

  // Counters start at zero while pinned; the revert writes the real figure back.
  const counters = all('[data-count]', root);
  const count = (tl: gsap.core.Timeline, el: HTMLElement, at: number) => {
    const to = Number(el.dataset['count']);
    const digits = Number(el.dataset['digits'] ?? 0);
    const state = { v: 0 };
    el.textContent = format(0, digits);
    tl.to(
      state,
      { v: to, duration: 0.5, onUpdate: () => (el.textContent = format(state.v, digits)) },
      at,
    );
  };

  // 1 · The water scale fills in from dry to wet, then the scale becomes the map.
  const s1 = scene(1);
  if (s1) {
    const tl = timeline(s1);
    const palette = s1.querySelector('[data-palette]');
    const labels = all('[data-scale-label]', s1);
    const map = s1.querySelector('[data-mini-map]');
    tl.from(all('[data-swatch]', s1), {
      opacity: 0,
      scaleY: 0.4,
      transformOrigin: 'bottom center',
      duration: 0.3,
      stagger: 0.08,
    }).from(labels, { opacity: 0, duration: 0.3 }, 0.2);
    const filled = tl.duration();
    if (palette && map) {
      tl.to(labels, { opacity: 0, duration: 0.4 }, filled + 0.2)
        .to(
          palette,
          { ...fitOnto(Flip, palette, map), opacity: 0, duration: 0.8, ease: ease.emphasized },
          filled + 0.2,
        )
        .fromTo(map, { opacity: 0 }, { opacity: 1, duration: 0.6 }, filled + 0.5);
    }
  }

  // 2 · The formula builds term by term; each D-1 value counts in as its term arrives.
  const s2 = scene(2);
  if (s2) {
    const tl = timeline(s2);
    all('[data-term]', s2).forEach((term, i) => {
      const at = i * 0.12;
      tl.from(term, { opacity: 0, y: 12, duration: 0.3 }, at);
      const counter = term.matches('[data-count]')
        ? term
        : term.querySelector<HTMLElement>('[data-count]');
      if (counter) count(tl, counter, at + 0.1);
    });
  }

  // 3 · Decision cards stack; the active card's reasons arrive in the order Saqi weighed them.
  const s3 = scene(3);
  if (s3) {
    const tl = timeline(s3);
    const cards = all('[data-card]', s3);
    cards.forEach((card, i) => {
      const prev = cards[i - 1];
      if (prev) {
        tl.from(card, { yPercent: 25, opacity: 0, duration: 0.5 }, i).to(
          prev,
          { y: -24, scale: 0.94, transformOrigin: 'top center', duration: 0.5 },
          i,
        );
      }
      tl.from(
        all('[data-reason]', card),
        { opacity: 0, y: 8, duration: 0.3, stagger: 0.08 },
        i + 0.3,
      );
    });
  }

  // 4 · The check counts climb.
  const s4 = scene(4);
  if (s4) {
    const tl = timeline(s4);
    tl.from(all('[data-stat]', s4), { opacity: 0, y: 12, duration: 0.3, stagger: 0.08 });
    all('[data-count]', s4).forEach((el, i) => count(tl, el, 0.1 + i * 0.08));
  }

  // 5 · The ending doesn't pin: its links simply arrive.
  const s5 = scene(5);
  if (s5 && reveal) {
    const links = gsap.from(all('[data-visual] li', s5), {
      opacity: 0,
      y: 8,
      duration: duration.settle,
      ease: ease.standard,
      stagger: stagger.list,
      paused: true,
    });
    reveal(s5, () => links.play());
  }

  // Hold the finished state for the last third of each pin, so the final figures are read
  // before the scene scrolls away (otherwise counters are still climbing at release).
  for (const tl of timelines) tl.to({}, { duration: tl.duration() / 2 });

  // Pins follow layout changes (images, fonts, late content) instead of stale positions.
  let frame = 0;
  const resized =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => ScrollTrigger.refresh());
        });
  resized?.observe(root);

  built = true;
  return () => {
    resized?.disconnect();
    cancelAnimationFrame(frame);
    delete root.dataset['story'];
    for (const el of counters) el.textContent = el.dataset['final'] ?? el.textContent;
  };
}

function revealOnce(root: HTMLElement, reveal: Reveal) {
  for (const scene of all('[data-scene]', root)) {
    const tween = gsap.from(scene.children, {
      opacity: 0,
      y: 16,
      duration: duration.settle,
      ease: ease.standard,
      stagger: stagger.list,
      paused: true,
    });
    reveal(scene, () => tween.play());
  }
}
