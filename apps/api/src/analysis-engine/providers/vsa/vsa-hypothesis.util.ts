import { Prisma } from '@zenith/database';
import type { Swing } from '../../swing-detection/swing-detection.types';
import type { ClassifiedBar, VsaHypothesis, VsaInvalidation, VsaSignal } from './vsa.types';

/**
 * Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): the
 * bounded `interpretation[]` cap. Ranked by recency (bar index, most
 * recent first) -- a genuinely different bounding rationale from every
 * prior Provider's own (a single boundary-margin check, a one-per-side
 * selection, a proximity-to-current-price ranking, or a score-ranked
 * cap): VSA's own signals are read as time-decaying, a stale
 * effort-vs-result anomaly mattering less than a fresh one.
 */
export const MAX_VSA_HYPOTHESES = 2;

/** Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): how close (ATR-relative) a signal's own bar must be to a Swing-Detector-identified swing high/low to read as "at or near" it. */
export const SWING_PROXIMITY_TOLERANCE_ATR_MULTIPLE = 0.5;

function buildInvalidation(signal: VsaSignal): VsaInvalidation {
  switch (signal.type) {
    case 'NO_DEMAND':
      return { description: 'A subsequent wide-spread, high-volume up bar would invalidate this reading, showing genuine buying interest has returned.' };
    case 'NO_SUPPLY':
      return { description: 'A subsequent wide-spread, high-volume down bar would invalidate this reading, showing genuine selling interest has returned.' };
    case 'UPTHRUST':
      return {
        description: `A subsequent close back above ${signal.bar.point.high.toFixed(2)} (this bar's own high), on continued strong volume, would invalidate this reading, showing the new high was genuinely accepted.`,
      };
    case 'SHAKEOUT':
      return {
        description: `A subsequent close back below ${signal.bar.point.low.toFixed(2)} (this bar's own low), on continued strong volume, would invalidate this reading, showing the new low was genuinely accepted.`,
      };
    case 'STOPPING_VOLUME':
      return { description: "A subsequent bar continuing decisively through this bar's own extreme, on comparable or greater volume, would invalidate this reading, showing the effort was not actually absorbed." };
  }
}

/** Whether this signal's own bar (its high or low, whichever is nearer) occurred within a disclosed ATR-relative tolerance of any Swing-Detector-identified swing. */
function isSwingProximate(bar: ClassifiedBar, swings: readonly Swing[]): boolean {
  if (bar.atr.isZero()) return false;
  return swings.some((swing) => {
    const distanceToHigh = bar.point.high.minus(swing.price).abs();
    const distanceToLow = bar.point.low.minus(swing.price).abs();
    const nearest = Prisma.Decimal.min(distanceToHigh, distanceToLow);
    return nearest.dividedBy(bar.atr).lessThanOrEqualTo(SWING_PROXIMITY_TOLERANCE_ATR_MULTIPLE);
  });
}

/**
 * Ranks every detected signal by recency (most recent bar index first),
 * bounded at `MAX_VSA_HYPOTHESES`, and computes each surviving
 * hypothesis's own disclosed invalidation and swing-proximity flag
 * (S1-018 Sprint Brief, Scope items 4, 6).
 */
export function selectHypotheses(signals: readonly VsaSignal[], swings: readonly Swing[]): VsaHypothesis[] {
  const sorted = [...signals].sort((a, b) => b.bar.index - a.bar.index);
  const bounded = sorted.slice(0, MAX_VSA_HYPOTHESES);

  return bounded.map((signal) => ({
    signal,
    invalidation: buildInvalidation(signal),
    swingProximate: isSwingProximate(signal.bar, swings),
  }));
}
