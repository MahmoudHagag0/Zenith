import { Prisma } from '@zenith/database';
import { EmaCalculator } from './ema.calculator';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

function point(close: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(close),
    high: new Prisma.Decimal(close),
    low: new Prisma.Decimal(close),
    close: new Prisma.Decimal(close),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

describe('EmaCalculator', () => {
  const calculator = new EmaCalculator();

  it('computes a hand-verified EMA(2) series (multiplier 2/3)', () => {
    // seed = avg(10,11) = 10.5
    // ema2 = (12-10.5)*2/3+10.5 = 11.5
    // ema3 = (11-11.5)*2/3+11.5 = 11.166666...7
    const points = [10, 11, 12, 11].map((c, i) => point(c, i));
    const result = calculator.compute(points, { period: 2 });

    const values = result.series.map((e) => e.value.toNumber());
    expect(values[0]).toBeCloseTo(10.5, 6);
    expect(values[1]).toBeCloseTo(11.5, 6);
    expect(values[2]).toBeCloseTo(11.166667, 5);
    expect(result.series[0].timestamp).toEqual(points[1].timestamp);
  });

  it('rejects when there are fewer points than the period', () => {
    const points = [10].map((c, i) => point(c, i));
    expect(() => calculator.compute(points, { period: 2 })).toThrow(ComputationRejectedError);
  });

  it('includes computation metadata and computationVersion', () => {
    const points = [10, 11, 12].map((c, i) => point(c, i));
    const result = calculator.compute(points, { period: 2 });
    expect(result.metadata.computation).toBe('EMA');
    expect(result.metadata.computationVersion).toBe('1.0.0');
  });
});
