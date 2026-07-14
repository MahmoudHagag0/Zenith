import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { HarmonicPatternCandidate } from './harmonic-patterns.types';

/**
 * Disclosed, named calibration constants (S1-013 Sprint Brief, Missing
 * Decisions) for Harmonic Patterns' four Confidence-taxonomy values
 * (S1-008's generic `ConfidenceKind`s — this file supplies this
 * Provider's own numbers, it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'HARMONIC_PATTERNS'` — independently
 * calibrated, reflecting genuine, disclosed ratio-table variance across
 * this methodology's own most-cited competing sources (Gartley's original
 * 1935 shape description predates any Fibonacci-ratio table; Pesavento's
 * 1978 work added the ratios; Carney's 2004 book refined and popularized
 * the modern exact bands) — a decentralized-authorship risk, similar in
 * kind to another registered methodology's own modern retail-education
 * vocabulary variance, yet more numerically consistent across sources.
 * No result from this Provider may report a confidence above this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 65;

/** Strengthens a reading when the Regime/Context Service reads `LOW` volatility; weakens it when `HIGH` -- a genuinely distinct axis from every prior Provider's own `trendState`-based rule: precise Fibonacci-ratio geometry is more trustworthy when price action is clean, and more likely to be a byproduct of noise in a `HIGH`-volatility regime. */
const LOW_VOLATILITY_MULTIPLIER = 1.2;
const HIGH_VOLATILITY_MULTIPLIER = 0.7;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(Math.max(value, 0)), METHODOLOGY_CONFIDENCE_CEILING);
}

/**
 * How comfortably this candidate's weakest ratio-band check was satisfied
 * — one value per result, not per hypothesis (the *primary*, i.e.
 * highest-ranked, surviving hypothesis's own margins). The weakest link
 * determines overall structural confidence, directly preventing a match
 * that barely squeaked inside a band from reading as highly confident.
 */
export function buildDetectionConfidence(primary: HarmonicPatternCandidate): LabeledConfidence {
  return {
    kind: 'DETECTION',
    value: capped(primary.detectionScore),
    explanation: `The weakest of this ${primary.patternType} match's four ratio-band margins is ${primary.detectionScore.toFixed(0)} (0-100) -- the weakest link determines overall structural confidence, capped at the Methodology Confidence Ceiling.`,
  };
}

/** Wraps a candidate's own ideal-ratio-proximity/AB=CD time-symmetry score as its Interpretation Confidence, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(candidate: HarmonicPatternCandidate): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(candidate.interpretationScore),
    explanation: `Ideal-ratio proximity and AB=CD time-symmetry score ${candidate.interpretationScore.toFixed(0)} (0-100) for this ${candidate.patternType} match.`,
  };
}

/**
 * Strengthens this candidate's reading when the Regime/Context Service
 * reads `volatilityState: 'LOW'`, weakens it when `'HIGH'` -- a fourth
 * distinct pattern from every prior Provider's own Regime-Adjusted
 * Confidence rule (all three used `trendState`; this Provider uses
 * `volatilityState`, since geometric ratio precision, not trend
 * direction, is what a harmonic pattern's own claim depends on).
 */
export function buildRegimeAdjustedConfidence(candidate: HarmonicPatternCandidate, regimeResult: RegimeContextResult): LabeledConfidence {
  const multiplier = regimeResult.volatilityState === 'LOW' ? LOW_VOLATILITY_MULTIPLIER : HIGH_VOLATILITY_MULTIPLIER;
  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(candidate.interpretationScore * multiplier),
    explanation:
      regimeResult.volatilityState === 'LOW'
        ? `Strengthened (${(LOW_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime currently reads LOW volatility, and a precise ratio-geometry pattern is more trustworthy when price action is clean.`
        : `Weakened (${(HIGH_VOLATILITY_MULTIPLIER * 100).toFixed(0)}% of Interpretation Confidence): the broader regime currently reads HIGH volatility, where a "clean-looking" ratio match is more likely a byproduct of noise than genuine harmonic structure.`,
  };
}

/** Constant per Provider, not per result -- this Provider's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation:
      "This Provider's methodology has real published ratio tables, but they genuinely vary across its own most-cited competing sources (Gartley, Pesavento, Carney) -- an independently calibrated ceiling, reflecting neither full source-verified confidence nor the absence of any primary source.",
  };
}
