import type { Flip } from 'gsap/Flip';
import { getFlip } from './gsap';

/**
 * M5 · map block → block detail. Before navigating, the map block's box is recorded here; the
 * detail page takes it on mount and morphs its header swatch out of it. Only a click records,
 * so the browser's back button (or a deep link) never plays a stale Flip.
 */
let pending: { id: string; state: Flip.FlipState } | null = null;

export function captureBlock(blockId: string) {
  const Flip = getFlip();
  const el = document.querySelector(`[data-flip-id="block-${blockId}"]`);
  pending = Flip && el ? { id: blockId, state: Flip.getState(el) } : null;
  taken = null; // a new navigation forgets the last one
}

/** How long a taken state stays available to the same block: covers StrictMode's re-run only. */
const RETAKE_MS = 300;
let taken: { id: string; state: Flip.FlipState; at: number } | null = null;

/**
 * The recorded state for this block, once; anything else is discarded. In development StrictMode
 * mounts twice and the first mount's Flip is reverted, so the same block may take it again
 * within a moment; never later (so back/forward can't replay it).
 */
export function takeBlock(blockId: string): Flip.FlipState | null {
  if (pending?.id === blockId) {
    taken = { id: blockId, state: pending.state, at: Date.now() };
    pending = null;
    return taken.state;
  }
  pending = null;
  return taken?.id === blockId && Date.now() - taken.at < RETAKE_MS ? taken.state : null;
}
