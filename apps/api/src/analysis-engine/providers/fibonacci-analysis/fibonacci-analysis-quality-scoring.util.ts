import { Prisma } from '@zenith/database';
import type { FibonacciCandidate, FibonacciQualityScore, ReactionState } from './fibonacci-analysis.types';
import { CONFLUENCE_TOLERANCE_ATR_MULTIPLE } from './fibonacci-analysis-confluence.util';

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): the number of independently-agreeing legs that earns a full confluence score of 100. */
const CONFLUENCE_FULL_SCORE_LEG_COUNT = 3;

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): a standalone (non-clustered) level's own precision score, keyed by the Indicator Engine's own disclosed `isTrueFibonacciRatio` distinction. */
const TRUE_RATIO_PRECISION_SCORE = 100;
const CONVENTION_RATIO_PRECISION_SCORE = 60;

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): the reaction-state multiplier applied to a candidate's own quality score for Interpretation Confidence. */
const REACTION_MULTIPLIERS: Record<ReactionState, number> = {
  UNTESTED: 1.0,
  RESPECTED: 1.15,
  BROKEN: 0.3,
};

/**
 * The disclosed measurements a candidate's own Detection Confidence is
 * built from (S1-017 Sprint Brief, Scope item 6): a confluence score (how
 * many independent legs agree here -- the more independent agreement,
 * the stronger the claim) and a precision score (how tightly the
 * contributing levels cluster, or, for a standalone level, whether it is
 * a true Fibonacci ratio or the `0.5` convention-only level) -- the
 * weaker of the two determining overall quality, the same "weakest link"
 * idiom as every prior bounded-hypothesis Provider, computed here from
 * Fibonacci-specific measurements no other Provider uses.
 */
export function scoreQuality(candidate: FibonacciCandidate, atrValue: Prisma.Decimal): FibonacciQualityScore {
  const confluenceScore = Math.min(100, (candidate.confluenceCount / CONFLUENCE_FULL_SCORE_LEG_COUNT) * 100);

  let precisionScore: number;
  if (candidate.confluenceCount >= 2) {
    const prices = candidate.contributingLevels.map((level) => level.price);
    const maxPrice = Prisma.Decimal.max(...prices);
    const minPrice = Prisma.Decimal.min(...prices);
    const spreadAtrRatio = atrValue.isZero() ? new Prisma.Decimal(0) : maxPrice.minus(minPrice).dividedBy(atrValue);
    precisionScore = Prisma.Decimal.max(new Prisma.Decimal(100).minus(spreadAtrRatio.dividedBy(CONFLUENCE_TOLERANCE_ATR_MULTIPLE).times(100)), 0).toNumber();
  } else {
    precisionScore = candidate.contributingLevels[0].isTrueFibonacciRatio ? TRUE_RATIO_PRECISION_SCORE : CONVENTION_RATIO_PRECISION_SCORE;
  }

  const value = Math.min(confluenceScore, precisionScore);

  return {
    value,
    confluenceScore,
    precisionScore,
    explanation: `Confluence score ${confluenceScore.toFixed(0)} (${candidate.confluenceCount} independent leg(s) agreeing) and precision score ${precisionScore.toFixed(0)} -- the weaker of the two determines this reading's own Detection Confidence.`,
  };
}

/** Decays (or strengthens) a candidate's own quality score by its reaction state (S1-017 Sprint Brief, Scope item 6) -- `RESPECTED` strengthens a reading already proven to hold at least once; `BROKEN` weakens a reading whose own claim has since failed. */
export function scoreInterpretation(qualityScore: FibonacciQualityScore, reactionState: ReactionState): number {
  return qualityScore.value * REACTION_MULTIPLIERS[reactionState];
}
