import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useLocale, isRtl } from '@/i18n';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}
const systemReduced = () =>
  typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false;

interface MotionState {
  /** True when the OS asks for reduced motion, or the kitchen simulates it. */
  reduced: boolean;
  forceReduced: boolean;
  setForceReduced: (on: boolean) => void;
}

const MotionContext = createContext<MotionState>({
  reduced: false,
  forceReduced: false,
  setForceReduced: () => undefined,
});

/** Tracks reduced motion live and mirrors it on `<html data-motion>` for CSS hooks and tests. */
export function MotionProvider({ children }: { children: ReactNode }) {
  const system = useSyncExternalStore(subscribe, systemReduced, () => false);
  const [forceReduced, setForceReduced] = useState(false);
  const reduced = system || forceReduced;
  useEffect(() => {
    document.documentElement.dataset['motion'] = reduced ? 'reduced' : 'full';
  }, [reduced]);
  return (
    <MotionContext value={{ reduced, forceReduced, setForceReduced }}>{children}</MotionContext>
  );
}

export interface Motion extends MotionState {
  /** −1 in RTL: multiply every horizontal offset by it (CLAUDE.md §5). */
  dirSign: 1 | -1;
  /** `transformOrigin` for anything that grows from the inline start. */
  originStart: 'left center' | 'right center';
}

export function useMotion(): Motion {
  const state = useContext(MotionContext);
  const rtl = isRtl(useLocale());
  return { ...state, dirSign: rtl ? -1 : 1, originStart: rtl ? 'right center' : 'left center' };
}
