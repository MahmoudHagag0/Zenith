import { Prisma } from '@zenith/database';
import { AdxCalculator } from './adx.calculator';
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
 * SOURCING DISCLOSURE (per S1-007 Sprint Brief): as with RSI/ATR, Wilder's
 * original 1978 worked ADX example could not be independently obtained in
 * this environment. Conformance is verified by implementing Wilder's
 * exact published rules and a full hand trace below (period=3, the
 * minimum tractable by hand — the algorithm is period-agnostic).
 *
 * Hand trace (bars h,l,c; i0=(50,48,49) i1=(51,49,50) i2=(50,47,48)
 * i3=(52,48,51) i4=(53,50,52) i5=(52,49,50)):
 *   +DM(i=1..5) = [1, 0, 2, 1, 0];  -DM(i=1..5) = [0, 2, 0, 0, 1]
 *   TR(i=1..5)  = [2, 3, 4, 3, 3]
 *   seed avg+DM = (1+0+2)/3=1; avg-DM=(0+2+0)/3=2/3; avgTR=(2+3+4)/3=3
 *   +DI@idx3=100/3=33.3333; -DI@idx3=100*(2/3)/3=200/9=22.2222
 *   DX@idx3 = 100*|100/3-200/9|/(100/3+200/9) = 100*(100/9)/(500/9) = 20
 *   avg+DM@4=(1*2+1)/3=1; avg-DM@4=(2/3*2+0)/3=4/9; avgTR@4=(3*2+3)/3=3
 *   +DI@idx4=100/3=33.3333; -DI@idx4=100*(4/9)/3=400/27=14.8148
 *   DX@idx4 = 100*(500/27)/(1300/27) = 50000/1300 = 38.461538
 *   avg+DM@5=(1*2+0)/3=2/3; avg-DM@5=(4/9*2+1)/3=17/27; avgTR@5=(3*2+3)/3=3
 *   +DI@idx5=100*(2/3)/3=200/9=22.2222; -DI@idx5=100*(17/27)/3=1700/81=20.9877
 *   DX@idx5 = 100*(100/81)/(3500/81) = 10000/3500 = 20/7 = 2.857143
 *   ADX@idx5 (seed) = avg(20, 500/13, 20/7) = 1860/91 = 20.439560
 */
describe('AdxCalculator', () => {
  const calculator = new AdxCalculator();
  const points = [
    bar(50, 48, 49, 0),
    bar(51, 49, 50, 1),
    bar(50, 47, 48, 2),
    bar(52, 48, 51, 3),
    bar(53, 50, 52, 4),
    bar(52, 49, 50, 5),
  ];

  it('reproduces the hand-traced Wilder ADX(3)/+DI/-DI values exactly', () => {
    const result = calculator.compute(points, { period: 3 });
    expect(result.series).toHaveLength(1);

    const entry = result.series[0];
    expect(entry.timestamp).toEqual(points[5].timestamp);
    expect(entry.value.adx.toNumber()).toBeCloseTo(1860 / 91, 6);
    expect(entry.value.plusDI.toNumber()).toBeCloseTo(200 / 9, 6);
    expect(entry.value.minusDI.toNumber()).toBeCloseTo(1700 / 81, 6);
  });

  it('rejects when there are fewer than 2*period points', () => {
    expect(() => calculator.compute(points.slice(0, 5), { period: 3 })).toThrow(ComputationRejectedError);
  });

  it('cites Wilder (1978) as the source and includes computationVersion', () => {
    const result = calculator.compute(points, { period: 3 });
    expect(result.metadata.source).toContain('Wilder');
    expect(result.metadata.computationVersion).toBe('1.0.0');
  });
});
