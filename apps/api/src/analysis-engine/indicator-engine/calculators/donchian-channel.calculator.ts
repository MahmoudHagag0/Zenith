import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type {
  ComputationOutput,
  DonchianChannelParams,
  DonchianChannelValue,
  IndicatorCalculator,
  IndicatorSeriesEntry,
} from '../indicator-engine.types';

const COMPUTATION_VERSION = '1.0.0';

/**
 * Donchian Channel — Richard Donchian, developed via his trend-following
 * newsletters in the 1960s; later a core input to the Turtle Traders'
 * systematic breakout rules (Dennis & Eckhardt, 1983-84).
 */
export class DonchianChannelCalculator implements IndicatorCalculator<DonchianChannelParams, DonchianChannelValue> {
  readonly name = 'DonchianChannel';

  compute(points: readonly MarketSeriesPoint[], params: DonchianChannelParams): ComputationOutput<DonchianChannelValue> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('DonchianChannel', `period must be a positive integer, received ${period}`);
    }
    if (points.length < period) {
      throw new ComputationRejectedError('DonchianChannel', `requires at least ${period} points, received ${points.length}`);
    }

    const series: IndicatorSeriesEntry<DonchianChannelValue>[] = [];
    for (let i = period - 1; i < points.length; i++) {
      const window = points.slice(i - period + 1, i + 1);
      const upper = Prisma.Decimal.max(...window.map((p) => p.high));
      const lower = Prisma.Decimal.min(...window.map((p) => p.low));
      series.push({ timestamp: points[i].timestamp, value: { upper, lower, middle: upper.plus(lower).div(2) } });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'DonchianChannel',
        parameters: { period },
        formula: 'upper = max(high) over the last `period` bars; lower = min(low); middle = (upper+lower)/2.',
        source:
          'Richard Donchian (1960s trend-following newsletters); systematized by the Turtle Traders (Dennis & Eckhardt, 1983-84).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
