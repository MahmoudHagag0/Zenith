import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ComputationOutput, IndicatorCalculator, IndicatorSeriesEntry, RsiParams } from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';
const HUNDRED = new Prisma.Decimal(100);
const ZERO = new Prisma.Decimal(0);

/**
 * Relative Strength Index — J. Welles Wilder Jr., "New Concepts in
 * Technical Trading Systems" (1978).
 *
 * Uses Wilder's own recursive smoothing (average gain/loss seeded by a
 * simple average of the first `period` changes, then smoothed by
 * `avg[i] = (avg[i-1]*(period-1) + new[i]) / period`) — this is
 * deliberately NOT a plain EMA/SMA approximation, which is the most
 * common documented implementation error for this indicator (a plain EMA
 * uses multiplier 2/(period+1); Wilder's method is equivalent to an
 * alpha = 1/period smoothing constant, a materially different value).
 */
export class RsiCalculator implements IndicatorCalculator<RsiParams, Prisma.Decimal> {
  readonly name = 'RSI';

  compute(points: readonly MarketSeriesPoint[], params: RsiParams): ComputationOutput<Prisma.Decimal> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('RSI', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period + 1) {
      throw new ComputationRejectedError('RSI', `requires at least ${period + 1} points, received ${points.length}`);
    }

    const gains: Prisma.Decimal[] = [];
    const losses: Prisma.Decimal[] = [];
    for (let i = 1; i < points.length; i++) {
      const change = points[i].close.minus(points[i - 1].close);
      gains.push(change.greaterThan(ZERO) ? change : ZERO);
      losses.push(change.lessThan(ZERO) ? change.abs() : ZERO);
    }

    const rsiFrom = (avgGain: Prisma.Decimal, avgLoss: Prisma.Decimal): Prisma.Decimal => {
      if (avgLoss.equals(ZERO)) return HUNDRED;
      if (avgGain.equals(ZERO)) return ZERO;
      const rs = avgGain.div(avgLoss);
      return HUNDRED.minus(HUNDRED.div(rs.plus(1)));
    };

    let avgGain = gains.slice(0, period).reduce((sum, g) => sum.plus(g), ZERO).div(period);
    let avgLoss = losses.slice(0, period).reduce((sum, l) => sum.plus(l), ZERO).div(period);

    const series: IndicatorSeriesEntry<Prisma.Decimal>[] = [
      { timestamp: points[period].timestamp, value: rsiFrom(avgGain, avgLoss) },
    ];

    for (let i = period; i < gains.length; i++) {
      avgGain = avgGain.times(period - 1).plus(gains[i]).div(period);
      avgLoss = avgLoss.times(period - 1).plus(losses[i]).div(period);
      series.push({ timestamp: points[i + 1].timestamp, value: rsiFrom(avgGain, avgLoss) });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'RSI',
        parameters: { period },
        formula:
          "Wilder's RSI: avgGain/avgLoss seeded by a simple average of the first `period` changes, then smoothed by avg[i] = (avg[i-1]*(period-1)+new[i])/period; RSI = 100 - 100/(1+avgGain/avgLoss).",
        source: 'J. Welles Wilder Jr., "New Concepts in Technical Trading Systems" (1978).',
        points,
        computationVersion: COMPUTATION_VERSION,
        intermediateValues: { finalAvgGain: avgGain.toString(), finalAvgLoss: avgLoss.toString() },
      }),
    };
  }
}
