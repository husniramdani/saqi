import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { gsap, MotionProvider, useMotion, type Motion } from '@/motion';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('stops turning when reduced motion switches on (no loop left behind)', () => {
    let motion: Motion | undefined;
    function Probe() {
      motion = useMotion();
      return null;
    }
    const { container } = render(
      <MotionProvider>
        <Probe />
        <Spinner />
      </MotionProvider>,
    );
    const ring = container.querySelector('[data-spinner]');
    const live = () => gsap.getTweensOf(ring).filter((t) => t.isActive() || !t.paused()).length;
    expect(live()).toBeGreaterThan(0);
    act(() => motion?.setForceReduced(true));
    expect(live()).toBe(0);
  });
});
