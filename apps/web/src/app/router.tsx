import { createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';

// Each route module exports `Component` and loads lazily, so heavy features split per route.
export const router = createBrowserRouter([
  { path: '/', lazy: () => import('@/routes/landing'), HydrateFallback: () => null },
  {
    element: <AppShell />,
    // Lazy routes resolve before the first render; nothing to show meanwhile.
    HydrateFallback: () => null,
    children: [
      { path: '/today', lazy: () => import('@/routes/today') },
      { path: '/blocks/:blockId', lazy: () => import('@/routes/block') },
      { path: '/field', lazy: () => import('@/routes/field') },
      { path: '*', lazy: () => import('@/routes/not-found') },
    ],
  },
  // The story page has its own minimal header, not the app shell (plan/05 §0).
  { path: '/making-of', lazy: () => import('@/routes/making-of') },
  // Dev-only pages, never shipped in production builds: the component review page and the
  // social card that `pnpm og` screenshots into public/og.png.
  ...(import.meta.env.DEV
    ? [
        { path: '/dev/kitchen', lazy: () => import('@/routes/dev-kitchen') },
        { path: '/og', lazy: () => import('@/routes/dev-og') },
      ]
    : []),
]);
