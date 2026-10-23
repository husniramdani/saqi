import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Component as MakingOf } from './index';

// No test-stats.json in tests: the page must fall back to the recorded counts.
vi.stubGlobal('fetch', async () => new Response('<!doctype html>'));

function renderPage() {
  const router = createMemoryRouter([{ path: '/', element: <MakingOf /> }]);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('Making-of', () => {
  it('reads as a plain page: a title and five scenes with real headings', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'How Saqi is built' })).toBeTruthy();
    expect(
      screen
        .getAllByRole('region')
        .map((r) => within(r).getByRole('heading', { level: 2 }).textContent),
    ).toEqual([
      'One look, everywhere.',
      'Water first.',
      'Every decision explains itself.',
      'Checked before every update.',
      'Built by Husni Ramdani.',
    ]);
  });

  it('shows the engine’s numbers before any motion runs', () => {
    renderPage();
    const water = screen.getByRole('region', { name: 'Water first.' });
    expect(within(water).getByText('90.4')).toBeTruthy();
    expect(within(water).getByText('60.35')).toBeTruthy();
    const reasons = screen.getByRole('region', { name: 'Every decision explains itself.' });
    expect(within(reasons).getByText('Irrigate')).toBeTruthy();
    expect(within(reasons).getByText('155.5 m³')).toBeTruthy();
  });

  it('shows the water scale as a picture, not code, and keeps the mini map out of the tab order', () => {
    renderPage();
    const design = screen.getByRole('region', { name: 'One look, everywhere.' });
    expect(within(design).getByRole('img', { name: 'Water scale, dry to wet' })).toBeTruthy();
    expect(document.querySelector('pre, code')).toBeNull();
    const map = design.querySelector('[data-mini-map]');
    expect(map?.hasAttribute('inert')).toBe(true);
    expect(map?.getAttribute('aria-hidden')).toBe('true');
  });

  it('speaks to visitors, not developers', () => {
    renderPage();
    const text = screen.getByRole('main').textContent ?? '';
    expect(text).not.toMatch(/design\.md|pnpm|Stylebase|tokens?\b|engine|TAW|E2E|\bCI\b|tests?\b/i);
  });

  it('ends with the app and the author, nothing else', () => {
    renderPage();
    const author = screen.getByRole('region', { name: 'Built by Husni Ramdani.' });
    expect(
      within(author)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Open the app', '/today'],
      ['Husni Ramdani', 'https://github.com/husniramdani'],
    ]);
  });
});
