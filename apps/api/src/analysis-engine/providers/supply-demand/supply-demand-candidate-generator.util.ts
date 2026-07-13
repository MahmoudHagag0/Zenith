import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { RawZoneCandidate, ZoneOrigin, ZoneType } from './supply-demand.types';

/** Disclosed calibration (S1-016 Sprint Brief, Missing Decisions): a candle with a body no larger than this fraction of its own range is "indecisive" -- a candidate basing candle. */
const BASE_MAX_BODY_RATIO = 0.35;

/** Disclosed calibration (S1-016 Sprint Brief, Missing Decisions): the bounded base-candle-count window this Provider scans. */
const MIN_BASE_CANDLES = 1;
const MAX_BASE_CANDLES = 5;

/**
 * Disclosed calibration (S1-016 Sprint Brief, Missing Decisions): the
 * base's own combined high-low range, relative to ATR, at which it reads
 * as fully tight (`BASE_TIGHT_ATR_MULTIPLE`, full quality score -- see
 * `supply-demand-quality-scoring.util.ts`) versus the bound beyond which
 * it is disqualified as a base entirely (`BASE_LOOSE_ATR_MULTIPLE`).
 */
export const BASE_TIGHT_ATR_MULTIPLE = 1;
export const BASE_LOOSE_ATR_MULTIPLE = 3;

/** Disclosed calibration (S1-016 Sprint Brief, Missing Decisions): the departure candle's own body, relative to ATR, must clear this multiple to qualify as a genuine impulsive departure at all -- a base with no qualifying departure is discarded entirely. */
export const DEPARTURE_MIN_ATR_MULTIPLE = 1.5;

function rangeOf(point: MarketSeriesPoint): Prisma.Decimal {
  return point.high.minus(point.low);
}

function bodyOf(point: MarketSeriesPoint): Prisma.Decimal {
  return point.close.minus(point.open).abs();
}

function isIndecisive(point: MarketSeriesPoint): boolean {
  const range = rangeOf(point);
  if (range.isZero()) return true;
  return bodyOf(point).dividedBy(range).lessThanOrEqualTo(BASE_MAX_BODY_RATIO);
}

function findAtrAtOrBefore(atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[], timestamp: Date): Prisma.Decimal | null {
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

function classifyOrigin(precedingCandle: MarketSeriesPoint, departureIsUpward: boolean): ZoneOrigin {
  const precedingIsRally = precedingCandle.close.greaterThanOrEqualTo(precedingCandle.open);
  if (precedingIsRally) {
    return departureIsUpward ? 'RALLY_BASE_RALLY' : 'RALLY_BASE_DROP';
  }
  return departureIsUpward ? 'DROP_BASE_RALLY' : 'DROP_BASE_DROP';
}

/**
 * A bounded linear scan across candle-count windows (S1-016 Sprint
 * Brief, Scope items 2-4) -- never a combinatorial search. For each
 * window of consecutive indecisive candles that stays within a disclosed
 * ATR-relative tightness bound, the single following candle is checked
 * against a disclosed ATR-relative body-size gate; a base with no
 * qualifying departure is discarded entirely, never returned as a low-
 * confidence guess. The scan only considers windows with at least one
 * preceding candle available (S1-016 Task Breakdown, WP2) so every
 * candidate's own origin classification (Scope item 3) is always
 * computable -- a candle-index edge condition, not a scope decision.
 */
export function generateZoneCandidates(series: MarketSeries, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): RawZoneCandidate[] {
  const points = series.points;
  const candidates: RawZoneCandidate[] = [];

  for (let windowSize = MIN_BASE_CANDLES; windowSize <= MAX_BASE_CANDLES; windowSize++) {
    for (let start = 1; start + windowSize < points.length; start++) {
      const baseCandles = points.slice(start, start + windowSize);
      if (!baseCandles.every(isIndecisive)) continue;

      const departureCandle = points[start + windowSize];
      const atr = findAtrAtOrBefore(atrSeries, departureCandle.timestamp);
      if (!atr || atr.isZero()) continue;

      const baseHigh = Prisma.Decimal.max(...baseCandles.map((c) => c.high));
      const baseLow = Prisma.Decimal.min(...baseCandles.map((c) => c.low));
      const baseRangeAtrRatio = baseHigh.minus(baseLow).dividedBy(atr);
      if (baseRangeAtrRatio.greaterThan(BASE_LOOSE_ATR_MULTIPLE)) continue;

      const departureAtrRatio = bodyOf(departureCandle).dividedBy(atr);
      if (departureAtrRatio.lessThan(DEPARTURE_MIN_ATR_MULTIPLE)) continue;

      const departureIsUpward = departureCandle.close.greaterThan(departureCandle.open);
      const type: ZoneType = departureIsUpward ? 'DEMAND' : 'SUPPLY';
      const origin = classifyOrigin(points[start - 1], departureIsUpward);
      const boundaries = type === 'DEMAND' ? { proximal: baseHigh, distal: baseLow } : { proximal: baseLow, distal: baseHigh };

      candidates.push({ type, origin, boundaries, baseCandles, departureCandle });
    }
  }

  return candidates;
}
