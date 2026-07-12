import { Prisma } from '@zenith/database';
import { SmaCalculator } from './sma.calculator';
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

describe('SmaCalculator', () => {
  const calculator = new SmaCalculator();

  it('computes a hand-verified SMA(3) series', () => {
    const points = [10, 12, 11, 13, 12, 14].map((c, i) => point(c, i));
    const result = calculator.compute(points, { period: 3 });

    // window [10,12,11]=11; [12,11,13]=12; [11,13,12]=12; [13,12,14]=13
    const values = result.series.map((e) => e.value.toNumber());
    expect(values).toEqual([11, 12, 12, 13]);
    expect(result.series).toHaveLength(4);
    expect(result.series[0].timestamp).toEqual(points[2].timestamp);
  });

  it('rejects when there are fewer points than the period', () => {
    const points = [10, 12].map((c, i) => point(c, i));
    expect(() => calculator.compute(points, { period: 3 })).toThrow(ComputationRejectedError);
  });

  it('rejects a non-positive or non-integer period', () => {
    const points = [10, 12, 14].map((c, i) => point(c, i));
    expect(() => calculator.compute(points, { period: 0 })).toThrow(ComputationRejectedError);
    expect(() => calculator.compute(points, { period: 2.5 })).toThrow(ComputationRejectedError);
  });

  it('includes computation metadata and computationVersion on every output', () => {
    const points = [10, 12, 14].map((c, i) => point(c, i));
    const result = calculator.compute(points, { period: 3 });
    expect(result.metadata.computation).toBe('SMA');
    expect(result.metadata.parameters).toEqual({ period: 3 });
    expect(result.metadata.computationVersion).toBe('1.0.0');
    expect(result.metadata.source).toBeTruthy();
  });
});
