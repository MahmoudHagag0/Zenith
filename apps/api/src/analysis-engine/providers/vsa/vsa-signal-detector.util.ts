import type { TrendDirection } from '../../swing-detection/swing-detection.types';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ClassifiedBar, VsaSignal, VsaSignalType } from './vsa.types';

/** Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): the bounded local lookback window Upthrust/Shakeout compare this bar's own high/low against. */
export const LOCAL_EXTREME_LOOKBACK = 10;

/**
 * The three wide-spread, high-volume "climax-type" signals -- exported
 * so this Provider's own Confidence taxonomy (Scope item 5) and
 * `normalize()` mapping (Scope item 9) can bifurcate on signal category
 * without re-deriving this classification themselves.
 */
export const CLIMAX_SIGNAL_TYPES: readonly VsaSignalType[] = ['UPTHRUST', 'SHAKEOUT', 'STOPPING_VOLUME'];

export function isClimaxSignal(type: VsaSignalType): boolean {
  return CLIMAX_SIGNAL_TYPES.includes(type);
}

/**
 * This signal's own implied directional bias -- `NO_SUPPLY`/`SHAKEOUT`
 * read `BULLISH` (a demand-side strength signal); `NO_DEMAND`/`UPTHRUST`
 * read `BEARISH` (a supply-side weakness signal); `STOPPING_VOLUME` is
 * bullish when the absorbed effort was a down bar (support found) and
 * bearish when it was an up bar (resistance found).
 */
export function directionOf(signal: VsaSignal): 'BULLISH' | 'BEARISH' {
  switch (signal.type) {
    case 'NO_SUPPLY':
    case 'SHAKEOUT':
      return 'BULLISH';
    case 'NO_DEMAND':
    case 'UPTHRUST':
      return 'BEARISH';
    case 'STOPPING_VOLUME':
      return signal.bar.direction === 'DOWN' ? 'BULLISH' : 'BEARISH';
  }
}

function isNewLocalHigh(bar: ClassifiedBar, precedingPoints: readonly MarketSeriesPoint[]): boolean {
  return precedingPoints.every((point) => bar.point.high.greaterThan(point.high));
}

function isNewLocalLow(bar: ClassifiedBar, precedingPoints: readonly MarketSeriesPoint[]): boolean {
  return precedingPoints.every((point) => bar.point.low.lessThan(point.low));
}

/**
 * Checks, in a disclosed priority order, exactly the five named VSA
 * signal types (S1-018 Sprint Brief, Scope item 3):
 *
 * 1. Upthrust -- a genuine new local high (checked first), `WIDE`
 *    spread, `HIGH`/`ULTRA_HIGH` volume, close position `NEAR_LOW`.
 * 2. Shakeout -- a genuine new local low (checked first, mutually
 *    exclusive with Upthrust by construction since `NEAR_HIGH` and
 *    `NEAR_LOW` cannot both hold), `WIDE` spread, `HIGH`/`ULTRA_HIGH`
 *    volume, close position `NEAR_HIGH`.
 * 3. Stopping Volume -- checked only when neither of the above matched
 *    (no new local extreme was made): `WIDE` spread, `HIGH`/`ULTRA_HIGH`
 *    volume, and either a down bar closing `NEAR_HIGH` or an up bar
 *    closing `NEAR_LOW`.
 * 4. No Demand / No Supply -- `NARROW` spread, `LOW` volume, checked
 *    last; mutually exclusive with the three `WIDE`-spread signals above
 *    by construction. Gated by the Regime/Context Service's own
 *    `trendDirection`: No Demand requires an active up-move, No Supply
 *    an active down-move.
 *
 * Returns `null` when no bar in this priority order qualifies -- never a
 * forced, low-confidence guess.
 */
export function detectSignal(bar: ClassifiedBar, precedingPoints: readonly MarketSeriesPoint[], trendDirection: TrendDirection): VsaSignalType | null {
  const isWideHighVolume = bar.spread === 'WIDE' && (bar.volume === 'HIGH' || bar.volume === 'ULTRA_HIGH');

  if (isWideHighVolume) {
    const newHigh = isNewLocalHigh(bar, precedingPoints);
    const newLow = isNewLocalLow(bar, precedingPoints);

    if (newHigh && bar.closePosition === 'NEAR_LOW') return 'UPTHRUST';
    if (newLow && bar.closePosition === 'NEAR_HIGH') return 'SHAKEOUT';

    if (!newHigh && !newLow) {
      if (bar.direction === 'DOWN' && bar.closePosition === 'NEAR_HIGH') return 'STOPPING_VOLUME';
      if (bar.direction === 'UP' && bar.closePosition === 'NEAR_LOW') return 'STOPPING_VOLUME';
    }
    return null;
  }

  if (bar.spread === 'NARROW' && bar.volume === 'LOW') {
    if (bar.direction === 'UP' && trendDirection === 'UP') return 'NO_DEMAND';
    if (bar.direction === 'DOWN' && trendDirection === 'DOWN') return 'NO_SUPPLY';
  }

  return null;
}
