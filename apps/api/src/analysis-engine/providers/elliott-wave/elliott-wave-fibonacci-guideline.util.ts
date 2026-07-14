import { Prisma } from '@zenith/database';
import type { IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import type { FibonacciGuidelineCheck, RuleValidatedCandidate, WaveCountCandidate } from './elliott-wave.types';

/** How close (as a fraction of the reference wave's own range) an actual price must land to a guideline level to score near 100 -- a disclosed, named constant (S1-011 Sprint Brief, Missing Decisions), not a silent magic number. */
const GUIDELINE_TOLERANCE_RATIO = 0.05;

interface Level {
  readonly ratio: number;
  readonly price: Prisma.Decimal;
}

function scoreProximity(actualPrice: Prisma.Decimal, levels: readonly Level[], referenceRange: Prisma.Decimal, label: string): FibonacciGuidelineCheck {
  let nearest = levels[0];
  let nearestDistance = actualPrice.minus(levels[0].price).abs();
  for (const level of levels.slice(1)) {
    const distance = actualPrice.minus(level.price).abs();
    if (distance.lessThan(nearestDistance)) {
      nearest = level;
      nearestDistance = distance;
    }
  }

  const tolerance = referenceRange.abs().times(GUIDELINE_TOLERANCE_RATIO);
  const proximityScore = tolerance.greaterThan(0) ? Math.max(0, Math.min(100, 100 * (1 - nearestDistance.dividedBy(tolerance).toNumber()))) : 0;

  return { label, actualPrice, nearestGuidelineRatio: nearest.ratio, nearestGuidelinePrice: nearest.price, proximityScore };
}

/**
 * Scores a Rule-validated candidate's proximity to the classic Fibonacci
 * guideline ratios (S1-011 Sprint Brief, Scope item 4) — **non-binding**,
 * contributing to Interpretation Confidence/ranking only, never to
 * candidate survival (already decided in `elliott-wave-rules.util.ts`
 * and never revisited here).
 *
 * Reuses `INDICATOR_ENGINE.fibonacciLevels()` (S1-007, unmodified) for
 * all three checks:
 *   - Wave 2's retracement of Wave 1 — the calculator's native use case
 *     (anchors = Wave 1's own start/end).
 *   - Wave 4's retracement of Wave 3 — same native use case (anchors =
 *     Wave 3's own start/end).
 *   - Wave 3's extension relative to Wave 1 — the calculator's ratio
 *     scale runs from the anchor pair's *end* (ratio 0) back toward its
 *     *start* (ratio 1) and beyond (ratio >1, an "overshoot" of that
 *     retracement); projecting a classic Wave-3-extension *target*
 *     (Wave 1's range scaled 1.618x *beyond* Wave 2's end, in the
 *     impulse's own direction) therefore uses a deliberately reversed
 *     anchor pair (`anchorEnd = Wave 2's end`, `anchorStart = Wave 2's
 *     end + Wave 1's own signed range`) so the same, unmodified API
 *     produces the correct projection rather than a retracement.
 */
export function scoreFibonacciGuidelines(candidate: RuleValidatedCandidate, indicatorEngine: Pick<IndicatorEngine, 'fibonacciLevels'>): WaveCountCandidate {
  const [wave1, wave2, wave3, wave4] = candidate.legs;

  const wave1Levels = indicatorEngine.fibonacciLevels({ anchorStart: wave1.startPrice, anchorEnd: wave1.endPrice });
  const wave2Check = scoreProximity(wave2.endPrice, wave1Levels.levels, wave1.endPrice.minus(wave1.startPrice), 'Wave 2 retracement of Wave 1');

  const wave3Levels = indicatorEngine.fibonacciLevels({ anchorStart: wave3.startPrice, anchorEnd: wave3.endPrice });
  const wave4Check = scoreProximity(wave4.endPrice, wave3Levels.levels, wave3.endPrice.minus(wave3.startPrice), 'Wave 4 retracement of Wave 3');

  const wave1Range = wave1.endPrice.minus(wave1.startPrice);
  const extensionLevels = indicatorEngine.fibonacciLevels({ anchorStart: wave2.endPrice.plus(wave1Range), anchorEnd: wave2.endPrice });
  const trueExtensionLevels = extensionLevels.levels.filter((level) => level.ratio > 1);
  const wave3Check = scoreProximity(wave3.endPrice, trueExtensionLevels, wave1Range, 'Wave 3 extension relative to Wave 1');

  const guidelineChecks = [wave2Check, wave4Check, wave3Check];
  const guidelineScore = guidelineChecks.reduce((sum, check) => sum + check.proximityScore, 0) / guidelineChecks.length;

  return { ...candidate, guidelineChecks, guidelineScore, survivalReasons: [], weaknesses: [] };
}
