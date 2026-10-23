import { farm07 } from '@saqi/shared';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FarmMap } from './FarmMap';
import { DEFAULT_MAP_LAYERS, type MapLayers } from './layers';
import { scenarioDecisions, scenarioSchedule } from './scenario';

const renderMap = (
  onSelect = vi.fn(),
  selectedId?: string,
  extra: { layers?: MapLayers; zoom?: number; variant?: 'default' | 'canvas' } = {},
) =>
  render(
    <FarmMap
      farm={farm07}
      decisions={scenarioDecisions}
      schedule={scenarioSchedule}
      selectedId={selectedId}
      onSelect={onSelect}
      {...extra}
    />,
  );

const without = (...off: (keyof MapLayers)[]): MapLayers => ({
  ...DEFAULT_MAP_LAYERS,
  ...Object.fromEntries(off.map((key) => [key, false])),
});

/** Hidden by a layer switch: inside a `[data-layer]` group that is hidden and aria-hidden. */
const hidden = (el: Element | null) => {
  const group = el?.closest('[data-layer]');
  return (
    group?.getAttribute('visibility') === 'hidden' && group.getAttribute('aria-hidden') === 'true'
  );
};

describe('FarmMap', () => {
  it('names every block with its water, decision and volume', () => {
    renderMap();
    expect(
      screen.getByRole('button', {
        name: 'D-1 Khalas palms, 68 percent water, Irrigate, 90.4 cubic metres',
      }),
    ).toBeDefined();
    expect(
      screen.getByRole('button', { name: 'D-3 Fard palms, 75 percent water, Skip, stale sensor' }),
    ).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(7);
  });

  it('summarises the plan for screen readers', () => {
    renderMap();
    const group = screen.getByRole('group', {
      name: /Watered tonight: D-1, F-1\. Stale sensors: D-3/,
    });
    expect(group.tagName.toLowerCase()).toBe('svg');
  });

  it('hatches the stale block and routes water to tonight’s blocks only', () => {
    const { container } = renderMap();
    expect(
      [...container.querySelectorAll('[data-stale]')].map((e) => e.getAttribute('data-stale')),
    ).toEqual(['D-3']);
    expect(
      [...container.querySelectorAll('[data-scheduled]')].map((e) =>
        e.getAttribute('data-scheduled'),
      ),
    ).toEqual(['D-1', 'F-1']);
  });

  it('fills each block from the water scale by its PAW', () => {
    const { container } = renderMap();
    expect(container.querySelector('[data-block-fill="D-1"]')?.getAttribute('fill')).toBe(
      'var(--color-water-4)',
    );
    expect(container.querySelector('[data-block-fill="F-1"]')?.getAttribute('fill')).toBe(
      'var(--color-water-3)',
    );
  });

  it('selects with Enter or Space, and click', () => {
    const onSelect = vi.fn();
    renderMap(onSelect);
    const d1 = screen.getByRole('button', { name: /^D-1 / });
    fireEvent.keyDown(d1, { key: 'Enter' });
    fireEvent.keyDown(d1, { key: ' ' });
    fireEvent.click(d1);
    expect(onSelect).toHaveBeenNthCalledWith(3, 'D-1');
  });

  it('moves focus between blocks with the arrow keys', () => {
    renderMap();
    const d1 = screen.getByRole('button', { name: /^D-1 / });
    d1.focus();
    fireEvent.keyDown(d1, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-block')).toBe('D-2');
    fireEvent.keyDown(document.activeElement as Element, { key: 'End' });
    expect(document.activeElement?.getAttribute('data-block')).toBe('F-1');
  });

  it('marks the selected block and shows a tooltip on focus', () => {
    renderMap(vi.fn(), 'F-1');
    const f1 = screen.getByRole('button', { name: /^F-1 / });
    expect(f1.getAttribute('aria-pressed')).toBe('true');
    fireEvent.focus(f1);
    expect(screen.getByText('01:01 → 04:28 GST')).toBeDefined();
  });

  it('shows every layer by default', () => {
    const { container } = renderMap();
    expect(container.querySelectorAll('[data-layer][visibility="hidden"]')).toHaveLength(0);
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 1000 620');
  });

  it('keeps blocks selectable, with focus and selection outlines, when labels are off', () => {
    const onSelect = vi.fn();
    const { container } = renderMap(onSelect, 'D-2', { layers: without('labels') });
    expect(screen.getAllByRole('button')).toHaveLength(7);
    for (const tag of container.querySelectorAll('[data-tag]')) expect(hidden(tag)).toBe(true);

    const d1 = screen.getByRole('button', { name: /^D-1 / });
    act(() => d1.focus());
    expect(d1.querySelector('.layer-focus')).not.toBeNull();
    expect(hidden(d1.querySelector('.layer-focus'))).toBe(false);
    fireEvent.keyDown(d1, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('D-1');
    fireEvent.keyDown(d1, { key: 'ArrowRight' });
    expect(document.activeElement?.getAttribute('data-block')).toBe('D-2');
    expect(container.querySelector('[data-block="D-2"] .layer-selected')).not.toBeNull();
  });

  it('drops the water colours when plant-available water is off', () => {
    const { container } = renderMap(vi.fn(), undefined, { layers: without('paw') });
    const fills = [...container.querySelectorAll('[data-block-fill]')];
    expect(fills).toHaveLength(7);
    for (const fill of fills) expect(fill.getAttribute('fill')).toBe('var(--color-surface-well)');
    expect(container.querySelector('[fill^="var(--color-water"]')).toBeNull();
  });

  it('switches tonight’s routes and the base pipe network independently', () => {
    const { container, rerender } = renderMap(vi.fn(), undefined, { layers: without('flow') });
    const route = () => container.querySelector('[data-scheduled="D-1"]');
    const network = () => container.querySelector('.layer-pipes path');
    expect(hidden(route())).toBe(true);
    expect(hidden(network())).toBe(false);

    rerender(
      <FarmMap
        farm={farm07}
        decisions={scenarioDecisions}
        schedule={scenarioSchedule}
        onSelect={vi.fn()}
        layers={without('pipes')}
      />,
    );
    expect(hidden(route())).toBe(false);
    expect(hidden(network())).toBe(true);
  });

  it('points the running water at the selected block, and at all of tonight’s without one', () => {
    const draw = (selectedId?: string, layers?: MapLayers) => (
      <FarmMap
        farm={farm07}
        decisions={scenarioDecisions}
        schedule={scenarioSchedule}
        selectedId={selectedId}
        onSelect={vi.fn()}
        {...(layers ? { layers } : {})}
      />
    );
    const { container, rerender } = render(draw());
    const running = () =>
      [...container.querySelectorAll('[data-running]')].map((e) => e.getAttribute('data-flow'));
    const route = () => container.querySelector('[data-route]');
    expect(running()).toEqual(['D-1', 'F-1']);
    expect(route()).toBeNull();

    // G-2 is not watered tonight: its own route is drawn and is the only one running.
    rerender(draw('G-2'));
    expect(route()?.getAttribute('data-route')).toBe('G-2');
    expect(running()).toEqual(['G-2']);
    // Tonight's routes are still shown, just still.
    expect(container.querySelectorAll('[data-scheduled]')).toHaveLength(2);

    // D-1 is on tonight's schedule: its own route runs, without a second copy on top.
    rerender(draw('D-1'));
    expect(route()).toBeNull();
    expect(running()).toEqual(['D-1']);

    // Tonight's flow switched off: the selected route stays, running.
    rerender(draw('D-1', without('flow')));
    expect(route()?.getAttribute('data-route')).toBe('D-1');
    expect(hidden(route())).toBe(false);
    expect(running()).toEqual(['D-1']);
    expect(hidden(container.querySelector('[data-scheduled="D-1"]'))).toBe(true);
  });

  it('hides the stale hatch, textures and water sources with their switches', () => {
    const { container } = renderMap(vi.fn(), undefined, {
      layers: without('stale', 'texture', 'utilities'),
    });
    expect(hidden(container.querySelector('[data-stale="D-3"]'))).toBe(true);
    expect(hidden(container.querySelector('.layer-texture'))).toBe(true);
    expect(hidden(container.querySelector('.layer-utilities'))).toBe(true);
    expect(hidden(container.querySelector('.layer-pipes path'))).toBe(false);
  });

  it('zooms around the farm centre and keeps the tooltip on the zoomed plan', () => {
    renderMap(vi.fn(), undefined, { zoom: 2 });
    expect(screen.getByRole('group', { name: /^Map of / }).getAttribute('viewBox')).toBe(
      '250 155 500 310',
    );
    const d2 = screen.getByRole('button', { name: /^D-2 / });
    fireEvent.focus(d2);
    const block = farm07.blocks.find((b) => b.id === 'D-2');
    // jsdom maps 1000 × 620 px onto the zoomed view; the card (0 px wide here) sits on the label.
    const x = Math.min(1, Math.max(0, ((block?.geometry.label.x ?? 0) - 250) / 500));
    const tooltip = screen.getByText('Skip').closest('[data-map-tooltip]') as HTMLElement;
    expect(tooltip.style.left).toBe(`${x * 1000}px`);
  });
});

describe('FarmMap canvas (Today)', () => {
  it('lets the canvas ground show through, labels every source and points to the rail', () => {
    const { container } = renderMap(vi.fn(), undefined, { variant: 'canvas' });
    expect(container.querySelector('.layer-ground')).toBeNull();
    for (const label of ['WELL W-1', 'RO', 'TANK', 'PUMP 60 m³/h', 'TSE INLET'])
      expect(screen.getByText(label)).toBeDefined();
    expect(screen.getByRole('group', { name: /^Map of / }).getAttribute('aria-label')).toMatch(
      /The Blocks list is its full text alternative\.$/,
    );
  });
});
