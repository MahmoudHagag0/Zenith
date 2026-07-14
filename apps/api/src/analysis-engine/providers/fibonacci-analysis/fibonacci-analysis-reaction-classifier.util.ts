import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ReactionState } from './fibonacci-analysis.types';

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): the ATR-relative margin a subsequent close must clear beyond the level to read as a genuine decisive break, not an inconclusive pierce. */
export const BREAK_MARGIN_ATR_MULTIPLE = 0.25;

export type LevelRole = 'SUPPORT' | 'RESISTANCE';

/** A level below current price acts as support (an expected floor); a level above acts as resistance (an expected ceiling). */
export function determineRole(candidatePrice: Prisma.Decimal, currentPrice: Prisma.Decimal): LevelRole {
  return currentPrice.greaterThanOrEqualTo(candidatePrice) ? 'SUPPORT' : 'RESISTANCE';
}

/**
 * Three mutually-exclusive states determined by touch/close persistence
 * across subsequent points (S1-017 Sprint Brief, Scope item 5) -- a
 * genuinely different mechanism from a single-bar wick-to-range/body-to-
 * range/close-position measurement (that mechanism belongs to
 * `PriceActionProvider`, S1-015, and is deliberately not reused or
 * duplicated here). `UNTESTED` when no subsequent point has yet touched
 * the level; `RESPECTED` when touched at least once with no subsequent
 * decisive close through it; `BROKEN` when any subsequent point closes
 * beyond the disclosed margin on the wrong side.
 */
export function classifyReaction(candidatePrice: Prisma.Decimal, role: LevelRole, subsequentPoints: readonly MarketSeriesPoint[], atrValue: Prisma.Decimal): ReactionState {
  const margin = atrValue.times(BREAK_MARGIN_ATR_MULTIPLE);
  let touched = false;

  for (const point of subsequentPoints) {
    const touches = point.low.lessThanOrEqualTo(candidatePrice) && point.high.greaterThanOrEqualTo(candidatePrice);
    if (touches) touched = true;

    const brokenThrough = role === 'SUPPORT' ? point.close.lessThan(candidatePrice.minus(margin)) : point.close.greaterThan(candidatePrice.plus(margin));
    if (brokenThrough) return 'BROKEN';
  }

  return touched ? 'RESPECTED' : 'UNTESTED';
}
