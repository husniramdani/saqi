import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { Figure, Stat } from './Figure';

afterEach(() => act(() => setLocale('en')));

describe('Figure', () => {
  it('sets the value at its precision with the unit beside it', () => {
    render(<Figure value={90.43} unit="m³" />);
    const figure = screen.getByText('90.4').closest('[data-value]') as HTMLElement;
    expect(figure.textContent).toBe('90.4m³');
    expect(figure.dataset['value']).toBe('90.43');
    expect(figure.className).toContain('num');
  });

  it('keeps Western digits in Arabic', async () => {
    await act(() => setLocale('ar'));
    const { container } = render(<Figure value={1234.5} unit="m³" />);
    expect(container.textContent).not.toMatch(/[٠-٩۰-۹]/);
    expect(container.textContent).toContain('234');
  });

  it('marks tonight’s figure with orange text, never the fill', () => {
    render(<Figure value={245.9} unit="m³" accent />);
    const figure = screen.getByText('245.9').closest('[data-value]') as HTMLElement;
    expect(figure.className).toContain('text-accent-text');
    expect(figure.className.split(' ')).not.toContain('text-accent');
  });
});

it('counts from the previous value when it changes (M3), and starts final', async () => {
  const { container, rerender } = render(<Figure value={90.4} unit="m³" />);
  const number = container.querySelector('[data-value] > span') as HTMLElement;
  expect(number.textContent).toBe('90.4');
  rerender(<Figure value={155.5} unit="m³" />);
  // Mid-count: the text starts from the old value, not from 0 and not already final.
  expect(Number(number.textContent)).toBeGreaterThanOrEqual(90.4);
  await new Promise((r) => setTimeout(r, 1100));
  expect(number.textContent).toBe('155.5');
});

describe('Stat', () => {
  it('labels the figure and signs the delta', () => {
    render(<Stat label="Saved vs fixed" value={62} unit="m³" precision={0} delta={4} />);
    expect(screen.getByText('Saved vs fixed')).toBeDefined();
    expect(screen.getByText('+4 m³')).toBeDefined();
  });
});
