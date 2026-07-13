import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { ChartPatternCandidate } from './classical-chart-patterns.types';

/**
 * Disclosed, named calibration constants (S1-014 Sprint Brief, Missing
 * Decisions) for Classical Chart Patterns' four Confidence-taxonomy
 * values (S1-008's generic `ConfidenceKind`s — this file supplies this
 * Provider's own numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'CLASSICAL_CHART_PATTERNS'` —
 * independently calibrated, reflecting this methodology's own primary
 * source's status as an exceptionally well-documented, continuously
 * reprinted, single-lineage reference taught in mainstream technical-
 * analysis curricula since its first edition -- distinct from every
 * other registered methodology's own sourcing profile. No result from
 * this Provider may report a confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 80;

/** Strengthens a reading when the Regime/Context Service reads `TRENDING`; weakens it when `RANGING` -- a reversal pattern's own claim requires a genuine prior trend to reverse, distinct reasoning (though the same `trendState` axis) from any other registered methodology's own rule. */
const TRENDING_MULTIPLIER = 1.15;
const RANGING_MULTIPLIER = 0.75;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/**
 * How comfortably this candidate's weakest shape criterion was satisfied
 * — one value per result, not per hypothesis (the *primary*, i.e.
 * highest-ranked, surviving hypothesis's own margins). The weakest link
 * determines overall structural confidence, directly preventing a shape
 * that barely squeaked past a tolerance from reading as highly confident.
 */
export function buildDetectionConfidence(primary: ChartPatternCandidate): LabeledConfidence {
  return {
    kind: 'DETECTION',
    value: capped(primary.detectionScore),
    explanation: `The weakest of this ${primary.patternType} match's shape-criterion margins is ${primary.detectionScore.toFixed(0)} (0-100) -- the weakest link determines overall structural confidence, capped at the Methodology Confidence Ceiling.`,
  };
}

/** Wraps a candidate's own confirmation-status score as its Interpretation Confidence, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(candidate: ChartPatternCandidate): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(candidate.interpretationScore),
    explanation: `Confirmation-status score ${candidate.interpretationScore.toFixed(0)} (0-100) for this ${candidate.patternType} match (${candidate.confirmationStatus}).`,
  };
}

/**
 * Strengthens this candidate's reading when the Regime/Context Service
 * reads `trendState: 'TRENDING'`, weakens it when `'RANGING'` -- a
 * reversal pattern's own claim (this Provider's entire V1 toolkit is
 * reversal-only) requires a genuine prior trend to reverse in the first
 * place; a "reversal" signal in an already-ranging market is a weaker
 * claim than in a genuinely trending one.
 */
export function buildRegimeAdjustedConfidence(candidate: ChartPatternCandidate, regimeResult: RegimeContextResult): LabeledConfidence {
  const multiplier = regimeResult.trendState === 'TRENDING' ? TRENDING_MULTIPLIER : RANGING_MULTIPLIER;
  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(candidate.interpretationScore * multiplier),
    explanation:
      regimeResult.trendState === 'TRENDING'
        ? `Strengthened (${(TRENDING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): a reversal pattern's own claim requires a genuine prior trend to reverse, and the broader regime currently reads TRENDING.`
        : `Weakened (${(RANGING_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime currently reads RANGING, and a reversal pattern's own claim requires a genuine prior trend to reverse.`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's methodology has an exceptionally well-documented, continuously reprinted, single-lineage primary source, but its exact shape-tolerance numbers are not stated with the same numeric precision as some other registered methodologies' own defining rules -- an independently calibrated ceiling, reflecting neither full source-verified confidence nor the absence of any primary source.",
  };
}
