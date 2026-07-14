import { Prisma } from '@zenith/database';
import type { FibonacciCandidate, FibonacciHypothesis, FibonacciInvalidation } from './fibonacci-analysis.types';

/** Bounded, disclosed maximum for the proximity-ranked `interpretation[]` (S1-017 Sprint Brief, Missing Decisions) -- an unbounded search is not authorized. */
const MAX_FIBONACCI_HYPOTHESES = 2;

/** A quality/interpretation value below this is disclosed as a weakness, not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

function distanceToPrice(hypothesis: FibonacciHypothesis, currentPrice: Prisma.Decimal): Prisma.Decimal {
  return hypothesis.candidate.price.minus(currentPrice).abs();
}

/**
 * Ranks every confluence zone and standalone level by proximity to
 * current price, bounded at `MAX_FIBONACCI_HYPOTHESES` (S1-017 Sprint
 * Brief, Scope item 4) -- a proximity-based bounding rationale, distinct
 * from every prior Provider's own bounded-hypothesis mechanism (a single
 * boundary-margin check, a one-per-side selection, or a score-ranked
 * cap).
 */
export function selectHypotheses(hypotheses: readonly FibonacciHypothesis[], currentPrice: Prisma.Decimal): FibonacciHypothesis[] {
  return [...hypotheses].sort((a, b) => distanceToPrice(a, currentPrice).minus(distanceToPrice(b, currentPrice)).toNumber()).slice(0, MAX_FIBONACCI_HYPOTHESES);
}

/** The disclosed, forward-looking condition that would invalidate this reading -- the same level/zone price this reading is itself built from, never a separately-estimated level. */
export function buildInvalidation(candidate: Pick<FibonacciCandidate, 'price'>): FibonacciInvalidation {
  return {
    level: candidate.price,
    description: `A decisive close beyond ${candidate.price.toFixed(2)} would invalidate this reading.`,
  };
}

export function buildSurvivalReasons(hypothesis: FibonacciHypothesis): string[] {
  return [hypothesis.qualityScore.explanation, `Reaction reads ${hypothesis.reactionState}.`];
}

export function buildWeaknesses(hypothesis: FibonacciHypothesis): string[] {
  const weaknesses: string[] = [];
  if (hypothesis.interpretationScore < WEAKNESS_THRESHOLD) {
    weaknesses.push(`This reading's own Interpretation score (${hypothesis.interpretationScore.toFixed(0)}) is below the disclosed weakness threshold -- a low-conviction reading.`);
  }
  if (hypothesis.reactionState === 'BROKEN') {
    weaknesses.push('This level has already been broken -- a subsequent return to this level carries a materially higher probability of failing than holding.');
  }
  return weaknesses;
}
