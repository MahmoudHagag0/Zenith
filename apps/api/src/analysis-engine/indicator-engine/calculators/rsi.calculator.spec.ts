import { Prisma } from '@zenith/database';
import { RsiCalculator } from './rsi.calculator';
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
 * SOURCING DISCLOSURE (per S1-007 Sprint Brief, "Golden-Dataset /
 * Reference-Dataset Conformance Testing"): J. Welles Wilder Jr.'s original
 * 1978 worked RSI example ("New Concepts in Technical Trading Systems")
 * could not be independently obtained in this implementation environment
 * (no network access to the out-of-print primary text). Per the Brief's
 * disclosed-fallback allowance, conformance is instead verified by (a)
 * implementing Wilder's exact published recursive formula — average
 * gain/loss seeded by a simple average, then smoothed with an alpha =
 * 1/period constant (NOT a plain EMA's 2/(period+1)) — and (b) a fully
 * hand-traced manual calculation, shown step-by-step below, over a small
 * constructed price series with period=3 for tractability. Wilder's
 * formula is period-agnostic; using period=3 exercises the identical
 * algorithm as the standard period=14, at a scale verifiable by hand.
 *
 * Hand trace (closes = [44, 44.5, 43.5, 44.5, 46, 45.5, 46.5], period=3):
 *   changes:  +0.5   -1.0   +1.0   +1.5   -0.5   +1.0
 *   gains:     0.5    0      1.0    1.5    0      1.0
 *   losses:    0      1.0    0      0      0.5    0
 *   seed avgGain = (0.5+0+1.0)/3 = 0.5;  seed avgLoss = (0+1.0+0)/3 = 1/3
 *   RSI@idx3 = 100 - 100/(1+0.5/(1/3)) = 100 - 100/2.5 = 60
 *   avgGain@4 = (0.5*2+1.5)/3 = 2.5/3;   avgLoss@4 = ((1/3)*2+0)/3 = 2/9
 *   RSI@idx4 = 100 - 100/(1+3.75) = 1500/19 = 78.947368...
 *   avgGain@5 = (2.5/3*2+0)/3 = 5/9;     avgLoss@5 = (2/9*2+0.5)/3 = 8.5/27
 *   RSI@idx5 = 100 - 100/(1+15/8.5) = 3000/47 = 63.829787...
 *   avgGain@6 = (5/9*2+1.0)/3 = 19/27;   avgLoss@6 = (8.5/27*2+0)/3 = 17/81
 *   RSI@idx6 = 100 - 100/(1+57/17) = 2850/37 = 77.027027...
 */
describe('RsiCalculator', () => {
  const calculator = new RsiCalculator();
  const closes = [44, 44.5, 43.5, 44.5, 46, 45.5, 46.5];
  const points = closes.map((c, i) => point(c, i));

  it('reproduces the hand-traced Wilder RSI(3) values exactly', () => {
    const result = calculator.compute(points, { period: 3 });
    const values = result.series.map((e) => e.value.toNumber());

    expect(values[0]).toBeCloseTo(60, 9);
    expect(values[1]).toBeCloseTo(1500 / 19, 9);
    expect(values[2]).toBeCloseTo(3000 / 47, 9);
    expect(values[3]).toBeCloseTo(2850 / 37, 9);
    expect(result.series).toHaveLength(4);
    expect(result.series[0].timestamp).toEqual(points[3].timestamp);
  });

  it('returns 100 when avgLoss is zero (all gains, no losses)', () => {
    const allUp = [10, 11, 12, 13, 14].map((c, i) => point(c, i));
    const result = calculator.compute(allUp, { period: 3 });
    expect(result.series[0].value.toNumber()).toBe(100);
  });

  it('returns 0 when avgGain is zero (all losses, no gains)', () => {
    const allDown = [14, 13, 12, 11, 10].map((c, i) => point(c, i));
    const result = calculator.compute(allDown, { period: 3 });
    expect(result.series[0].value.toNumber()).toBe(0);
  });

  it('rejects when there are fewer than period+1 points', () => {
    const tooFew = [44, 44.5, 43.5].map((c, i) => point(c, i));
    expect(() => calculator.compute(tooFew, { period: 3 })).toThrow(ComputationRejectedError);
  });

  it('cites Wilder (1978) as the source and includes computationVersion', () => {
    const result = calculator.compute(points, { period: 3 });
    expect(result.metadata.source).toContain('Wilder');
    expect(result.metadata.source).toContain('1978');
    expect(result.metadata.computationVersion).toBe('1.0.0');
    expect(result.metadata.intermediateValues).toBeDefined();
  });
});
