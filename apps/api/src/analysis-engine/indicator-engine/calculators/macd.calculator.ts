import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ComputationOutput, IndicatorCalculator, IndicatorSeriesEntry, MacdParams, MacdValue } from '../indicator-engine.types';
import { EmaCalculator } from './ema.calculator';

const COMPUTATION_VERSION = '1.0.0';

/**
 * MACD — the `line` (fast EMA minus slow EMA) was developed by Gerald
 * Appel in the 1970s (documented in his own later book, "Technical
 * Analysis: Power Tools for Active Investors," 2005). The `histogram`
 * (line minus its own signal-line EMA) is a distinct 1986 addition by
 * Thomas Aspray, not part of Appel's original indicator — tracked here
 * with separate source attribution rather than one unattributed
 * composite, per 22_ANALYSIS_ENGINE_ARCHITECTURE.md's Indicator Engine
 * section.
 */
export class MacdCalculator implements IndicatorCalculator<MacdParams, MacdValue> {
  readonly name = 'MACD';

  compute(points: readonly MarketSeriesPoint[], params: MacdParams): ComputationOutput<MacdValue> {
    const { fastPeriod, slowPeriod, signalPeriod } = params;
    if (![fastPeriod, slowPeriod, signalPeriod].every((p) => Number.isInteger(p) && p > 0)) {
      throw new ComputationRejectedError('MACD', 'fastPeriod, slowPeriod, and signalPeriod must all be positive integers');
    }
    if (fastPeriod >= slowPeriod) {
      throw new ComputationRejectedError('MACD', 'fastPeriod must be less than slowPeriod');
    }
    if (points.length < slowPeriod + signalPeriod - 1) {
      throw new ComputationRejectedError(
        'MACD',
        `requires at least ${slowPeriod + signalPeriod - 1} points, received ${points.length}`,
      );
    }

    const closes = points.map((p) => p.close);
    const fastEma = EmaCalculator.computeSeries(closes, fastPeriod);
    const slowEma = EmaCalculator.computeSeries(closes, slowPeriod);
    const offset = slowPeriod - fastPeriod;

    // lineValues[i] corresponds to points[slowPeriod - 1 + i].
    const lineValues = slowEma.map((slowValue, i) => fastEma[i + offset].minus(slowValue));

    const signalValues = EmaCalculator.computeSeries(lineValues, signalPeriod);

    const series: IndicatorSeriesEntry<MacdValue>[] = signalValues.map((signal, i) => {
      const lineIdx = signalPeriod - 1 + i;
      const pointIdx = slowPeriod - 1 + lineIdx;
      const line = lineValues[lineIdx];
      return { timestamp: points[pointIdx].timestamp, value: { line, signal, histogram: line.minus(signal) } };
    });

    return {
      series,
      metadata: buildComputationMetadata({
        computation: 'MACD',
        parameters: { fastPeriod, slowPeriod, signalPeriod },
        formula:
          'line = EMA(fastPeriod) - EMA(slowPeriod); signal = EMA(line, signalPeriod); histogram = line - signal.',
        source:
          'Line: Gerald Appel, "Technical Analysis: Power Tools for Active Investors" (2005), documenting his 1970s indicator. Histogram: Thomas Aspray (1986 addition).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
