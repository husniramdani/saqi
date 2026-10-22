import { useRef, useState } from 'react';
import {
  countTo,
  crossfadeSwap,
  duration,
  ease,
  fadeUpStagger,
  growFromStart,
  meterTo,
  sheetIn,
  sheetOut,
  stagger,
  useGSAP,
  useMotion,
} from '@/motion';
import { Button, Meter, Spinner, Toggle, TimeTrack } from '@/ui';

// Dev-only: replay every motion preset; flip the kitchen's RTL switch to check the mirrors.

const REASONS = [
  'PAW now 68%',
  'ET₀ tomorrow 5.8 mm',
  'PAW 68% → 60.3% by tomorrow',
  'Falls below the 65% threshold',
  'Refill to 90% = 21.4 mm net',
];

function Cell({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-raised">
      <div className="flex flex-1 flex-col justify-center gap-3">{children}</div>
      <span className="text-xs font-medium text-text-muted">{caption}</span>
    </div>
  );
}

export function MotionLab() {
  const scope = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const swapText = useRef<HTMLParagraphElement>(null);
  const { reduced, forceReduced, setForceReduced } = useMotion();
  const [value, setValue] = useState(245.9);
  const [share, setShare] = useState(0.98);
  const [word, setWord] = useState<'en' | 'ar'>('en');
  // Click-time animations join this component's GSAP context, so unmount reverts them.
  const { context } = useGSAP({ scope });
  const run = (animate: () => void) => context.add(animate);
  const q = (selector: string) => scope.current?.querySelectorAll(selector) ?? [];

  const replayReasons = () => run(() => fadeUpStagger(q('[data-demo-reason]'), { reduced }));
  const replayBars = () => run(() => growFromStart(q('[data-schedule-bar]'), { reduced }));
  const bump = (delta: number) => {
    const next = Math.round((value + delta) * 10) / 10;
    run(() => {
      if (counter.current) countTo(counter.current, value, next, { precision: 1, reduced });
    });
    setValue(next);
  };
  const setMeter = (next: number) => {
    run(() => {
      const fill = scope.current?.querySelector('[data-meter-fill]');
      if (fill) meterTo(fill, next, { reduced });
    });
    setShare(next);
  };
  const openSheet = () =>
    run(() => void (sheet.current && sheetIn(sheet.current, backdrop.current, { reduced })));
  const closeSheet = () =>
    run(() => void (sheet.current && sheetOut(sheet.current, backdrop.current, { reduced })));
  const swap = () =>
    run(() => {
      if (swapText.current)
        crossfadeSwap(swapText.current, () => setWord((w) => (w === 'en' ? 'ar' : 'en')), {
          reduced,
        });
    });

  return (
    <div ref={scope} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 rounded-md bg-surface-raised p-4 text-sm">
        <span className="font-medium">Reduced motion</span>
        <Toggle label="Simulate reduced motion" checked={forceReduced} onChange={setForceReduced} />
        <span className="num text-text-secondary">
          data-motion = {reduced ? 'reduced' : 'full'}
        </span>
        <span className="text-text-muted">Reduced: every preset jumps to its end state.</span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Cell caption="M7 fadeUpStagger · settle 0.48 s · stagger 0.06">
          <ol className="flex flex-col text-sm">
            {REASONS.map((r) => (
              <li
                key={r}
                data-demo-reason
                className="border-t border-border py-1.5 first:border-t-0"
              >
                {r}
              </li>
            ))}
          </ol>
          <Button variant="ghost" onClick={replayReasons}>
            Replay
          </Button>
        </Cell>

        <Cell caption="M6 growFromStart · drift 0.9 s · expo.out · mirrors in RTL">
          <TimeTrack hours={7} bars={[{ from: 0, to: 0.43, label: 'D-1' }]} />
          <TimeTrack hours={7} bars={[{ from: 0.43, to: 0.92, label: 'F-1' }]} />
          <Button variant="ghost" onClick={replayBars}>
            Replay
          </Button>
        </Cell>

        <Cell caption="M3 countTo · from the previous value, snapped to 0.1">
          <span className="num text-3xl tracking-[-0.03em]">
            <span ref={counter}>{value.toFixed(1)}</span>
            <span className="ms-1 text-[0.42em] text-text-muted">m³</span>
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => bump(12.5)}>
              +12.5
            </Button>
            <Button variant="ghost" onClick={() => bump(-40)}>
              −40
            </Button>
          </div>
        </Cell>

        <Cell caption="M4 meterTo · scaleX from the inline start">
          <Meter value={share} mark={0.97} label="Demo budget" />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setMeter(0.42)}>
              42 %
            </Button>
            <Button variant="ghost" onClick={() => setMeter(0.98)}>
              98 %
            </Button>
          </div>
        </Cell>

        <Cell caption="M10 sheetIn / sheetOut · settle in, step out">
          <div className="relative h-36 overflow-hidden rounded-md border border-border bg-surface-raised">
            <div ref={backdrop} className="absolute inset-0 bg-primary opacity-0" />
            <div
              ref={sheet}
              className="absolute inset-x-0 bottom-0 translate-y-full rounded-t-lg bg-surface p-4 shadow-floating"
            >
              <p className="text-sm font-medium">Mark done · Clear bubblers, row 4</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={openSheet}>
              Open
            </Button>
            <Button variant="ghost" onClick={closeSheet}>
              Close
            </Button>
          </div>
        </Cell>

        <Cell caption="M12 crossfadeSwap · step out, swap, step in · spinner">
          <p ref={swapText} className="text-xl" lang={word}>
            {word === 'en' ? 'Tonight’s plan' : 'خطة الليلة'}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={swap}>
              Swap language
            </Button>
            <Spinner />
          </div>
        </Cell>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-start text-xs text-text-muted">
            <th className="py-1.5 text-start font-medium">Duration</th>
            <th className="py-1.5 text-start font-medium">Ease</th>
            <th className="py-1.5 text-start font-medium">Stagger</th>
          </tr>
        </thead>
        <tbody className="num align-top">
          <tr>
            <td className="py-1.5">
              {Object.entries(duration).map(([k, v]) => (
                <div key={k}>
                  {k} {v}s
                </div>
              ))}
            </td>
            <td className="py-1.5">
              {Object.entries(ease).map(([k, v]) => (
                <div key={k}>
                  {k} {v}
                </div>
              ))}
            </td>
            <td className="py-1.5">
              {Object.entries(stagger).map(([k, v]) => (
                <div key={k}>
                  {k} {v}s
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
