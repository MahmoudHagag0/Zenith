import { Prisma } from '@zenith/database';
import { DonchianChannelCalculator } from './donchian-channel.calculator';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

function bar(high: number, low: number, dayOffset: number): MarketSeriesPoint {
  const close = (high + low) / 2;
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
 * Hand trace (period=3):
 *   bars (h,l): (10,8) (12,9) (11,8) (13,10) (9,7) (14,11)
 *   window[0..2]: max(h)=12, min(l)=8 -> upper=12, lower=8, middle=10
 *   window[1..3]: max(h)=13, min(l)=8 -> upper=13, lower=8, middle=10.5
 *   window[2..4]: max(h)=13, min(l)=7 -> upper=13, lower=7, middle=10
 *   window[3..5]: max(h)=14, min(l)=7 -> upper=14, lower=7, middle=10.5
 */
describe('DonchianChannelCalculator', () => {
  const calculator = new DonchianChannelCalculator();
  const points = [bar(10, 8, 0), bar(12, 9, 1), bar(11, 8, 2), bar(13, 10, 3), bar(9, 7, 4), bar(14, 11, 5)];

  it('reproduces the hand-traced upper/lower/middle channel values', () => {
    const result = calculator.compute(points, { period: 3 });
    const expected = [
      { upper: 12, lower: 8, middle: 10 },
      { upper: 13, lower: 8, middle: 10.5 },
      { upper: 13, lower: 7, middle: 10 },
      { upper: 14, lower: 7, middle: 10.5 },
    ];
    result.series.forEach((entry, i) => {
      expect(entry.value.upper.toNumber()).toBe(expected[i].upper);
      expect(entry.value.lower.toNumber()).toBe(expected[i].lower);
      expect(entry.value.middle.toNumber()).toBe(expected[i].middle);
    });
  });

  it('rejects when there are fewer points than the period', () => {
    expect(() => calculator.compute(points.slice(0, 2), { period: 3 })).toThrow(ComputationRejectedError);
  });

  it('cites Donchian and the Turtle Traders as sources', () => {
    const result = calculator.compute(points, { period: 3 });
    expect(result.metadata.source).toContain('Donchian');
    expect(result.metadata.source).toContain('Turtle');
  });
});
