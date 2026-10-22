import type { SensorSeries } from '@saqi/shared';
import { farm07 } from '@saqi/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MoistureChart } from './MoistureChart';

const HOUR = 3_600_000;
const end = Date.parse('2026-10-23T17:00:00Z');
const series = (sensorId: string, depthCm: number, hours: number, skipLast = 0): SensorSeries => {
  const points = Array.from({ length: hours - skipLast }, (_, i) => ({
    t: new Date(end - (hours - 1 - i) * HOUR).toISOString(),
    paw: 70,
  }));
  return { sensorId, depthCm, stale: skipLast > 3, lastAt: points.at(-1)?.t ?? '', points };
};

describe('MoistureChart', () => {
  const d3 = [series('D-3-30', 30, 72), series('D-3-60', 60, 72, 9)];
  const sensors = farm07.sensors.filter((s) => s.blockId === 'D-3');

  it('is an image with a title and a description of now, threshold and target', () => {
    render(<MoistureChart series={d3} sensors={sensors} threshold={65} target={90} events={[]} />);
    expect(
      screen.getByRole('img', { name: /Plant-available water over the last 14 days/ }),
    ).toBeDefined();
  });

  it('draws the 60 cm line dashed and stops it at its last reading (no line across the gap)', () => {
    const { container } = render(
      <MoistureChart series={d3} sensors={sensors} threshold={65} target={90} events={[]} />,
    );
    const deep = container.querySelector('[data-sensor="D-3-60"]');
    expect(deep?.getAttribute('stroke-dasharray')).toBe('4 3');
    const shallow = container.querySelector('[data-sensor="D-3-30"]');
    // Same start, but the 60 cm path is 9 points shorter: nothing drawn for the silent hours.
    expect((deep?.getAttribute('d')?.match(/L/g) ?? []).length).toBe(
      (shallow?.getAttribute('d')?.match(/L/g) ?? []).length - 9,
    );
  });

  it('places the dashed threshold at 65 % of the plot height', () => {
    const { container } = render(
      <MoistureChart series={d3} sensors={sensors} threshold={65} target={90} events={[]} />,
    );
    const y = Number(container.querySelector('[data-threshold]')?.getAttribute('y1'));
    // Plot spans y 14 (100 %) to 230 (0 %): 65 % sits at 14 + 0.35 × 216.
    expect(y).toBeCloseTo(14 + 0.35 * 216, 5);
  });

  it('keeps a table of daily means for screen readers', () => {
    render(<MoistureChart series={d3} sensors={sensors} threshold={65} target={90} events={[]} />);
    expect(
      screen.getByRole('table', { name: 'Daily mean plant-available water, last 7 days' }),
    ).toBeDefined();
  });
});
