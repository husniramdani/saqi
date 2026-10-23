import { useEffect } from 'react';
import { gsap, loadScrollPlugin } from './gsap';
import { useMotion } from './MotionProvider';
import { duration, ease } from './tokens';

/** Where a fragment jump lands `target`: its top less `scroll-margin-top` and the page's `scroll-padding-top`. */
function fragmentY(target: Element): number {
  const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = target.getBoundingClientRect().top + window.scrollY - margin - padding;
  return Math.max(0, Math.min(max, y));
}

/**
 * Glides the page to where a fragment jump would put `target`: `drift` for a short way, `tide`
 * past three screens, on the `emphasized` ease. Resolves `true` on arrival, `false` when the
 * reader takes over (wheel, touch or keys: ScrollTo's autoKill) or another glide replaces it.
 * Reduced motion: the jump, at once.
 */
export async function glideTo(target: Element, reduced: boolean): Promise<boolean> {
  if (reduced) {
    window.scrollTo(0, fragmentY(target));
    return true;
  }
  await loadScrollPlugin();
  const y = fragmentY(target);
  const far = Math.abs(y - window.scrollY) > window.innerHeight * 3;
  return new Promise((resolve) => {
    gsap.to(window, {
      scrollTo: { y, autoKill: true, onAutoKill: () => resolve(false) },
      duration: far ? duration.tide : duration.drift,
      ease: ease.emphasized,
      overwrite: true,
      onComplete: () => resolve(true),
      onInterrupt: () => resolve(false),
    });
  });
}

/** The section a click should glide to: a plain left click on a link to a fragment of this page. */
function fragmentTarget(e: MouseEvent): { hash: string; target: HTMLElement } | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
    return null;
  }
  const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement) || link.target || link.hasAttribute('download')) {
    return null;
  }
  const url = new URL(link.href);
  const here = window.location;
  if (!url.hash || url.origin !== here.origin || url.pathname !== here.pathname) return null;
  if (url.search !== here.search) return null;
  const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
  return target ? { hash: url.hash, target } : null;
}

/**
 * Links to a section of the page they are on glide there instead of jumping, app-wide. Listens
 * in the capture phase, ahead of React Router's `<Link>` and its ScrollRestoration, which would
 * jump. On arrival the hash is set, so the URL, history, `:target` and the keyboard's focus
 * starting point end as after a native jump (taken from where the page already is, so nothing
 * moves). Modified clicks, other pages and reduced motion keep the native behaviour.
 */
export function useSmoothAnchors() {
  const { reduced } = useMotion();
  useEffect(() => {
    if (reduced) return;
    const onClick = (e: MouseEvent) => {
      const found = fragmentTarget(e);
      if (!found) return;
      e.preventDefault();
      void glideTo(found.target, false).then((arrived) => {
        if (arrived) window.location.hash = found.hash;
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [reduced]);
}
