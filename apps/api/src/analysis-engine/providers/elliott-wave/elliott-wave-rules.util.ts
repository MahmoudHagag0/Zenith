import { Prisma } from '@zenith/database';
import type { ImpulseWaveLeg, RuleValidatedCandidate, WaveInvalidation } from './elliott-wave.types';
import type { RawWaveCandidate } from './elliott-wave-candidate-generator.util';

function distance(leg: ImpulseWaveLeg): Prisma.Decimal {
  return leg.endPrice.minus(leg.startPrice).abs();
}

function clamp01(value: Prisma.Decimal): number {
  return Math.min(1, Math.max(0, value.toNumber()));
}

function buildInvalidation(candidate: RawWaveCandidate): WaveInvalidation {
  const wave1 = candidate.legs[0];
  const direction = candidate.direction === 'BULLISH' ? 'below' : 'above';
  return {
    rule: 'RULE_3',
    level: wave1.endPrice,
    description: `A subsequent close ${direction} ${wave1.endPrice.toFixed(2)} (Wave 1's own endpoint) would invalidate this count via Rule 3 (Wave 4 must never enter Wave 1's price territory).`,
  };
}

/**
 * Applies Elliott's Three Rules as hard invalidation (S1-011 Sprint
 * Brief, Scope item 3) — a violating candidate is discarded outright
 * (returns `null`), never returned as a low-confidence hypothesis, the
 * same "never a low-confidence guess for a falsified structure"
 * discipline established by every prior Provider in this series.
 *
 * Also computes each Rule's own margin score (0-100; how comfortably,
 * not just technically, the Rule was satisfied) and the disclosed,
 * forward-looking invalidation level (Wave 1's own endpoint price) every
 * surviving candidate carries — directly supporting Detection Confidence
 * (WP7) and Implementation Guidance #5's "what weakens it" / "what
 * invalidates it" disclosure.
 */
export function applyElliottRules(candidate: RawWaveCandidate): RuleValidatedCandidate | null {
  const [wave1, wave2, wave3, wave4, wave5] = candidate.legs;
  const isBullish = candidate.direction === 'BULLISH';

  // Rule 1: Wave 2 never retraces more than 100% of Wave 1.
  const rule1Valid = isBullish ? wave2.endPrice.greaterThanOrEqualTo(wave1.startPrice) : wave2.endPrice.lessThanOrEqualTo(wave1.startPrice);
  if (!rule1Valid) return null;
  const wave1Range = distance(wave1);
  const retracement1 = isBullish
    ? wave1.endPrice.minus(wave2.endPrice).dividedBy(wave1Range)
    : wave2.endPrice.minus(wave1.endPrice).dividedBy(wave1Range);
  const rule1Margin = 100 * (1 - clamp01(retracement1));

  // Rule 2: Wave 3 is never the shortest of Waves 1, 3, and 5.
  const wave1Distance = distance(wave1);
  const wave3Distance = distance(wave3);
  const wave5Distance = distance(wave5);
  const isWave3Shortest = wave3Distance.lessThan(wave1Distance) && wave3Distance.lessThan(wave5Distance);
  if (isWave3Shortest) return null;
  const shortestOther = Prisma.Decimal.min(wave1Distance, wave5Distance);
  const rule2Margin = shortestOther.greaterThan(0) ? Math.min(100, Math.max(0, wave3Distance.minus(shortestOther).dividedBy(shortestOther).toNumber() * 100)) : 100;

  // Rule 3: Wave 4 never enters Wave 1's price territory.
  const rule3Valid = isBullish ? wave4.endPrice.greaterThan(wave1.endPrice) : wave4.endPrice.lessThan(wave1.endPrice);
  if (!rule3Valid) return null;
  const wave3Range = distance(wave3);
  const rule3Margin = wave3Range.greaterThan(0)
    ? 100 *
      clamp01(isBullish ? wave4.endPrice.minus(wave1.endPrice).dividedBy(wave3Range) : wave1.endPrice.minus(wave4.endPrice).dividedBy(wave3Range))
    : 0;

  return {
    direction: candidate.direction,
    legs: candidate.legs,
    invalidation: buildInvalidation(candidate),
    ruleMargins: { rule1: rule1Margin, rule2: rule2Margin, rule3: rule3Margin },
  };
}
