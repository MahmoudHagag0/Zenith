import { Prisma } from '@zenith/database';
import type { IndicatorSeriesEntry } from '../../indicator-engine/indicator-engine.types';
import type { KeyLevel, PatternInvalidation, PriceActionReading, PriceActionState, ReactionClassification } from './price-action.types';
import { findAtrAtOrBefore } from './price-action-quality-scoring.util';

/** A quality/momentum value below this is disclosed as a weakness, not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

/**
 * Disclosed boundary-proximity margin, in ATR multiples (S1-015 Sprint
 * Brief, Missing Decisions) — how close the decisive interaction point's
 * close must be to the key level for a second, opposite-leaning alternate
 * interpretation to be disclosed alongside the primary reading. A
 * genuinely different bounding mechanism from every other registered
 * Provider's own bounded multi-window search: here, a single margin check
 * against one decisive price, never a second independent scan.
 */
const BOUNDARY_PROXIMITY_MARGIN_ATR = 0.15;

/** Disclosed fraction (S1-015 Sprint Brief, Missing Decisions) of the primary reading's own Interpretation Confidence assigned to a boundary-proximity alternate — always weaker than the primary, since the primary is by construction the decisive read. */
export const ALTERNATE_CONFIDENCE_FRACTION = 0.5;

export interface AlternateReading {
  readonly state: PriceActionState;
  readonly marginAtr: number;
}

const OPPOSITE_STATE: Partial<Record<PriceActionState, PriceActionState>> = {
  REJECTED_LEVEL: 'BREAKOUT_UNCONFIRMED',
  BREAKOUT_UNCONFIRMED: 'REJECTED_LEVEL',
  BREAKOUT_CONFIRMED: 'BREAKOUT_FAILED',
  BREAKOUT_FAILED: 'BREAKOUT_CONFIRMED',
};

/** The single decisive point each state's own classification turned on — `null` only for `APPROACHING_LEVEL`, which has no decisive point yet. */
function decisivePointFor(classification: ReactionClassification) {
  switch (classification.state) {
    case 'REJECTED_LEVEL':
      return classification.rejectionPoint;
    case 'BREAKOUT_UNCONFIRMED':
      return classification.breakoutPoint;
    case 'BREAKOUT_CONFIRMED':
      return classification.retestPoint;
    case 'BREAKOUT_FAILED':
      return classification.rejectionPoint;
    case 'APPROACHING_LEVEL':
      return null;
  }
}

/**
 * A second, opposite-leaning alternate is disclosed only when the
 * classification's own decisive point closed within
 * `BOUNDARY_PROXIMITY_MARGIN_ATR` of the key level (S1-015 Sprint Brief,
 * Scope item 7) — never an unbounded or combinatorial alternative search.
 */
export function determineAlternate(classification: ReactionClassification, keyLevel: KeyLevel, atrSeries: readonly IndicatorSeriesEntry<Prisma.Decimal>[]): AlternateReading | null {
  const decisivePoint = decisivePointFor(classification);
  const opposite = OPPOSITE_STATE[classification.state];
  if (!decisivePoint || !opposite) {
    return null;
  }
  const atr = findAtrAtOrBefore(atrSeries, decisivePoint.timestamp);
  if (!atr || atr.isZero()) {
    return null;
  }
  const marginAtr = decisivePoint.close.minus(keyLevel.price).abs().dividedBy(atr).toNumber();
  return marginAtr <= BOUNDARY_PROXIMITY_MARGIN_ATR ? { state: opposite, marginAtr } : null;
}

/** The disclosed, forward-looking condition that would contradict this reading — the same single key level this reading is itself built from, never a separate fabricated level. */
export function buildInvalidation(classification: ReactionClassification, keyLevel: KeyLevel): PatternInvalidation {
  const levelText = keyLevel.price.toFixed(2);
  switch (classification.state) {
    case 'APPROACHING_LEVEL':
      return { level: keyLevel.price, description: `A decisive close beyond ${levelText} in either direction would end the approach phase and reclassify this reading.` };
    case 'REJECTED_LEVEL':
      return { level: keyLevel.price, description: `A subsequent decisive close beyond ${levelText} would invalidate this rejection reading and reclassify it as a breakout.` };
    case 'BREAKOUT_UNCONFIRMED':
      return { level: keyLevel.price, description: `A subsequent decisive close back across ${levelText} would invalidate this breakout reading and reclassify it as a failure.` };
    case 'BREAKOUT_CONFIRMED':
      return { level: keyLevel.price, description: `A subsequent decisive close back across ${levelText} would invalidate this confirmed-breakout reading entirely.` };
    case 'BREAKOUT_FAILED':
      return { level: keyLevel.price, description: `A subsequent decisive close back beyond ${levelText} in the original breakout direction would invalidate this failed-breakout reading and reinstate the breakout.` };
  }
}

export function buildSurvivalReasons(reading: PriceActionReading): string[] {
  const reasons = [reading.qualityScore.explanation];
  if (reading.momentumScore > 0) {
    reasons.push(`Momentum score ${reading.momentumScore.toFixed(0)} (0-100), ATR-relative velocity of the current leg.`);
  }
  if (reading.continuationPace) {
    reasons.push(`Continuation pace reads ${reading.continuationPace}, comparing later against earlier body sizes since the breakout.`);
  }
  return reasons;
}

export function buildWeaknesses(reading: PriceActionReading): string[] {
  const weaknesses: string[] = [];
  if (reading.qualityScore.value < WEAKNESS_THRESHOLD) {
    weaknesses.push(`This reading's own quality score (${reading.qualityScore.value.toFixed(0)}) is below the disclosed weakness threshold -- a narrow, low-conviction reaction.`);
  }
  if (reading.continuationPace === 'EXHAUSTION') {
    weaknesses.push("Continuation pace reads EXHAUSTION -- later bars since the breakout show smaller bodies than earlier ones, a fading rather than accelerating move.");
  }
  return weaknesses;
}
