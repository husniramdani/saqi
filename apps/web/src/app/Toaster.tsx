import { useToast } from './toast';

/** The polite live region for sync results; sits above the phone bottom bar. */
export function Toaster() {
  const message = useToast();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex justify-center md:bottom-6"
    >
      {message ? (
        <p className="pointer-events-auto max-w-sm rounded-md bg-inverse px-4 py-3 text-sm text-inverse-text shadow-floating">
          {message}
        </p>
      ) : null}
    </div>
  );
}
