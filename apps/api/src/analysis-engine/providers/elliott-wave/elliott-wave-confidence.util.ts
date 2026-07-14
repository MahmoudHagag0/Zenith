import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { WaveCountCandidate } from './elliott-wave.types';

/**
 * Disclosed, named calibration constants (S1-011 Sprint Brief, Missing
 * Decisions) for Elliott Wave's four Confidence-taxonomy values (S1-008's
 * generic `ConfidenceKind`s — this file supplies this Provider's own
 * numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'ELLIOTT_WAVE'` — independently
 * calibrated, reflecting a genuine documented primary source (R.N.
 * Elliott's own writings) that is nonetheless decades older and less
 * immediately accessible than a more actively-maintained modern
 * curriculum, and a methodology whose real-world application is widely
 * documented to admit multiple simultaneously-defensible readings. No
 * result from this Provider may report a confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 75;

/** Strengthens a reading when the Regime/Context Service reads TRENDING; weakens it when RANGING -- an impulse-wave count is fundamentally a trending-market structure. */
const TRENDING_MULTIPLIER = 1.2;
const RANGING_MULTIPLIER = 0.7;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/**
 * How comfortably this candidate's weakest Rule was satisfied — one
 * value per result, not per hypothesis (the *primary*, i.e. highest-
 * ranked, surviving hypothesis's own margins). The weakest link
 * determines overall structural confidence, directly preventing a count
 * that barely squeaked past a Rule from reading as highly confident
 * (Implementation Guidance #5).
 */
export function buildDetectionConfidence(primary: WaveCountCandidate): LabeledConfidence {
  const weakestMargin = Math.min(primary.ruleMargins.rule1, primary.ruleMargins.rule2, primary.ruleMargins.rule3);
  return {
    kind: 'DETECTION',
    value: capped(weakestMargin),
    explanation: `The weakest of this count's three Rule margins is ${weakestMargin.toFixed(0)} (0-100) -- the weakest link determines overall structural confidence, capped at the Methodology Confidence Ceiling.`,
  };
}

/** Wraps a candidate's own Fibonacci-guideline score as its Interpretation Confidence, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(candidate: WaveCountCandidate): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(candidate.guidelineScore),
    explanation: `Fibonacci-guideline proximity score ${candidate.guidelineScore.toFixed(0)} (0-100) across Wave 2/Wave 4 retracement and Wave 3 extension checks.`,
  };
}

/**
 * Strengthens this candidate's reading when the Regime/Context Service
 * reads `TRENDING`, weakens it when `RANGING` -- an impulse-wave count is
 * fundamentally a trending-market structure, a third distinct pattern
 * from either prior Provider's own Regime-Adjusted Confidence rule.
 */
export function buildRegimeAdjustedConfidence(candidate: WaveCountCandidate, regimeResult: RegimeContextResult): LabeledConfidence {
  const multiplier = regimeResult.trendState === 'TRENDING' ? TRENDING_MULTIPLIER : RANGING_MULTIPLIER;
  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(candidate.guidelineScore * multiplier),
    explanation:
      regimeResult.trendState === 'TRENDING'
        ? `Strengthened (${(TRENDING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): an impulse-wave count is a trending-market structure, and the broader regime currently reads TRENDING.`
        : `Weakened (${(RANGING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime currently reads RANGING, and an impulse-wave count is fundamentally a trending-market structure.`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's methodology has a genuine documented primary source, but that source is decades old, less immediately accessible, and widely documented to admit multiple simultaneously-defensible readings in practice -- an independently calibrated ceiling, reflecting neither full source-verified confidence nor the absence of any primary source.",
  };
}
