import { Prisma } from '@zenith/database';
import { MacdCalculator } from './macd.calculator';
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
 * Known-reference-example disclosure (per Sprint Brief Acceptance
 * Criteria — MACD requires "a known reference example," not a mandatory
 * primary-source worked example as RSI/ATR/ADX do): fast=2/slow=4/signal=2
 * are used instead of Appel's standard 12/26/9 defaults purely for
 * hand-traceability at a size verifiable by manual arithmetic; the
 * formula itself (EMA difference; EMA-of-difference signal) is
 * period-agnostic and identical to the 12/26/9 case.
 *
 * Hand trace (closes=[10,11,12,11,13,14,13,15]):
 *   fastEma(2): 10.5, 11.5, 11.166667, 12.388889, 13.462963, 13.154321, 14.384774 (idx1..7)
 *   slowEma(4): 11, 11.8, 12.68, 12.808, 13.6848 (idx3..7)
 *   line = fastEma[i+2]-slowEma[i]: idx3=0.166667, idx4=0.588889,
 *          idx5=0.782963, idx6=0.346321, idx7=0.699974
 *   signal=EMA(line,2): idx4=0.377778, idx5=0.647901, idx6=0.446848, idx7=0.615599
 *   histogram=line-signal: idx4=0.211111, idx5=0.135062, idx6=-0.100527, idx7=0.084375
 */
describe('MacdCalculator', () => {
  const calculator = new MacdCalculator();
  const closes = [10, 11, 12, 11, 13, 14, 13, 15];
  const points = closes.map((c, i) => point(c, i));

  it('reproduces the hand-traced line/signal/histogram values', () => {
    const result = calculator.compute(points, { fastPeriod: 2, slowPeriod: 4, signalPeriod: 2 });
    expect(result.series).toHaveLength(4);
    expect(result.series[0].timestamp).toEqual(points[4].timestamp);

    const expected = [
      { line: 0.588889, signal: 0.377778, histogram: 0.211111 },
      { line: 0.782963, signal: 0.647901, histogram: 0.135062 },
      { line: 0.346321, signal: 0.446848, histogram: -0.100527 },
      { line: 0.699974, signal: 0.615599, histogram: 0.084375 },
    ];

    result.series.forEach((entry, i) => {
      expect(entry.value.line.toNumber()).toBeCloseTo(expected[i].line, 4);
      expect(entry.value.signal.toNumber()).toBeCloseTo(expected[i].signal, 4);
      expect(entry.value.histogram.toNumber()).toBeCloseTo(expected[i].histogram, 4);
    });
  });

  it('always satisfies histogram = line - signal', () => {
    const result = calculator.compute(points, { fastPeriod: 2, slowPeriod: 4, signalPeriod: 2 });
    for (const entry of result.series) {
      expect(entry.value.histogram.toNumber()).toBeCloseTo(entry.value.line.minus(entry.value.signal).toNumber(), 9);
    }
  });

  it('rejects when fastPeriod is not less than slowPeriod', () => {
    expect(() => calculator.compute(points, { fastPeriod: 4, slowPeriod: 4, signalPeriod: 2 })).toThrow(
      ComputationRejectedError,
    );
  });

  it('rejects when there are too few points', () => {
    expect(() => calculator.compute(points.slice(0, 3), { fastPeriod: 2, slowPeriod: 4, signalPeriod: 2 })).toThrow(
      ComputationRejectedError,
    );
  });

  it('attributes the line to Appel and the histogram to Aspray (1986) distinctly', () => {
    const result = calculator.compute(points, { fastPeriod: 2, slowPeriod: 4, signalPeriod: 2 });
    expect(result.metadata.source).toContain('Appel');
    expect(result.metadata.source).toContain('Aspray');
    expect(result.metadata.source).toContain('1986');
  });
});
