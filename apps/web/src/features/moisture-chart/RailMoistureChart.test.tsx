import type { SensorSeries } from '@saqi/shared';
import { farm07 } from '@saqi/shared';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RailMoistureChart } from './RailMoistureChart';

const HOUR = 3_600_000;
const end = Date.parse('2026-10-23T17:00:00Z');
const series = (sensorId: string, depthCm: number, hours: number, skipLast = 0): SensorSeries => {
  const points = Array.from({ length: hours - skipLast }, (_, i) => ({
    t: new Date(end - (hours - 1 - i) * HOUR).toISOString(),
    paw: 70,
  }));
  return { sensorId, depthCm, stale: skipLast > 3, lastAt: points.at(-1)?.t ?? '', points };
};

describe('RailMoistureChart', () => {
  const sensors = farm07.sensors.filter((s) => s.blockId === 'D-3');

  it('says which sensor went stale, and when, alongside water now', () => {
    render(
      <RailMoistureChart
        blockId="D-3"
        series={[series('D-3-30', 30, 72), series('D-3-60', 60, 72, 9)]}
        sensors={sensors}
        threshold={65}
        target={90}
        events={[]}
      />,
    );
    const chart = screen.getByRole('img');
    expect(chart.getAttribute('aria-label')).toMatch(/^D-3 plant-available water .*now 70\.0%/);
    // The 60 cm sensor last reported 9 hours before 21:00 GST.
    expect(chart.getAttribute('aria-label')).toContain('60 cm sensor stale since 12:00 GST');
  });

  it('says there are no readings rather than drawing a line', () => {
    render(
      <RailMoistureChart
        blockId="D-3"
        series={[]}
        sensors={sensors}
        threshold={65}
        target={90}
        events={[]}
      />,
    );
    expect(
      screen.getByRole('img', {
        name: 'D-3: no sensor readings in the last 14 days. Threshold 65%, target 90%.',
      }),
    ).toBeDefined();
  });
});
