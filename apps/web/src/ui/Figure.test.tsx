import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { Figure, Stat } from './Figure';

afterEach(() => act(() => setLocale('en')));

describe('Figure', () => {
  it('sets the value at its precision with the unit beside it', () => {
    render(<Figure value={90.43} unit="m³" />);
    const figure = screen.getByText('90.4', { exact: false });
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
    const figure = screen.getByText('245.9', { exact: false });
    expect(figure.className).toContain('text-accent-text');
    expect(figure.className.split(' ')).not.toContain('text-accent');
  });
});

describe('Stat', () => {
  it('labels the figure and signs the delta', () => {
    render(<Stat label="Saved vs fixed" value={62} unit="m³" precision={0} delta={4} />);
    expect(screen.getByText('Saved vs fixed')).toBeDefined();
    expect(screen.getByText('+4 m³')).toBeDefined();
  });
});
