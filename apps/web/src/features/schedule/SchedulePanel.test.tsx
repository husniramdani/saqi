import { farm07, type DayPlan } from '@saqi/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { scenarioDecisions, scenarioSchedule } from '@/features/farm-map/scenario';
import { SchedulePanel } from './SchedulePanel';

const plan = (schedule = scenarioSchedule): DayPlan => ({
  date: '2026-10-23',
  generatedAt: '2026-10-23T17:00:00.000Z',
  decisions: scenarioDecisions,
  schedule,
  budget: {
    month: '2026-10',
    allocationM3: 7050,
    usedM3: 6000,
    projectedM3: 7200,
    projectedAfterPlanM3: 6900,
    status: 'tight',
    deficitBlocks: ['F-1'],
  },
  totals: { tonightM3: 245.9, pulsesM3: 7.5, savedVsFixedM3: 62 },
});

describe('SchedulePanel', () => {
  it('draws one row per night run, each a full-row button to its block', () => {
    const onSelect = vi.fn();
    render(<SchedulePanel plan={plan()} farm={farm07} onSelect={onSelect} />);
    const d1 = screen.getByRole('button', { name: /^D-1, 22:00 → 01:01 GST, ?90\.4/ });
    expect(screen.getByRole('button', { name: /^F-1, 01:01 → 04:28 GST/ })).toBeDefined();
    fireEvent.click(d1);
    expect(onSelect).toHaveBeenCalledWith('D-1');
  });

  it('positions bars from the start edge as shares of the night', () => {
    const { container } = render(<SchedulePanel plan={plan()} farm={farm07} onSelect={vi.fn()} />);
    const bars = container.querySelectorAll<HTMLElement>('[data-schedule-bar]');
    expect(bars[0]?.style.insetInlineStart).toBe('0%');
    expect(parseFloat(bars[0]?.style.inlineSize ?? '')).toBeCloseTo(43.1, 1);
  });

  it('marks a budget-cut run as deficit on its bar', () => {
    const { container } = render(<SchedulePanel plan={plan()} farm={farm07} onSelect={vi.fn()} />);
    const bars = container.querySelectorAll<HTMLElement>('[data-schedule-bar]');
    expect(bars[0]?.textContent).toBe('22:00 → 01:01');
    expect(bars[1]?.textContent).toBe('01:01 → 04:28 · deficit');
  });

  it('says what a dry night saves when nothing is scheduled', () => {
    render(<SchedulePanel plan={plan([])} farm={farm07} onSelect={vi.fn()} />);
    expect(screen.getByText('No irrigation needed tonight.')).toBeDefined();
    expect(screen.getByText('Saves 62 m³ against a fixed schedule.')).toBeDefined();
  });
});
