import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { WyckoffRange } from './wyckoff.types';

/**
 * Minimum swing highs and swing lows required before a range is even
 * candidate-worthy — a disclosed, named constant (Missing Decision,
 * S1-009 Sprint Brief), not a silent magic number.
 */
const MIN_SWINGS_PER_TYPE = 2;

/**
 * Identifies a candidate trading range: a bounded price zone (support/
 * resistance) that every Wyckoff event is subsequently detected relative
 * to. Composed from the Swing Detector's already-verified swing highs/
 * lows and the Regime/Context Service's `trendState` (S1-007) — never a
 * re-derivation of swing logic (S1-009 Sprint Brief, Acceptance
 * Criteria).
 *
 * Deliberately conservative: returns `null` (never a low-confidence
 * guess) when the Regime/Context Service reads `TRENDING` — a clean,
 * uninterrupted trend has no range to read — or when there is not yet
 * enough swing structure to bound one. A `null` result feeds the
 * Provider's `Limitations` path (WP7), never a thrown exception.
 */
export function detectWyckoffRange(
  points: readonly MarketSeriesPoint[],
  swingResult: SwingDetectionResult,
  regimeResult: RegimeContextResult,
): WyckoffRange | null {
  if (regimeResult.trendState !== 'RANGING') {
    return null;
  }

  const swingHighs = swingResult.swings.filter((swing) => swing.type === 'HIGH');
  const swingLows = swingResult.swings.filter((swing) => swing.type === 'LOW');

  if (swingHighs.length < MIN_SWINGS_PER_TYPE || swingLows.length < MIN_SWINGS_PER_TYPE) {
    return null;
  }

  const resistance = swingHighs.reduce((max, swing) => (swing.price.greaterThan(max) ? swing.price : max), swingHighs[0].price);
  const support = swingLows.reduce((min, swing) => (swing.price.lessThan(min) ? swing.price : min), swingLows[0].price);

  const earliestUsedTimestamp = [...swingHighs, ...swingLows].reduce(
    (earliest, swing) => (swing.timestamp < earliest ? swing.timestamp : earliest),
    swingResult.swings[0].timestamp,
  );

  return {
    support,
    resistance,
    startTimestamp: earliestUsedTimestamp,
    endTimestamp: points[points.length - 1].timestamp,
  };
}
