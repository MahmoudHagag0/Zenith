import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { DisplacementLeg, IctSmcDirection, LiquiditySweep } from './ict-smc.types';

/**
 * Disclosed, named calibration constants (S1-010 Sprint Brief, Missing
 * Decisions) — never silent magic numbers.
 */
const SWEEP_ATR_TOLERANCE_MULTIPLIER = 0.25;
/** How many bars after a sweep candle this Provider looks for a following DisplacementLeg — a best-effort, unscored link (Implementation Guidance #1), not a scan without bound. */
const SWEEP_TO_DISPLACEMENT_WINDOW_BARS = 3;

/**
 * Detects Liquidity Sweeps (stage `LIQUIDITY_EVENT`) — purely
 * price-based, per S1-010 Sprint Brief Scope item 5: a candle piercing
 * beyond a prior swing extreme by more than an ATR-relative tolerance
 * while closing back within the prior range, distinguished from a genuine
 * breakout (which pierces but does not close back inside). Where a
 * `DisplacementLeg` immediately follows within the disclosed bar window,
 * a best-effort, unscored link is recorded.
 */
export function detectLiquiditySweeps(
  points: readonly MarketSeriesPoint[],
  swingResult: SwingDetectionResult,
  atr: Prisma.Decimal,
  displacementLegs: readonly DisplacementLeg[],
): LiquiditySweep[] {
  const tolerance = atr.times(SWEEP_ATR_TOLERANCE_MULTIPLIER);
  const sweeps: LiquiditySweep[] = [];

  for (const swing of swingResult.swings) {
    const swingIndex = points.findIndex((point) => point.timestamp.getTime() === swing.timestamp.getTime());
    if (swingIndex === -1) continue;

    for (let i = swingIndex + 1; i < points.length; i++) {
      const candidate = points[i];

      if (swing.type === 'HIGH') {
        if (!candidate.high.greaterThan(swing.price.plus(tolerance))) continue;
        if (candidate.close.lessThanOrEqualTo(swing.price)) {
          sweeps.push(buildSweep('BEARISH', swing.price, candidate.timestamp, i, displacementLegs));
        }
        break; // The first pierce of this swing resolves it, one way or the other -- a sweep or a genuine breakout, never both.
      } else {
        if (!candidate.low.lessThan(swing.price.minus(tolerance))) continue;
        if (candidate.close.greaterThanOrEqualTo(swing.price)) {
          sweeps.push(buildSweep('BULLISH', swing.price, candidate.timestamp, i, displacementLegs));
        }
        break;
      }
    }
  }

  return sweeps;
}

function buildSweep(
  direction: IctSmcDirection,
  sweptLevel: Prisma.Decimal,
  timestamp: Date,
  index: number,
  displacementLegs: readonly DisplacementLeg[],
): LiquiditySweep {
  const followingLeg = displacementLegs.find((leg) => leg.startIndex > index && leg.startIndex - index <= SWEEP_TO_DISPLACEMENT_WINDOW_BARS);
  return {
    stage: 'LIQUIDITY_EVENT',
    direction,
    timestamp,
    sweptLevel,
    ...(followingLeg ? { displacementLegTimestamp: followingLeg.structureEventTimestamp } : {}),
  };
}
