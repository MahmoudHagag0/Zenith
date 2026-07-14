import { Prisma } from '@zenith/database';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { LabeledConfidence } from '../analysis-provider.types';
import type { WyckoffPhaseHypothesis, WyckoffSideEvents } from './wyckoff.types';

/**
 * Disclosed, named calibration constants (S1-009 Sprint Brief, Missing
 * Decisions) for Wyckoff's four Confidence-taxonomy values (S1-008's
 * generic `ConfidenceKind`s — this file supplies Wyckoff's own numbers,
 * it does not define the taxonomy itself).
 */

/**
 * Methodology Confidence Ceiling for `'WYCKOFF'` — reflects Wyckoff's
 * disclosed source-verified status (the architecture document's own
 * example of a methodology carrying a *higher* ceiling than ICT/SMC
 * specifically — `22_ANALYSIS_ENGINE_ARCHITECTURE.md`, Confidence
 * Model). No result from this Provider may report a confidence above
 * this value.
 */
export const METHODOLOGY_CONFIDENCE_CEILING = 85;

/** Every accumulation/distribution schematic has 8 possible events; Detection Confidence scales with how many were actually found. */
const MAX_SCHEMATIC_EVENTS = 8;

/** How much Regime-Adjusted Confidence is scaled down when the Regime/Context Service reads TRENDING — range-based phase analysis is a ranging-market technique. */
const TRENDING_REGIME_PENALTY = 0.6;

function capped(value: number): Prisma.Decimal {
  return Prisma.Decimal.min(new Prisma.Decimal(value), METHODOLOGY_CONFIDENCE_CEILING);
}

/** How well the detected event sequence fits the full 8-event schematic — one value per result, not per hypothesis. */
export function buildDetectionConfidence(sideEvents: WyckoffSideEvents): LabeledConfidence {
  const rawScore = (sideEvents.events.length / MAX_SCHEMATIC_EVENTS) * 100;
  return {
    kind: 'DETECTION',
    value: capped(rawScore),
    explanation: `${sideEvents.events.length} of ${MAX_SCHEMATIC_EVENTS} ${sideEvents.side.toLowerCase()} schematic events detected, capped at the Methodology Confidence Ceiling.`,
  };
}

/** Wraps a phase hypothesis's own score as its Interpretation Confidence, ranking entries within the bounded `interpretation[]`. */
export function buildInterpretationConfidence(hypothesis: WyckoffPhaseHypothesis): LabeledConfidence {
  return {
    kind: 'INTERPRETATION',
    value: capped(hypothesis.score),
    explanation: hypothesis.summary,
  };
}

/**
 * Scales a hypothesis's Interpretation Confidence down when the
 * Regime/Context Service reads `TRENDING` — range-based Wyckoff phase
 * analysis is fundamentally a ranging-market technique, and Confidence
 * must say so rather than silently staying high just because a range
 * was structurally identifiable.
 */
export function buildRegimeAdjustedConfidence(hypothesis: WyckoffPhaseHypothesis, regimeResult: RegimeContextResult): LabeledConfidence {
  const multiplier = regimeResult.trendState === 'TRENDING' ? TRENDING_REGIME_PENALTY : 1;
  const rawScore = hypothesis.score * multiplier;
  return {
    kind: 'REGIME_ADJUSTED',
    value: capped(rawScore),
    explanation:
      regimeResult.trendState === 'TRENDING'
        ? `Scaled down (${(TRENDING_REGIME_PENALTY * 100).toFixed(0)}% of Interpretation Confidence): the broader regime currently reads TRENDING, and range-based phase analysis is a ranging-market technique.`
        : 'Not scaled down: the broader regime reads RANGING, consistent with range-based phase analysis.',
  };
}

/** Constant per Provider, not per result — Wyckoff's own disclosed ceiling, reported alongside every output. */
export function buildMethodologyConfidenceCeiling(): LabeledConfidence {
  return {
    kind: 'METHODOLOGY_CEILING',
    value: new Prisma.Decimal(METHODOLOGY_CONFIDENCE_CEILING),
    explanation: "Wyckoff's Three Laws are a source-verified methodology, carrying a higher ceiling than methodologies lacking an independent primary source (e.g. ICT/SMC).",
  };
}
