import type { Budget, BlockDecision } from '@saqi/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { scenarioDecisions } from '@/features/farm-map/scenario';
import { BUDGET_CHIP, BudgetSection } from './BudgetSection';

const budget = (patch: Partial<Budget> = {}): Budget => ({
  month: '2026-10',
  allocationM3: 7050,
  usedM3: 5800,
  projectedM3: 7190,
  projectedAfterPlanM3: 6909,
  status: 'tight',
  deficitBlocks: ['F-1'],
  ...patch,
});
const withDeficit: BlockDecision[] = scenarioDecisions.map((d) =>
  d.blockId === 'F-1'
    ? { ...d, reasons: [{ code: 'BUDGET_DEFICIT', params: { factor: 0.7 } }] }
    : d,
);

describe('BudgetSection', () => {
  it.each([
    ['ok', 'ok'],
    ['tight', 'warn'],
    ['over', 'error'],
  ] as const)('maps %s to a %s chip', (status, chip) => {
    expect(BUDGET_CHIP[status]).toBe(chip);
  });

  it('shows the projected share against the allocation and the 97 % line', () => {
    render(<BudgetSection budget={budget()} decisions={withDeficit} />);
    expect(screen.getByText('Budget · October')).toBeDefined();
    expect(screen.getByText('Tight')).toBeDefined();
    expect(
      screen.getByRole('meter', { name: 'Projected 98 percent of the monthly allocation' }),
    ).toBeDefined();
    expect(screen.getByText('6,909 / 7,050 m³')).toBeDefined();
  });

  it('explains the cut: how far over, which blocks, at what share', () => {
    render(<BudgetSection budget={budget()} decisions={withDeficit} />);
    expect(
      screen.getByText(
        'The month was heading 2% over, so one block is cut tonight to a share of the usual volume: F-1 70%. Greenhouses are never cut.',
      ),
    ).toBeDefined();
  });

  it('gives each cut block its own share (tiers are cut by different factors)', () => {
    const twoTiers = withDeficit.map((d) =>
      d.blockId === 'D-1'
        ? { ...d, reasons: [{ code: 'BUDGET_DEFICIT' as const, params: { factor: 0.85 } }] }
        : d,
    );
    render(<BudgetSection budget={budget()} decisions={twoTiers} />);
    expect(screen.getByText(/2 blocks are cut tonight .*: D-1 85% and F-1 70%\./)).toBeDefined();
  });

  it('keeps a small overshoot visible instead of rounding it to "0% over"', () => {
    render(<BudgetSection budget={budget({ projectedM3: 7080 })} decisions={withDeficit} />);
    expect(screen.getByText(/heading 0\.4% over/)).toBeDefined();
  });

  it('says nothing about cuts when there are none', () => {
    const { container } = render(
      <BudgetSection
        budget={budget({ status: 'ok', deficitBlocks: [] })}
        decisions={scenarioDecisions}
      />,
    );
    expect(container.textContent).not.toContain('heading');
  });
});
