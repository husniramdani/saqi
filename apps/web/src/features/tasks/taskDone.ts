import { dirAt, duration, ease, gsap, loadMapPlugins } from '@/motion';

/**
 * M9 · first half, in place: the check draws (DrawSVG) and the strike line grows from the inline
 * start. Resolves when done; the caller then records Flip state and commits the move.
 * Loads DrawSVG + Flip on first use only (no MotionPath, no story plugins on Field).
 */
export async function playTaskDone(card: Element): Promise<void> {
  await loadMapPlugins();
  const check = card.querySelector('[data-task-check]');
  const strike = card.querySelector('[data-task-strike]');
  if (!check || !strike) return;
  await gsap
    .timeline()
    .set([check, strike], { autoAlpha: 1 })
    .fromTo(
      check.querySelector('path'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: duration.settle, ease: ease.standard },
    )
    .fromTo(
      strike,
      { scaleX: 0, transformOrigin: dirAt(strike) === -1 ? 'right center' : 'left center' },
      { scaleX: 1, duration: duration.settle, ease: ease.standard },
      '<+=0.1',
    )
    .then();
}

/** Selector for every task card Flip tracks (TaskCard sets `data-flip-id="task-…"`). */
export const TASK_CARDS = '[data-flip-id^="task-"]';
