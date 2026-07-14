import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type {
  BollingerBandsParams,
  BollingerBandsValue,
  ComputationOutput,
  IndicatorCalculator,
  IndicatorSeriesEntry,
} from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';

/**
 * Bollinger Bands — John Bollinger, "Bollinger on Bollinger Bands" (2001).
 * Uses population standard deviation (divide by `period`, not
 * `period - 1`) around a Simple Moving Average, Bollinger's own default
 * convention. Per Bollinger's own writing, a band touch is not
 * automatically a reversal signal — this calculator returns the bands
 * only, with no such interpretation attached (interpretation belongs to a
 * future Analysis Provider, ADR-006).
 */
export class BollingerBandsCalculator implements IndicatorCalculator<BollingerBandsParams, BollingerBandsValue> {
  readonly name = 'BollingerBands';

  compute(points: readonly MarketSeriesPoint[], params: BollingerBandsParams): ComputationOutput<BollingerBandsValue> {
    const { period, stdDevMultiplier } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('BollingerBands', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period) {
      throw new ComputationRejectedError('BollingerBands', `requires at least ${period} points, received ${points.length}`);
    }

    const multiplier = new Prisma.Decimal(stdDevMultiplier);
    const series: IndicatorSeriesEntry<BollingerBandsValue>[] = [];

    for (let i = period - 1; i < points.length; i++) {
      const window = points.slice(i - period + 1, i + 1).map((p) => p.close);
      const mean = window.reduce((sum, v) => sum.plus(v), new Prisma.Decimal(0)).div(period);
      const variance = window
        .reduce((sum, v) => sum.plus(v.minus(mean).pow(2)), new Prisma.Decimal(0))
        .div(period);
      const stdDev = variance.sqrt();
      series.push({
        timestamp: points[i].timestamp,
        value: { middle: mean, upper: mean.plus(stdDev.times(multiplier)), lower: mean.minus(stdDev.times(multiplier)) },
      });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'BollingerBands',
        parameters: { period, stdDevMultiplier },
        formula:
          'middle = SMA(period); population stdDev of the same window; upper/lower = middle +/- stdDevMultiplier * stdDev.',
        source: 'John Bollinger, "Bollinger on Bollinger Bands" (2001); bollingerbands.com.',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
