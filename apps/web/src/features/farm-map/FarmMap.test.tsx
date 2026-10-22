import { farm07 } from '@saqi/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlockList } from './BlockList';
import { FarmMap } from './FarmMap';
import { scenarioDecisions, scenarioSchedule } from './scenario';

const renderMap = (onSelect = vi.fn(), selectedId?: string) =>
  render(
    <FarmMap
      farm={farm07}
      decisions={scenarioDecisions}
      schedule={scenarioSchedule}
      selectedId={selectedId}
      onSelect={onSelect}
    />,
  );

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
});

describe('BlockList', () => {
  it('lists all seven blocks with their window and the stale sensor', () => {
    const onSelect = vi.fn();
    render(
      <BlockList
        farm={farm07}
        decisions={scenarioDecisions}
        schedule={scenarioSchedule}
        onSelect={onSelect}
      />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(8); // header + 7
    expect(screen.getByText('22:00 → 01:01 GST')).toBeDefined();
    expect(screen.getByText('Stale · 9 h', { exact: false })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /D-3/ }));
    expect(onSelect).toHaveBeenCalledWith('D-3');
  });
});
