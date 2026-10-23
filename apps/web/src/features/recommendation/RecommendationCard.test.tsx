import type { BlockDecision } from '@saqi/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { scenarioSchedule } from '@/features/farm-map/scenario';
import { RecommendationCard } from './RecommendationCard';

// D-1 from the worked example (plan/04 §3), reasons as the engine emits them.
const d1: BlockDecision = {
  blockId: 'D-1',
  decision: 'irrigate',
  pawNow: 68,
  pawProjected: 60.3,
  threshold: 65,
  target: 90,
  et0Mm: 5.8,
  etcMm: 5.5,
  netMm: 21.4,
  grossMm: 25.1,
  volumeM3: 90.4,
  litresPerTree: 750,
  savedVsFixedM3: 0,
  confidence: 'high',
  reasons: [
    { code: 'PAW_NOW', params: { paw: 68 } },
    { code: 'ET0_FORECAST', params: { mm: 5.8 } },
    { code: 'PAW_PROJECTED', params: { from: 68, to: 60.3, etcMm: 5.5 } },
    { code: 'BELOW_THRESHOLD', params: { threshold: 65 } },
    { code: 'REFILL_TO_TARGET', params: { target: 90, netMm: 21.4, grossMm: 25.1 } },
    { code: 'WINDOW_ASSIGNED', params: { start: '22:00', end: '01:01' } },
  ],
};

describe('RecommendationCard', () => {
  it('leads with the decision, the volume, litres per tree and tonight’s window', () => {
    const { container } = render(<RecommendationCard decision={d1} schedule={scenarioSchedule} />);
    expect(screen.getAllByText('Irrigate').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('90.4m³');
    expect(container.textContent).toContain('750L/tree');
    expect(screen.getByText('22:00 → 01:01 GST')).toBeDefined();
  });

  it('explains itself with every reason, in order', () => {
    const { container } = render(<RecommendationCard decision={d1} schedule={scenarioSchedule} />);
    const reasons = [...container.querySelectorAll('[data-reason]')];
    expect(reasons.map((r) => r.getAttribute('data-reason'))).toEqual(
      d1.reasons.map((r) => r.code),
    );
    expect(reasons[3]?.textContent).toBe('Falls below the 65% threshold');
    expect(reasons[2]?.textContent).toBe('Soil water 68% → 60.3% by tomorrow (crop use 5.5 mm)');
  });

  it('flags low confidence', () => {
    render(<RecommendationCard decision={{ ...d1, confidence: 'low' }} schedule={[]} />);
    expect(screen.getByText('Confidence: Low')).toBeDefined();
  });
});
