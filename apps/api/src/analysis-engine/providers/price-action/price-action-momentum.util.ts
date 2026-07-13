import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { ContinuationPace, PriceActionState } from './price-action.types';
import { findAtrAtOrBefore } from './price-action-quality-scoring.util';

const DIRECTIONAL_STATES: readonly PriceActionState[] = ['BREAKOUT_UNCONFIRMED', 'BREAKOUT_CONFIRMED', 'BREAKOUT_FAILED'];

/** Disclosed calibration (S1-015 Sprint Brief, Missing Decisions): the ATR-relative net move from the breakout bar's own close to the most recent point's close that earns a full momentum score of 100. */
const MOMENTUM_FULL_SCORE_ATR_MULTIPLE = 2;

/** Disclosed calibration (S1-015 Sprint Brief, Missing Decisions): the minimum count of post-breakout points required before continuation-vs-exhaustion can be assessed at all -- below this, `null` is returned rather than a fabricated classification from too little evidence. */
const CONTINUATION_MIN_POINTS = 4;

/** Disclosed calibration (S1-015 Sprint Brief, Missing Decisions): how much larger (or smaller) the later half's own average body size must be than the earlier half's to read as continuation (or exhaustion) rather than a neutral pace. */
const CONTINUATION_MARGIN_RATIO = 1.2;

/**
 * ATR-relative velocity of the current leg (S1-015 Sprint Brief, Scope
 * item 6) — computed only for directional (breakout) states; `0` for
 * `APPROACHING_LEVEL`/`REJECTED_LEVEL`, which have made no directional
 * claim to measure velocity of.
 */
export function scoreMomentum(state: PriceActionState, breakoutPoint: MarketSeriesPoint | null, latestPoint: MarketSeriesPoint, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): number {
  if (!DIRECTIONAL_STATES.includes(state) || !breakoutPoint) {
    return 0;
  }
  const atr = findAtrAtOrBefore(atrSeries, latestPoint.timestamp);
  if (!atr || atr.isZero()) {
    return 0;
  }
  const netMove = latestPoint.close.minus(breakoutPoint.close).abs();
  const atrRelative = netMove.dividedBy(atr);
  return Prisma.Decimal.min(atrRelative.dividedBy(MOMENTUM_FULL_SCORE_ATR_MULTIPLE).times(100), 100).toNumber();
}

/**
 * Continuation versus exhaustion (S1-015 Sprint Brief, Scope item 6) —
 * compares the later half's own average body size against the earlier
 * half's, among the points from the breakout bar through the most recent
 * point. `null` when fewer than `CONTINUATION_MIN_POINTS` post-breakout
 * points exist (no fabricated classification from too little evidence)
 * or the state is not directional.
 */
export function scoreContinuationPace(state: PriceActionState, pointsFromBreakout: readonly MarketSeriesPoint[]): ContinuationPace | null {
  if (!DIRECTIONAL_STATES.includes(state) || pointsFromBreakout.length < CONTINUATION_MIN_POINTS) {
    return null;
  }
  const midpoint = Math.floor(pointsFromBreakout.length / 2);
  const earlier = pointsFromBreakout.slice(0, midpoint);
  const later = pointsFromBreakout.slice(midpoint);
  const averageBody = (points: readonly MarketSeriesPoint[]): Prisma.Decimal =>
    points.reduce((sum, point) => sum.plus(point.close.minus(point.open).abs()), new Prisma.Decimal(0)).dividedBy(points.length);

  const earlierAverage = averageBody(earlier);
  const laterAverage = averageBody(later);
  if (earlierAverage.isZero()) {
    return 'NEUTRAL_PACE';
  }
  const ratio = laterAverage.dividedBy(earlierAverage);
  if (ratio.greaterThanOrEqualTo(CONTINUATION_MARGIN_RATIO)) {
    return 'CONTINUATION';
  }
  if (ratio.lessThanOrEqualTo(new Prisma.Decimal(1).dividedBy(CONTINUATION_MARGIN_RATIO))) {
    return 'EXHAUSTION';
  }
  return 'NEUTRAL_PACE';
}
