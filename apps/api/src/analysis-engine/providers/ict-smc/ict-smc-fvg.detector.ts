import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { DisplacementLeg, FairValueGap, IctSmcDirection } from './ict-smc.types';

/**
 * Minimum qualifying gap size, expressed as a multiple of ATR — not a
 * fixed price-fraction (S1-010 Sprint Brief, Scope item 4; applies the
 * S1-009 self-review lesson — a fixed-fraction tolerance did not survive
 * that review — proactively rather than repeating it).
 */
const FVG_MIN_ATR_MULTIPLIER = 0.25;

/**
 * Detects Fair Value Gaps / Imbalances (stage `IMBALANCE`) — a
 * deterministic three-candle-window scan, per S1-010 Sprint Brief Scope
 * item 4. A gap whose index range falls within a `DisplacementLeg`'s span
 * is linked to it (Implementation Guidance #1); a gap outside any
 * Displacement Leg is still recorded, unlinked — not every imbalance
 * arises from a labeled structure break, and V1 does not force one.
 */
export function detectFairValueGaps(points: readonly MarketSeriesPoint[], atr: Prisma.Decimal, displacementLegs: readonly DisplacementLeg[]): FairValueGap[] {
  const minGapSize = atr.times(FVG_MIN_ATR_MULTIPLIER);
  const gaps: FairValueGap[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const before = points[i - 1];
    const after = points[i + 1];

    if (before.high.lessThan(after.low)) {
      const gapSize = after.low.minus(before.high);
      if (gapSize.greaterThan(minGapSize)) {
        gaps.push(buildGap('BULLISH', before, after, i - 1, i + 1, displacementLegs));
      }
    } else if (before.low.greaterThan(after.high)) {
      const gapSize = before.low.minus(after.high);
      if (gapSize.greaterThan(minGapSize)) {
        gaps.push(buildGap('BEARISH', before, after, i - 1, i + 1, displacementLegs));
      }
    }
  }

  return gaps;
}

function buildGap(
  direction: IctSmcDirection,
  before: MarketSeriesPoint,
  after: MarketSeriesPoint,
  startIndex: number,
  endIndex: number,
  displacementLegs: readonly DisplacementLeg[],
): FairValueGap {
  const enclosingLeg = displacementLegs.find((leg) => leg.startIndex <= startIndex && endIndex <= leg.endIndex);
  return {
    stage: 'IMBALANCE',
    direction,
    startTimestamp: before.timestamp,
    endTimestamp: after.timestamp,
    gapLow: direction === 'BULLISH' ? before.high : after.high,
    gapHigh: direction === 'BULLISH' ? after.low : before.low,
    ...(enclosingLeg ? { displacementLegTimestamp: enclosingLeg.structureEventTimestamp } : {}),
  };
}
