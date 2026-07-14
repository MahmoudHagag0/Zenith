import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ComputationOutput, EmaParams, IndicatorCalculator } from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';

/**
 * Exponential Moving Average, seeded with a Simple Moving Average of the
 * first `period` closes — the standard, universally-implemented
 * convention (no single named creator for the seeding technique).
 */
export class EmaCalculator implements IndicatorCalculator<EmaParams, Prisma.Decimal> {
  readonly name = 'EMA';

  compute(points: readonly MarketSeriesPoint[], params: EmaParams): ComputationOutput<Prisma.Decimal> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('EMA', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period) {
      throw new ComputationRejectedError('EMA', `requires at least ${period} points, received ${points.length}`);
    }

    const series = EmaCalculator.computeSeries(
      points.map((p) => p.close),
      period,
    ).map((value, i) => ({ timestamp: points[period - 1 + i].timestamp, value }));

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'EMA',
        parameters: { period },
        formula: 'EMA seeded by SMA(period); multiplier = 2/(period+1).',
        source: 'Generic technical-analysis convention (no single named creator).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }

  /** Reusable EMA-of-values computation, shared with MacdCalculator's signal line. */
  static computeSeries(values: readonly Prisma.Decimal[], period: number): Prisma.Decimal[] {
    const multiplier = new Prisma.Decimal(2).div(period + 1);
    let seedSum = new Prisma.Decimal(0);
    for (let i = 0; i < period; i++) seedSum = seedSum.plus(values[i]);
    let ema = seedSum.div(period);
    const series: Prisma.Decimal[] = [ema];
    for (let i = period; i < values.length; i++) {
      ema = values[i].minus(ema).times(multiplier).plus(ema);
      series.push(ema);
    }
    return series;
  }
}
