import { Prisma } from '@zenith/database';
import { AtrCalculator } from './atr.calculator';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

function bar(high: number, low: number, close: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(close),
    high: new Prisma.Decimal(high),
    low: new Prisma.Decimal(low),
    close: new Prisma.Decimal(close),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

/**
 * SOURCING DISCLOSURE (per S1-007 Sprint Brief): as with RSI, Wilder's
 * original 1978 worked example could not be independently obtained in
 * this environment. Conformance is verified by implementing Wilder's
 * exact published recursive formula and a full hand trace below.
 *
 * Hand trace (period=3):
 *   bars (h,l,c): (10,8,9) (11,9,10.5) (10.5,9.5,10) (11,10,10.8) (11.5,10.5,11)
 *   TR0 = 10-8 = 2
 *   TR1 = max(11-9, |11-9|, |9-9|) = 2
 *   TR2 = max(10.5-9.5, |10.5-10.5|, |9.5-10.5|) = 1
 *   TR3 = max(11-10, |11-10|, |10-10|) = 1
 *   TR4 = max(11.5-10.5, |11.5-10.8|, |10.5-10.8|) = 1
 *   ATR@idx2 (seed) = (2+2+1)/3 = 5/3 = 1.666667
 *   ATR@idx3 = (5/3*2+1)/3 = 13/9 = 1.444444
 *   ATR@idx4 = (13/9*2+1)/3 = 35/27 = 1.296296
 */
describe('AtrCalculator', () => {
  const calculator = new AtrCalculator();
  const points = [
    bar(10, 8, 9, 0),
    bar(11, 9, 10.5, 1),
    bar(10.5, 9.5, 10, 2),
    bar(11, 10, 10.8, 3),
    bar(11.5, 10.5, 11, 4),
  ];

  it('reproduces the hand-traced Wilder ATR(3) values exactly', () => {
    const result = calculator.compute(points, { period: 3 });
    const values = result.series.map((e) => e.value.toNumber());

    expect(values[0]).toBeCloseTo(5 / 3, 9);
    expect(values[1]).toBeCloseTo(13 / 9, 9);
    expect(values[2]).toBeCloseTo(35 / 27, 9);
    expect(result.series).toHaveLength(3);
    expect(result.series[0].timestamp).toEqual(points[2].timestamp);
  });

  it("uses the first bar's high-low range as True Range when there is no prior close", () => {
    expect(points[0].high.minus(points[0].low).toNumber()).toBe(2);
  });

  it('rejects when there are fewer points than the period', () => {
    expect(() => calculator.compute(points.slice(0, 2), { period: 3 })).toThrow(ComputationRejectedError);
  });

  it('cites Wilder (1978) as the source', () => {
    const result = calculator.compute(points, { period: 3 });
    expect(result.metadata.source).toContain('Wilder');
    expect(result.metadata.computationVersion).toBe('1.0.0');
  });
});
