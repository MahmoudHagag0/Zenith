import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { KeyLevel, PriceActionDirection, PriceActionState, ReactionClassification } from './price-action.types';

/** A HIGH key level's own breakout direction is BULLISH (breaking above resistance); a LOW key level's own breakout direction is BEARISH (breaking below support). */
export function breakoutDirectionFor(keyLevel: KeyLevel): PriceActionDirection {
  return keyLevel.type === 'HIGH' ? 'BULLISH' : 'BEARISH';
}

/** The opposite of this key level's own breakout direction — a rejection at the level moves price back the other way. */
export function rejectionDirectionFor(keyLevel: KeyLevel): PriceActionDirection {
  return keyLevel.type === 'HIGH' ? 'BEARISH' : 'BULLISH';
}

/** `BREAKOUT_FAILED` reports the opposite of the original breakout direction — a failed breakout is itself a reversal signal, never reported in the direction of the breakout that just failed (S1-015 Sprint Brief, Scope item 12). */
export function directionFor(state: PriceActionState, keyLevel: KeyLevel): PriceActionDirection {
  switch (state) {
    case 'APPROACHING_LEVEL':
      return 'NEUTRAL';
    case 'REJECTED_LEVEL':
    case 'BREAKOUT_FAILED':
      return rejectionDirectionFor(keyLevel);
    case 'BREAKOUT_UNCONFIRMED':
    case 'BREAKOUT_CONFIRMED':
      return breakoutDirectionFor(keyLevel);
  }
}

function reachesLevel(point: MarketSeriesPoint, keyLevel: KeyLevel): boolean {
  return keyLevel.type === 'HIGH' ? point.high.greaterThanOrEqualTo(keyLevel.price) : point.low.lessThanOrEqualTo(keyLevel.price);
}

function closesBeyondLevel(point: MarketSeriesPoint, keyLevel: KeyLevel): boolean {
  return keyLevel.type === 'HIGH' ? point.close.greaterThan(keyLevel.price) : point.close.lessThan(keyLevel.price);
}

/** A decisive close back on the original side of the level — the event that turns a breakout into a failure. */
function closesBackAcrossLevel(point: MarketSeriesPoint, keyLevel: KeyLevel): boolean {
  return keyLevel.type === 'HIGH' ? point.close.lessThan(keyLevel.price) : point.close.greaterThan(keyLevel.price);
}

/** Touches the level again (a retest) while still closing on the breakout side (holding, not failing). */
function retestHolds(point: MarketSeriesPoint, keyLevel: KeyLevel): boolean {
  const touches = keyLevel.type === 'HIGH' ? point.low.lessThanOrEqualTo(keyLevel.price) : point.high.greaterThanOrEqualTo(keyLevel.price);
  return touches && closesBeyondLevel(point, keyLevel);
}

/**
 * Deterministic, sequential classification into the five mutually-
 * exclusive hard states (S1-015 Sprint Brief, Scope item 4) — a single
 * linear scan, never a combinatorial or multi-window search. The first
 * point that reaches the key level decides between `REJECTED_LEVEL` and
 * a breakout candidate; every following point is then scanned in order
 * for the first of a failure (a decisive close back across the level) or
 * a held retest, whichever occurs first.
 */
export function classifyReaction(keyLevel: KeyLevel, subsequentPoints: readonly MarketSeriesPoint[]): ReactionClassification {
  const interactionIndex = subsequentPoints.findIndex((candidate) => reachesLevel(candidate, keyLevel));
  if (interactionIndex === -1) {
    return { state: 'APPROACHING_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint: null };
  }

  const interactionPoint = subsequentPoints[interactionIndex];
  if (!closesBeyondLevel(interactionPoint, keyLevel)) {
    return { state: 'REJECTED_LEVEL', breakoutPoint: null, retestPoint: null, rejectionPoint: interactionPoint };
  }

  for (const point of subsequentPoints.slice(interactionIndex + 1)) {
    if (closesBackAcrossLevel(point, keyLevel)) {
      return { state: 'BREAKOUT_FAILED', breakoutPoint: interactionPoint, retestPoint: null, rejectionPoint: point };
    }
    if (retestHolds(point, keyLevel)) {
      return { state: 'BREAKOUT_CONFIRMED', breakoutPoint: interactionPoint, retestPoint: point, rejectionPoint: null };
    }
  }

  return { state: 'BREAKOUT_UNCONFIRMED', breakoutPoint: interactionPoint, retestPoint: null, rejectionPoint: null };
}
