import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { KeyLevel, QualityScore, ReactionClassification } from './price-action.types';

function rangeOf(point: MarketSeriesPoint): Prisma.Decimal {
  return point.high.minus(point.low);
}

/**
 * The ATR value at or immediately before the given timestamp — the ATR
 * series can have a shorter warm-up-bounded length than the input series
 * (S1-007), so an exact-timestamp match is not always available. Returns
 * `null` only when no ATR entry exists at or before this timestamp at all.
 */
export function findAtrAtOrBefore(atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[], timestamp: Date): Prisma.Decimal | null {
  let found: Prisma.Decimal | null = null;
  for (const entry of atrSeries) {
    if (entry.timestamp.getTime() <= timestamp.getTime()) {
      found = entry.value;
    } else {
      break;
    }
  }
  return found;
}

function rejectionQuality(rejectionPoint: MarketSeriesPoint, keyLevel: KeyLevel): QualityScore {
  const range = rangeOf(rejectionPoint);
  if (range.isZero()) {
    return { value: 0, atrRelativeClearance: null, explanation: "This bar's own high-low range is zero -- no wick proportion can be measured." };
  }
  const wick =
    keyLevel.type === 'HIGH' ? rejectionPoint.high.minus(Prisma.Decimal.max(rejectionPoint.open, rejectionPoint.close)) : Prisma.Decimal.min(rejectionPoint.open, rejectionPoint.close).minus(rejectionPoint.low);
  const ratio = Prisma.Decimal.max(wick.dividedBy(range), 0);
  const value = ratio.times(100).toNumber();
  return {
    value,
    atrRelativeClearance: null,
    explanation: `Rejection wick-to-range ratio ${value.toFixed(0)}% -- how much of this bar's own range was rejected back across ${keyLevel.price.toFixed(2)}.`,
  };
}

function breakoutQuality(breakoutPoint: MarketSeriesPoint, keyLevel: KeyLevel, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): QualityScore {
  const range = rangeOf(breakoutPoint);
  const bodyToRange = range.isZero() ? new Prisma.Decimal(0) : breakoutPoint.close.minus(breakoutPoint.open).abs().dividedBy(range);
  const closePosition = range.isZero()
    ? new Prisma.Decimal(0)
    : keyLevel.type === 'HIGH'
      ? breakoutPoint.close.minus(breakoutPoint.low).dividedBy(range)
      : breakoutPoint.high.minus(breakoutPoint.close).dividedBy(range);
  const value = Prisma.Decimal.max(bodyToRange.plus(closePosition).dividedBy(2), 0).times(100).toNumber();

  const atr = findAtrAtOrBefore(atrSeries, breakoutPoint.timestamp);
  const clearance = keyLevel.type === 'HIGH' ? breakoutPoint.close.minus(keyLevel.price) : keyLevel.price.minus(breakoutPoint.close);
  const atrRelativeClearance = atr && !atr.isZero() ? clearance.dividedBy(atr).toNumber() : null;

  return {
    value,
    atrRelativeClearance,
    explanation: `Breakout body-to-range ${bodyToRange.times(100).toFixed(0)}% and close-position ${closePosition.times(100).toFixed(0)}% averaged${
      atrRelativeClearance !== null ? `; cleared the level by ${atrRelativeClearance.toFixed(2)}x ATR` : ' (no ATR value available at this point)'
    }.`,
  };
}

/**
 * Disclosed measurements this reading's own Detection Confidence and
 * summary are built from (S1-015 Sprint Brief, Scope item 5) — a wick-to-
 * range ratio for a rejection, or the average of body-to-range and
 * close-position ratios (plus ATR-relative clearance) for a breakout —
 * never a named candlestick-pattern lookup.
 */
export function scoreQuality(classification: ReactionClassification, keyLevel: KeyLevel, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): QualityScore {
  if (classification.state === 'APPROACHING_LEVEL') {
    return { value: 0, atrRelativeClearance: null, explanation: 'Price has not yet reached the key level -- no reaction exists yet to score.' };
  }
  if (classification.state === 'REJECTED_LEVEL') {
    return rejectionQuality(classification.rejectionPoint as MarketSeriesPoint, keyLevel);
  }
  return breakoutQuality(classification.breakoutPoint as MarketSeriesPoint, keyLevel, atrSeries);
}
