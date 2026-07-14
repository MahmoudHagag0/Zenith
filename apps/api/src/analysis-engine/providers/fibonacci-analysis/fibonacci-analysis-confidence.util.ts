import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { FibonacciHypothesis } from './fibonacci-analysis.types';

/**
 * Disclosed, named calibration constants (S1-017 Sprint Brief, Missing
 * Decisions) for Fibonacci Analysis's four Confidence-taxonomy values
 * (S1-008's generic `ConfidenceKind`s — this file supplies this
 * Provider's own numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'FIBONACCI_ANALYSIS'` —
 * independently calibrated: the underlying ratio mathematics have an
 * unusually solid, precisely-dated primary source (Leonardo of Pisa's
 * "Liber Abaci," 1202, already cited by the Indicator Engine's own
 * Fibonacci calculator) -- stronger sourcing than any other registered
 * methodology's own trading-application text -- but the trading
 * application itself (confluence-zone theory, respected-vs-broken
 * conventions) is decentralized across independent retail-trading
 * educators, the same sourcing category as several other registered
 * methodologies. No result from this Provider may report a confidence
 * above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 72;

/** Strengthens a reading when the broader regime favors this reading's own dominant level type; weakens it otherwise. */
const FAVORED_MULTIPLIER = 1.15;
const UNFAVORED_MULTIPLIER = 0.85;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/** How well this reading matches this Provider's own confluence/precision definition. */
export function buildDetectionConfidence(hypothesis: FibonacciHypothesis): LabeledConfidence {
  return {
    kind: 'DETECTION',
    value: capped(hypothesis.qualityScore.value),
    explanation: `This reading's own quality score (${hypothesis.qualityScore.value.toFixed(0)}, 0-100) is its Detection Confidence -- ${hypothesis.qualityScore.explanation}`,
  };
}

/** This reading's own quality score, adjusted by its reaction state, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(hypothesis: FibonacciHypothesis): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(hypothesis.interpretationScore),
    explanation: `This reading's own quality score, adjusted by its reaction state (${hypothesis.reactionState}), is ${hypothesis.interpretationScore.toFixed(0)} (0-100).`,
  };
}

/**
 * Strengthens a retracement-dominant reading when the Regime/Context
 * Service reads `volatilityState: 'LOW'` (a precise pullback is a
 * cleaner claim in orderly conditions), weakens it when `'HIGH'`;
 * strengthens an extension-dominant reading when it reads `'HIGH'`
 * (reaching a projected target beyond the prior move requires genuine
 * range expansion), weakens it when `'LOW'` -- a genuinely distinct
 * bifurcating variable (retracement-vs-extension level type) from every
 * prior Provider's own rule, even where the underlying `volatilityState`
 * axis is shared.
 */
export function buildRegimeAdjustedConfidence(hypothesis: FibonacciHypothesis, regimeResult: RegimeContextResult): LabeledConfidence {
  const interpretationValue = buildInterpretationConfidence(hypothesis).value.toNumber();
  const isRetracement = hypothesis.candidate.dominantType === 'RETRACEMENT';
  const favoredVolatility = isRetracement ? 'LOW' : 'HIGH';
  const favored = regimeResult.volatilityState === favoredVolatility;
  const multiplier = favored ? FAVORED_MULTIPLIER : UNFAVORED_MULTIPLIER;

  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(interpretationValue * multiplier),
    explanation: favored
      ? `Strengthened (${(FAVORED_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this ${hypothesis.candidate.dominantType.toLowerCase()}-dominant reading's own claim is stronger alongside the broader regime's current volatilityState=${regimeResult.volatilityState} read.`
      : `Weakened (${(UNFAVORED_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime's current volatilityState=${regimeResult.volatilityState} read works against this ${hypothesis.candidate.dominantType.toLowerCase()}-dominant reading's own claim.`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's underlying ratio mathematics carry an unusually solid, precisely-dated primary source -- but the trading application built on top of them is decentralized across many independent retail-trading educators with no single canonical text -- an independently calibrated ceiling reflecting both halves of that sourcing picture honestly.",
  };
}
