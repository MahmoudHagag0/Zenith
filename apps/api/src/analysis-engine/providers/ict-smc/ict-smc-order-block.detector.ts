import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { DisplacementLeg, OrderBlock } from './ict-smc.types';

/**
 * How many bars before a Displacement Leg's start this Provider searches
 * for its originating opposing-direction candle — a disclosed, named
 * constant (S1-010 Sprint Brief, Missing Decisions), not an unbounded
 * scan.
 */
const ORDER_BLOCK_LOOKBACK_BARS = 5;

function isBearishCandle(point: MarketSeriesPoint): boolean {
  return point.close.lessThan(point.open);
}

function isBullishCandle(point: MarketSeriesPoint): boolean {
  return point.close.greaterThan(point.open);
}

/**
 * Detects Order Blocks (stage `INSTITUTIONAL_REACTION`) — purely
 * price-based, per S1-010 Sprint Brief Scope item 3: for each
 * `DisplacementLeg`, the last opposing-direction candle at or immediately
 * before the leg's start (last bearish candle before a bullish leg → a
 * Bullish Order Block; last bullish candle before a bearish leg → a
 * Bearish Order Block). Composed from WP2's already-derived
 * `DisplacementLeg`s rather than re-deriving "the impulse move"
 * independently — the concrete architectural payoff of Implementation
 * Guidance #1's shared narrative concept.
 */
export function detectOrderBlocks(points: readonly MarketSeriesPoint[], displacementLegs: readonly DisplacementLeg[]): OrderBlock[] {
  const orderBlocks: OrderBlock[] = [];

  for (const leg of displacementLegs) {
    const isOpposing = leg.direction === 'BULLISH' ? isBearishCandle : isBullishCandle;
    let originIndex: number | null = null;
    for (let i = leg.startIndex; i >= Math.max(0, leg.startIndex - ORDER_BLOCK_LOOKBACK_BARS); i--) {
      if (isOpposing(points[i])) {
        originIndex = i;
        break;
      }
    }
    if (originIndex === null) continue;

    const origin = points[originIndex];
    orderBlocks.push({
      stage: 'INSTITUTIONAL_REACTION',
      direction: leg.direction,
      timestamp: origin.timestamp,
      high: origin.high,
      low: origin.low,
      displacementLegTimestamp: leg.structureEventTimestamp,
    });
  }

  return orderBlocks;
}
