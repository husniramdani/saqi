import { farm07, type BlockDecision } from '@saqi/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setLocale } from '@/i18n';
import { AppShell } from './AppShell';
import { setTheme } from './theme';

// The shell's data comes from the API; here it is stubbed so no request leaves the test.
const decision = (
  blockId: string,
  d: BlockDecision['decision'],
  confidence: BlockDecision['confidence'] = 'high',
) => ({ blockId, decision: d, confidence }) as BlockDecision;
vi.mock('@/api/queries', () => ({
  useFarm: () => ({ data: farm07 }),
  usePlanToday: () => ({
    data: {
      decisions: [
        decision('D-1', 'irrigate'),
        decision('D-2', 'skip'),
        decision('D-3', 'skip', 'low'),
        decision('F-1', 'deficit'),
      ],
    },
  }),
}));

function renderShell(path = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <h1>Today page</h1> },
          { path: 'field', element: <h1>Field page</h1> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    // StrictMode like main.tsx: its double effects once made focus jump on first load.
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
  return router;
}

afterEach(async () => {
  await act(() => setLocale('en'));
  setTheme('day');
});

describe('AppShell', () => {
  it('marks the current section in the nav', () => {
    renderShell('/field');
    const header = screen.getAllByRole('navigation')[0];
    const current = header?.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe('Field');
  });

  it('always says the sensors are simulated', () => {
    renderShell();
    expect(screen.getByText('Simulated sensors')).toBeDefined();
  });

  it('counts the blocks that need attention: irrigate, deficit or low confidence', () => {
    renderShell();
    const link = screen.getByRole('link', { name: /need attention/ });
    expect(link.textContent).toBe('3need attention');
  });

  it('switches language and direction from the header', async () => {
    renderShell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Arabic' }));
    });
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    // The labels are Arabic now too.
    expect(screen.getByRole('button', { name: 'العربية' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(screen.getByRole('link', { name: 'Saqi، اليوم' })).toBeTruthy();
  });

  it('crossfades the app around the switch (M12) and still lands it', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Urdu' }));
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('ur'));
    expect(document.documentElement.dir).toBe('rtl');
    await vi.waitFor(() => expect(root.style.opacity).toBe('1'));
    root.remove();
  });

  it('toggles and remembers the night theme', () => {
    renderShell();
    fireEvent.click(screen.getByRole('button', { name: 'Switch to the night theme' }));
    expect(document.documentElement.dataset['theme']).toBe('night');
    expect(localStorage.getItem('saqi.theme')).toBe('night');
    fireEvent.click(screen.getByRole('button', { name: 'Switch to the day theme' }));
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('moves focus to the page heading after navigating, not on first load', async () => {
    const router = renderShell();
    const main = document.getElementById('main');
    expect(document.activeElement).not.toBe(main);
    await act(() => router.navigate('/field'));
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Field page' }),
    );
  });
});
