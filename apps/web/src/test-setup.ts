import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/i18n';

// jsdom has no matchMedia; GSAP's matchMedia and the motion provider need one.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      // Like a default browser: no reduced-motion preference.
      matches: query.includes('no-preference'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Testing Library only auto-cleans with Vitest globals, which this repo doesn't use.
afterEach(cleanup);
