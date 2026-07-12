import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { AtrParams, ComputationOutput, IndicatorCalculator, IndicatorSeriesEntry } from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';

/** True Range at index i (i=0 has no prior close: TR = high - low). */
function trueRangeAt(points: readonly MarketSeriesPoint[], i: number): Prisma.Decimal {
  if (i === 0) return points[0].high.minus(points[0].low);
  const prevClose = points[i - 1].close;
  return Prisma.Decimal.max(
    points[i].high.minus(points[i].low),
    points[i].high.minus(prevClose).abs(),
    points[i].low.minus(prevClose).abs(),
  );
}

/**
 * Average True Range — J. Welles Wilder Jr., "New Concepts in Technical
 * Trading Systems" (1978). Uses the same Wilder recursive smoothing as
 * RSI: seeded by a simple average of the first `period` True Range
 * values, then smoothed by avg[i] = (avg[i-1]*(period-1)+TR[i])/period.
 */
export class AtrCalculator implements IndicatorCalculator<AtrParams, Prisma.Decimal> {
  readonly name = 'ATR';

  compute(points: readonly MarketSeriesPoint[], params: AtrParams): ComputationOutput<Prisma.Decimal> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('ATR', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period) {
      throw new ComputationRejectedError('ATR', `requires at least ${period} points, received ${points.length}`);
    }

    const trueRanges: Prisma.Decimal[] = points.map((_, i) => trueRangeAt(points, i));

    let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum.plus(tr), new Prisma.Decimal(0)).div(period);
    const series: IndicatorSeriesEntry<Prisma.Decimal>[] = [{ timestamp: points[period - 1].timestamp, value: atr }];

    for (let i = period; i < points.length; i++) {
      atr = atr.times(period - 1).plus(trueRanges[i]).div(period);
      series.push({ timestamp: points[i].timestamp, value: atr });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'ATR',
        parameters: { period },
        formula:
          'True Range = max(high-low, |high-prevClose|, |low-prevClose|); ATR seeded by a simple average of the first `period` True Range values, then Wilder-smoothed: atr[i] = (atr[i-1]*(period-1)+TR[i])/period.',
        source: 'J. Welles Wilder Jr., "New Concepts in Technical Trading Systems" (1978).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}

export { trueRangeAt };
