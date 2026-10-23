import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFlip, loadMapPlugins, loadStoryPlugins } from '@/motion';
import { buildStory } from './storyMotion';

// A one-scene page: a heading GSAP would split and a figure it would count.
function page() {
  const root = document.createElement('main');
  root.innerHTML = `
    <section data-scene="2">
      <h2 data-split>Water first.</h2>
      <p data-term><span data-count="90.4" data-digits="1" data-final="90.4">90.4</span></p>
    </section>`;
  document.body.append(root);
  return root;
}

/** Pretend the OS matches only queries containing these fragments. */
function prefer(...fragments: string[]) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: fragments.every((f) => query.includes(f)),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

async function plugins() {
  const story = await loadStoryPlugins();
  await loadMapPlugins();
  const Flip = getFlip();
  if (!Flip) throw new Error('Flip did not load');
  return { ...story, Flip };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('buildStory', () => {
  it('leaves the page exactly as written under reduced motion', async () => {
    prefer('motion: reduce');
    const root = page();
    const before = root.innerHTML;
    const revert = buildStory(root, await plugins(), (v, d) => v.toFixed(d));
    expect(root.dataset['story']).toBeUndefined();
    expect(root.innerHTML).toBe(before);
    revert();
  });

  it('pins on desktop, then reverts to the written page and the real figures', async () => {
    prefer('min-width: 768px', 'no-preference');
    const root = page();
    const revert = buildStory(root, await plugins(), (v, d) => v.toFixed(d));
    expect(root.dataset['story']).toBe('pinned');
    // Counters start from zero while pinned.
    expect(root.querySelector('[data-count]')?.textContent).toBe('0.0');
    revert();
    expect(root.dataset['story']).toBeUndefined();
    expect(root.querySelector('[data-count]')?.textContent).toBe('90.4');
    expect(root.querySelector('h2')?.textContent).toBe('Water first.');
    expect(root.querySelector('.pin-spacer')).toBeNull();
  });
});
