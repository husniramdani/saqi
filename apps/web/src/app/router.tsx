import { createBrowserRouter } from 'react-router';
import { AppShell } from './AppShell';

// Each route module exports `Component` and loads lazily, so heavy features split per route.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, lazy: () => import('@/routes/today') },
      { path: 'blocks/:blockId', lazy: () => import('@/routes/block') },
      { path: 'field', lazy: () => import('@/routes/field') },
      { path: '*', lazy: () => import('@/routes/not-found') },
    ],
  },
  // The story page has its own minimal header, not the app shell (plan/05 §0).
  { path: '/making-of', lazy: () => import('@/routes/making-of') },
  // Component review page; never shipped in production builds.
  ...(import.meta.env.DEV
    ? [{ path: '/dev/kitchen', lazy: () => import('@/routes/dev-kitchen') }]
    : []),
]);
