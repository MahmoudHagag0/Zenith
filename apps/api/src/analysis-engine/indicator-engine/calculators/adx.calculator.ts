import { Prisma } from '@zenith/database';
import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { AdxParams, AdxValue, ComputationOutput, IndicatorCalculator, IndicatorSeriesEntry } from '../indicator-engine.types';
import { trueRangeAt } from './atr.calculator';

const COMPUTATION_VERSION = '1.0.0';
const ZERO = new Prisma.Decimal(0);
const HUNDRED = new Prisma.Decimal(100);

/** Wilder's smoothing recurrence, shared by +DM/-DM/TR/DX smoothing. */
function wilderSmooth(seedAverage: Prisma.Decimal, priorAverage: Prisma.Decimal, next: Prisma.Decimal, period: number): Prisma.Decimal {
  return priorAverage.times(period - 1).plus(next).div(period);
}

/**
 * Average Directional Index — J. Welles Wilder Jr., "New Concepts in
 * Technical Trading Systems" (1978).
 *
 * Note on smoothing form: Wilder's original presentation smooths +DM/-DM/TR
 * as running *sums* (sum[i] = sum[i-1] - sum[i-1]/period + new[i]). This
 * implementation instead applies the same Wilder *average* recurrence used
 * for RSI/ATR (avg[i] = (avg[i-1]*(period-1)+new[i])/period) to +DM, -DM,
 * and TR. Given consistent seeding, sum[i] = period * avg[i] at every step
 * (provable by induction), so the +DI/-DI ratio — which divides one
 * smoothed quantity by another — is identical under either form; the
 * `period` scaling factor cancels. This keeps one smoothing implementation
 * shared with RSI/ATR without altering Wilder's published +DI/-DI/ADX
 * values.
 */
export class AdxCalculator implements IndicatorCalculator<AdxParams, AdxValue> {
  readonly name = 'ADX';

  compute(points: readonly MarketSeriesPoint[], params: AdxParams): ComputationOutput<AdxValue> {
    const { period } = params;
    if (!Number.isInteger(period) || period < 1) {
      throw new ComputationRejectedError('ADX', `period must be a positive integer, received ${period}`);
    }
    // `period` DM/TR values seed +DI/-DI; a further `period-1` DI pairs
    // (2*period-1 total DM/TR values, i.e. 2*period points) are needed to
    // produce the `period` DX values that seed ADX itself.
    if (points.length < 2 * period) {
      throw new ComputationRejectedError('ADX', `requires at least ${2 * period} points, received ${points.length}`);
    }

    const plusDM: Prisma.Decimal[] = [];
    const minusDM: Prisma.Decimal[] = [];
    const trueRanges: Prisma.Decimal[] = [];
    for (let i = 1; i < points.length; i++) {
      const upMove = points[i].high.minus(points[i - 1].high);
      const downMove = points[i - 1].low.minus(points[i].low);
      plusDM.push(upMove.greaterThan(ZERO) && upMove.greaterThan(downMove) ? upMove : ZERO);
      minusDM.push(downMove.greaterThan(ZERO) && downMove.greaterThan(upMove) ? downMove : ZERO);
      trueRanges.push(trueRangeAt(points, i));
    }
    // plusDM[k]/minusDM[k]/trueRanges[k] correspond to points[k+1].

    const avg = (values: Prisma.Decimal[]) => values.slice(0, period).reduce((s, v) => s.plus(v), ZERO).div(period);
    let avgPlusDM = avg(plusDM);
    let avgMinusDM = avg(minusDM);
    let avgTR = avg(trueRanges);

    const diPair = (): { plusDI: Prisma.Decimal; minusDI: Prisma.Decimal } => ({
      plusDI: avgTR.equals(ZERO) ? ZERO : HUNDRED.times(avgPlusDM).div(avgTR),
      minusDI: avgTR.equals(ZERO) ? ZERO : HUNDRED.times(avgMinusDM).div(avgTR),
    });
    const dxFrom = (plusDI: Prisma.Decimal, minusDI: Prisma.Decimal): Prisma.Decimal => {
      const sum = plusDI.plus(minusDI);
      return sum.equals(ZERO) ? ZERO : HUNDRED.times(plusDI.minus(minusDI).abs()).div(sum);
    };

    const dxSeries: Prisma.Decimal[] = [];
    const diSeries: Array<{ plusDI: Prisma.Decimal; minusDI: Prisma.Decimal }> = [];
    let { plusDI, minusDI } = diPair();
    dxSeries.push(dxFrom(plusDI, minusDI));
    diSeries.push({ plusDI, minusDI });

    for (let i = period; i < plusDM.length; i++) {
      avgPlusDM = wilderSmooth(avgPlusDM, avgPlusDM, plusDM[i], period);
      avgMinusDM = wilderSmooth(avgMinusDM, avgMinusDM, minusDM[i], period);
      avgTR = wilderSmooth(avgTR, avgTR, trueRanges[i], period);
      ({ plusDI, minusDI } = diPair());
      dxSeries.push(dxFrom(plusDI, minusDI));
      diSeries.push({ plusDI, minusDI });
    }

    // dxSeries[m] corresponds to points[period + m] (diSeries[0]/dxSeries[0]
    // is seeded from the first `period` DM/TR values, i.e. points[1..period],
    // "arriving" at points[period]). ADX itself seeds from the first
    // `period` DX values — dxSeries[0..period-1] — the last of which is at
    // points[period + (period-1)] = points[2*period-1].
    let adx = dxSeries.slice(0, period).reduce((s, v) => s.plus(v), ZERO).div(period);
    const firstAdxPointIndex = 2 * period - 1;
    const series: IndicatorSeriesEntry<AdxValue>[] = [
      {
        timestamp: points[firstAdxPointIndex].timestamp,
        value: { adx, plusDI: diSeries[period - 1].plusDI, minusDI: diSeries[period - 1].minusDI },
      },
    ];

    for (let i = period; i < dxSeries.length; i++) {
      adx = adx.times(period - 1).plus(dxSeries[i]).div(period);
      const pointIndex = period + i;
      series.push({
        timestamp: points[pointIndex].timestamp,
        value: { adx, plusDI: diSeries[i].plusDI, minusDI: diSeries[i].minusDI },
      });
    }

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'ADX',
        parameters: { period },
        formula:
          '+DM/-DM/TR Wilder-smoothed (average form); +DI=100*avg(+DM)/avg(TR); -DI=100*avg(-DM)/avg(TR); DX=100*|+DI--DI|/(+DI+-DI); ADX = Wilder-smoothed average of DX, seeded by a simple average of the first `period` DX values.',
        source: 'J. Welles Wilder Jr., "New Concepts in Technical Trading Systems" (1978).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
