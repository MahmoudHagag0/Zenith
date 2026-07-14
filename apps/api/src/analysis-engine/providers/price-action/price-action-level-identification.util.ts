import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { KeyLevel } from './price-action.types';

/**
 * The single most recent swing only (S1-015 Sprint Brief, Scope item 2) —
 * a deliberately bounded V1 scope, not a historical multi-level scan. A
 * prior swing HIGH is this Provider's own resistance level; a prior swing
 * LOW is its own support level. Returns `null` when no swing exists yet.
 */
export function identifyKeyLevel(swingResult: SwingDetectionResult): KeyLevel | null {
  const lastSwing = swingResult.swings[swingResult.swings.length - 1];
  if (!lastSwing) {
    return null;
  }
  return { type: lastSwing.type, price: lastSwing.price, timestamp: lastSwing.timestamp };
}

/** Every `MarketSeries` point strictly after the key level's own timestamp (S1-015 Sprint Brief, Scope item 3) — chronological order preserved from the source series. */
export function gatherSubsequentPoints(series: MarketSeries, keyLevel: KeyLevel): MarketSeriesPoint[] {
  return series.points.filter((candidate) => candidate.timestamp.getTime() > keyLevel.timestamp.getTime());
}
