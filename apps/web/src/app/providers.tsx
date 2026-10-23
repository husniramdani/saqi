import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from '@/i18n';
import { MotionProvider, useSmoothAnchors } from '@/motion';
import { Toaster } from './Toaster';
import { useOutboxSync } from './useOutboxSync';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RuntimeEffects />
        <MotionProvider>
          <MotionEffects />
          {children}
        </MotionProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

/** App-wide effects stay mounted for standalone routes as well as the operational shell. */
function RuntimeEffects() {
  useOutboxSync();
  return <Toaster />;
}

/** App-wide motion that needs the reduced-motion setting: same-page links glide. */
function MotionEffects() {
  useSmoothAnchors();
  return null;
}
