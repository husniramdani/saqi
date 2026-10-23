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

// jsdom has no modal dialog; this only toggles `open`. Real browsers add the focus trap and inert page.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
  };
}

// Testing Library only auto-cleans with Vitest globals, which this repo doesn't use.
afterEach(cleanup);
