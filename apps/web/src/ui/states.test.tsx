import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Meter } from './Meter';
import { EmptyState, ErrorState, Skeleton, StaleTag } from './states';

describe('panel states', () => {
  it('error: says what failed and retries', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Couldn’t load tonight’s plan." onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load tonight’s plan.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('empty: a title and one line', () => {
    render(<EmptyState title="No irrigation needed tonight.">Saves 112 m³.</EmptyState>);
    expect(screen.getByText('No irrigation needed tonight.')).toBeDefined();
  });

  it('stale: a word and a hatch, never colour alone', () => {
    const { container } = render(<StaleTag hours={9} />);
    expect(container.textContent).toContain('Stale · 9 h');
    expect(container.querySelector('pattern')).not.toBeNull();
  });

  it('skeleton: hidden from assistive tech, sized like the content', () => {
    const { container } = render(<Skeleton inline={120} block={44} />);
    const block = container.firstElementChild as HTMLElement;
    expect(block.getAttribute('aria-hidden')).toBe('true');
    expect(block.style.blockSize).toBe('44px');
  });
});

describe('Meter', () => {
  it('reports the real share but never overfills the track', () => {
    const { container } = render(<Meter value={1.04} mark={0.97} label="Budget" />);
    expect(screen.getByRole('meter', { name: 'Budget' }).getAttribute('aria-valuenow')).toBe('104');
    const fill = container.querySelector<HTMLElement>('[data-meter-fill]');
    expect(fill?.style.transform).toBe('scaleX(1)');
  });
});
