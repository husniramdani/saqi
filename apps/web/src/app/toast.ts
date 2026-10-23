import { useSyncExternalStore } from 'react';

/** One polite message at a time (sync results, conflicts), read out by assistive tech. */
let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

export function showToast(text: string, ms = 5000) {
  message = text;
  clearTimeout(timer);
  timer = setTimeout(() => {
    message = null;
    emit();
  }, ms);
  emit();
}

export function useToast(): string | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => message,
    () => null,
  );
}
