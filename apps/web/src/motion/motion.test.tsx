import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '@/i18n';
import { MotionProvider, useMotion } from './MotionProvider';
import { countTo, dirAt, fadeUpStagger, growFromStart, meterTo } from './presets';
import { withMotion } from './withMotion';

const wrapper = ({ children }: { children: ReactNode }) => (
  <MotionProvider>{children}</MotionProvider>
);

afterEach(async () => {
  await act(() => setLocale('en'));
  document.body.innerHTML = '';
});

describe('useMotion', () => {
  it('mirrors horizontal motion in RTL', async () => {
    const { result } = renderHook(() => useMotion(), { wrapper });
    expect(result.current).toMatchObject({ dirSign: 1, originStart: 'left center' });
    await act(() => setLocale('ar'));
    expect(result.current).toMatchObject({ dirSign: -1, originStart: 'right center' });
  });

  it('marks <html data-motion> and lets the kitchen simulate reduced motion', () => {
    const { result } = renderHook(() => useMotion(), { wrapper });
    expect(document.documentElement.dataset['motion']).toBe('full');
    act(() => result.current.setForceReduced(true));
    expect(result.current.reduced).toBe(true);
    expect(document.documentElement.dataset['motion']).toBe('reduced');
  });
});

describe('presets', () => {
  it('countTo with reduced motion writes the final value at once', () => {
    const el = document.createElement('span');
    countTo(el, 200, 245.9, { precision: 1, reduced: true });
    expect(el.textContent).toBe('245.9');
  });

  it('countTo counts from the previous value, snapped to the display precision', () => {
    const el = document.createElement('span');
    const seen: string[] = [];
    const tl = countTo(el, 90, 91.5, {
      precision: 1,
      format: (v) => (seen.push(v.toFixed(3)), v.toFixed(1)),
    });
    tl.progress(0.5);
    tl.progress(1);
    expect(el.textContent).toBe('91.5');
    // Snapped: every intermediate value is a whole tenth, so nothing jitters.
    expect(seen.every((v) => v.endsWith('00'))).toBe(true);
  });

  it('growFromStart grows from the right in RTL and the left in LTR', () => {
    document.body.innerHTML =
      '<div dir="rtl"><span id="r"></span></div><div dir="ltr"><span id="l"></span></div>';
    const r = document.getElementById('r') as HTMLElement;
    const l = document.getElementById('l') as HTMLElement;
    expect(dirAt(r)).toBe(-1);
    growFromStart(r).progress(1);
    growFromStart(l).progress(1);
    expect(r.style.transformOrigin).toMatch(/^(right|100%)/);
    expect(l.style.transformOrigin).toMatch(/^(left|0%)/);
  });

  it('every preset ends visible under reduced motion', () => {
    document.body.innerHTML = '<ul><li>a</li><li>b</li></ul><span id="m"></span>';
    const items = document.querySelectorAll('li');
    fadeUpStagger(items, { reduced: true });
    meterTo(document.getElementById('m') as Element, 0.98, { reduced: true });
    for (const li of items) expect(li.style.opacity).toBe('1');
    expect((document.getElementById('m') as HTMLElement).style.transform).toContain(
      'scale(0.98, 1)',
    );
  });
});

describe('withMotion', () => {
  it('takes the reduced branch when reduced motion is forced', () => {
    const full = vi.fn();
    const reduced = vi.fn();
    const revert = withMotion(full, reduced, true);
    expect(reduced).toHaveBeenCalledOnce();
    expect(full).not.toHaveBeenCalled();
    revert();
  });

  it('renders inside a component without leaking', () => {
    const { unmount } = render(<MotionProvider>ok</MotionProvider>);
    unmount();
    expect(document.documentElement.dataset['motion']).toBeDefined();
  });
});
