import { afterEach, describe, expect, it, vi } from 'vitest';
import { captureBlock, takeBlock } from './flip';
import { loadMapPlugins } from './gsap';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('block Flip store (M5)', () => {
  it('hands the recorded map block to its own detail page, once', async () => {
    await loadMapPlugins();
    document.body.innerHTML =
      '<svg><rect data-flip-id="block-D-1" width="260" height="190"></rect></svg>';
    vi.useFakeTimers();
    captureBlock('D-1');
    expect(takeBlock('D-1')).not.toBeNull();
    // StrictMode's immediate second mount may take it again…
    expect(takeBlock('D-1')).not.toBeNull();
    // …but not later: back / forward never replays it.
    vi.advanceTimersByTime(400);
    expect(takeBlock('D-1')).toBeNull();
    vi.useRealTimers();
  });

  it('never plays a state recorded for another block', async () => {
    await loadMapPlugins();
    document.body.innerHTML = '<svg><rect data-flip-id="block-D-1"></rect></svg>';
    captureBlock('D-1');
    expect(takeBlock('F-1')).toBeNull();
    expect(takeBlock('D-1')).toBeNull(); // discarded by the mismatch, never taken
  });

  it('records nothing when the block is not on screen', async () => {
    await loadMapPlugins();
    captureBlock('D-9');
    expect(takeBlock('D-9')).toBeNull();
  });
});
