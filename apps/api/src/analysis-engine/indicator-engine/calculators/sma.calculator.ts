import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ComputationOutput, IndicatorCalculator, IndicatorSeriesEntry, SmaParams } from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';

/** Simple Moving Average — no single named creator; generic TA convention. */
export class SmaCalculator implements IndicatorCalculator<SmaParams, Prisma.Decimal> {
  readonly name = 'SMA';

  compute(points: readonly MarketSeriesPoint[], params: SmaParams): ComputationOutput<Prisma.Decimal> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('SMA', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period) {
      throw new ComputationRejectedError('SMA', `requires at least ${period} points, received ${points.length}`);
    }

    const series: IndicatorSeriesEntry<Prisma.Decimal>[] = [];
    for (let i = period - 1; i < points.length; i++) {
      let sum = new Prisma.Decimal(0);
      for (let j = i - period + 1; j <= i; j++) sum = sum.plus(points[j].close);
      series.push({ timestamp: points[i].timestamp, value: sum.div(period) });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'SMA',
        parameters: { period },
        formula: 'Arithmetic mean of the last `period` closing prices.',
        source: 'Generic technical-analysis convention (no single named creator).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
