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
 * How many of the *earliest* swing highs/lows establish the initial
 * range boundary — a disclosed, named constant (Missing Decision). This
 * is deliberately **not** a min/max over the entire series: Wyckoff's
 * schematic establishes its range early (Phase A/B), and later price
 * action (Spring undercutting support, SOS breaking above resistance)
 * is expected — and must be able — to exceed those initial bounds. A
 * global min/max over all swings would make "exceeding the range"
 * tautologically impossible, since the Spring/SOS swing would already
 * be baked into the range itself.
 */
const ESTABLISHING_SWING_COUNT = MIN_SWINGS_PER_TYPE;

/**
 * Identifies a candidate trading range: a bounded price zone (support/
 * resistance) that every Wyckoff event is subsequently detected relative
 * to. Composed from the Swing Detector's already-verified swing highs/
 * lows and the Regime/Context Service's `trendState` (S1-007) — never a
 * re-derivation of swing logic (S1-009 Sprint Brief, Acceptance
 * Criteria). Support/resistance are derived from only the earliest
 * `ESTABLISHING_SWING_COUNT` swings of each type (see above) — not the
 * series' global extremes — so later Spring/Test/SOS/LPS-style swings
 * remain free to test or break that initial boundary.
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

  const establishingHighs = swingHighs.slice(0, ESTABLISHING_SWING_COUNT);
  const establishingLows = swingLows.slice(0, ESTABLISHING_SWING_COUNT);

  const resistance = establishingHighs.reduce((max, swing) => (swing.price.greaterThan(max) ? swing.price : max), establishingHighs[0].price);
  const support = establishingLows.reduce((min, swing) => (swing.price.lessThan(min) ? swing.price : min), establishingLows[0].price);

  const earliestUsedTimestamp = [...establishingHighs, ...establishingLows].reduce(
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
