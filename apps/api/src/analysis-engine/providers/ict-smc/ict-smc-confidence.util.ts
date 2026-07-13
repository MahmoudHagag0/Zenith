import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { IctSmcBiasHypothesis } from './ict-smc.types';

/**
 * Disclosed, named calibration constants (S1-010 Sprint Brief, Missing
 * Decisions) for ICT/SMC's four Confidence-taxonomy values (S1-008's
 * generic `ConfidenceKind`s — this file supplies this Provider's own
 * numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'ICT_SMC'` — reflects this
 * methodology's disclosed, source-unverified status: its vocabulary
 * originates from modern retail trading education with no independent
 * institutional verification, unlike a source-verified methodology (e.g.
 * S1-009's Provider, ceiling `85`). No result from this Provider may
 * report a confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 60;

/** An expected floor for a strong reading; Detection Confidence scales with how many primitives were actually found relative to this. */
const MAX_TRACKED_PRIMITIVES = 6;

/** Order-Block-driven (continuation) readings strengthen in a TRENDING regime, weaken in RANGING. */
const CONTINUATION_TRENDING_MULTIPLIER = 1.2;
const CONTINUATION_RANGING_MULTIPLIER = 0.7;
/** Liquidity-Sweep-driven (reversal) readings strengthen in a RANGING regime, weaken in TRENDING -- the mirror-image direction of the continuation rule above. */
const REVERSAL_RANGING_MULTIPLIER = 1.2;
const REVERSAL_TRENDING_MULTIPLIER = 0.7;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/** How well the total detected primitive count fits an expected strong reading -- one value per result, not per hypothesis. */
export function buildDetectionConfidence(totalPrimitives: number): LabeledConfidence {
  const rawScore = (totalPrimitives / MAX_TRACKED_PRIMITIVES) * 100;
  return {
    kind: 'DETECTION',
    value: capped(rawScore),
    explanation: `${totalPrimitives} of an expected ${MAX_TRACKED_PRIMITIVES}+ Order Block/Fair Value Gap/Liquidity Sweep primitives detected, capped at the Methodology Confidence Ceiling.`,
  };
}

/** Wraps a bias hypothesis's own score as its Interpretation Confidence, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(hypothesis: IctSmcBiasHypothesis): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(hypothesis.score),
    explanation: hypothesis.summary,
  };
}

/**
 * Order-Block-driven (continuation) readings strengthen when the
 * Regime/Context Service reads `TRENDING`; Liquidity-Sweep-driven
 * (reversal) readings strengthen when it reads `RANGING` -- the
 * mirror-image direction of the rule established for S1-009's Provider
 * (which penalizes TRENDING uniformly), not a copy of it. Neither
 * direction is scaled when Order Block and Liquidity Sweep evidence tie
 * for a hypothesis (S1-010 Sprint Brief, Scope item 7).
 */
export function buildRegimeAdjustedConfidence(hypothesis: IctSmcBiasHypothesis, regimeResult: RegimeContextResult): LabeledConfidence {
  if (hypothesis.dominantPrimitive === 'NEUTRAL') {
    return {
      kind: 'REGIME_ADJUSTED',
      value: capped(hypothesis.score),
      explanation: 'Not scaled: this reading is not clearly continuation- or reversal-dominant (Order Block and Liquidity Sweep evidence tie).',
    };
  }

  const isContinuation = hypothesis.dominantPrimitive === 'ORDER_BLOCK';
  const multiplier = isContinuation
    ? regimeResult.trendState === 'TRENDING'
      ? CONTINUATION_TRENDING_MULTIPLIER
      : CONTINUATION_RANGING_MULTIPLIER
    : regimeResult.trendState === 'RANGING'
      ? REVERSAL_RANGING_MULTIPLIER
      : REVERSAL_TRENDING_MULTIPLIER;
  const strengthened = multiplier > 1;

  const explanation = isContinuation
    ? strengthened
      ? `Strengthened (${(CONTINUATION_TRENDING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): Order-Block-driven continuation readings are strengthened when the broader regime reads TRENDING.`
      : `Weakened (${(CONTINUATION_RANGING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this Order-Block-driven continuation reading is weaker when the broader regime reads RANGING.`
    : strengthened
      ? `Strengthened (${(REVERSAL_RANGING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): Liquidity-Sweep-driven reversal readings are strengthened when the broader regime reads RANGING.`
      : `Weakened (${(REVERSAL_TRENDING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): this Liquidity-Sweep-driven reversal reading is weaker when the broader regime reads TRENDING.`;

  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(hypothesis.score * multiplier),
    explanation,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's vocabulary originates from modern retail trading education with no independent institutional verification, unlike a source-verified methodology -- carrying a disclosed, lower ceiling.",
  };
}
