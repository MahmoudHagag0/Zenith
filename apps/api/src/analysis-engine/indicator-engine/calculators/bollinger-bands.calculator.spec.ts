import { Prisma } from '@zenith/database';
import { BollingerBandsCalculator } from './bollinger-bands.calculator';
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

/**
 * Hand trace (closes=[10,12,11,13,12,14], period=3, multiplier=2):
 *   window[10,12,11]: mean=11, popVariance=((1)^2+(1)^2+0)/3=2/3, stdDev=sqrt(2/3)=0.816497
 *     upper=11+2*0.816497=12.632993, lower=9.367007
 *   window[12,11,13]: mean=12, popVariance=(0+1+1)/3=2/3, stdDev=0.816497
 *     upper=13.632993, lower=10.367007
 *   window[11,13,12]: mean=12, popVariance=(1+1+0)/3=2/3 -> same bands
 *   window[13,12,14]: mean=13, popVariance=(0+1+1)/3=2/3
 *     upper=14.632993, lower=11.367007
 */
describe('BollingerBandsCalculator', () => {
  const calculator = new BollingerBandsCalculator();
  const closes = [10, 12, 11, 13, 12, 14];
  const points = closes.map((c, i) => point(c, i));

  it('reproduces the hand-traced middle/upper/lower band values', () => {
    const result = calculator.compute(points, { period: 3, stdDevMultiplier: 2 });
    const stdDev = Math.sqrt(2 / 3);
    const expectedMeans = [11, 12, 12, 13];

    result.series.forEach((entry, i) => {
      expect(entry.value.middle.toNumber()).toBeCloseTo(expectedMeans[i], 6);
      expect(entry.value.upper.toNumber()).toBeCloseTo(expectedMeans[i] + 2 * stdDev, 6);
      expect(entry.value.lower.toNumber()).toBeCloseTo(expectedMeans[i] - 2 * stdDev, 6);
    });
  });

  it('always keeps the middle band exactly between upper and lower', () => {
    const result = calculator.compute(points, { period: 3, stdDevMultiplier: 2 });
    for (const entry of result.series) {
      const midpoint = entry.value.upper.plus(entry.value.lower).div(2);
      expect(midpoint.toNumber()).toBeCloseTo(entry.value.middle.toNumber(), 9);
    }
  });

  it('rejects when there are fewer points than the period', () => {
    expect(() => calculator.compute(points.slice(0, 2), { period: 3, stdDevMultiplier: 2 })).toThrow(
      ComputationRejectedError,
    );
  });

  it('cites Bollinger (2001) as the source', () => {
    const result = calculator.compute(points, { period: 3, stdDevMultiplier: 2 });
    expect(result.metadata.source).toContain('Bollinger');
  });
});
