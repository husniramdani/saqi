import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonClasses } from './Button';

describe('Button', () => {
  it('is a real button that defaults to type="button"', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Open cockpit</Button>);
    const button = screen.getByRole('button', { name: 'Open cockpit' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps its label (and width) while loading, but blocks clicks', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('ends an arrow pill with a decorative arrow', () => {
    const { container } = render(<Button arrow>See tonight’s plan</Button>);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gives field buttons the 56 px target', () => {
    expect(buttonClasses({ size: 'field' })).toContain('min-h-14');
    expect(buttonClasses({ variant: 'accent' })).toContain('bg-accent');
  });
});
