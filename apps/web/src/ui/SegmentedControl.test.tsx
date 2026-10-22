import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

function Harness({ dir = 'ltr' }: { dir?: 'ltr' | 'rtl' }) {
  const [value, setValue] = useState<'map' | 'list' | 'table'>('map');
  return (
    <div dir={dir}>
      <SegmentedControl
        label="View"
        value={value}
        onChange={setValue}
        options={[
          { value: 'map', label: 'Map' },
          { value: 'list', label: 'List' },
          { value: 'table', label: 'Table' },
        ]}
      />
    </div>
  );
}

const selected = () => screen.getByRole('tab', { selected: true }).textContent;

describe('SegmentedControl', () => {
  it('is a labelled tablist with one tab in the tab order', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'View' })).toBeDefined();
    expect(screen.getAllByRole('tab').map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it('selects on click', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(selected()).toBe('List');
  });

  it('moves with arrow keys, wrapping, and jumps with Home and End', () => {
    render(<Harness />);
    const tab = () => screen.getByRole('tab', { selected: true });
    fireEvent.keyDown(tab(), { key: 'ArrowRight' });
    expect(selected()).toBe('List');
    expect(document.activeElement).toBe(tab());
    fireEvent.keyDown(tab(), { key: 'End' });
    expect(selected()).toBe('Table');
    fireEvent.keyDown(tab(), { key: 'ArrowRight' });
    expect(selected()).toBe('Map');
    fireEvent.keyDown(tab(), { key: 'ArrowLeft' });
    expect(selected()).toBe('Table');
    fireEvent.keyDown(tab(), { key: 'Home' });
    expect(selected()).toBe('Map');
  });

  it('follows the reading direction in RTL', () => {
    render(<Harness dir="rtl" />);
    fireEvent.keyDown(screen.getByRole('tab', { selected: true }), { key: 'ArrowLeft' });
    expect(selected()).toBe('List');
  });
});
