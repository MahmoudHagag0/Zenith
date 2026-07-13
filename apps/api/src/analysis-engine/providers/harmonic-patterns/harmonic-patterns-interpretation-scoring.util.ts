import type { HarmonicPatternCandidate } from './harmonic-patterns.types';

/**
 * Scores a band-matched candidate's Interpretation Confidence basis
 * (S1-013 Sprint Brief, Scope item 7) — **non-binding**, contributing to
 * ranking within the bounded `interpretation[]` only, never to survival
 * (already decided in `harmonic-patterns-band-matching.util.ts` and never
 * revisited here). Two genuinely distinct signals, averaged:
 *
 *   1. **Ideal-ratio proximity** — how close each of the four computed
 *      ratios sits to its matched pattern's own cited *ideal* value
 *      (`LegRatioCheck.idealProximityScore`, WP3) — distinct from
 *      Detection Confidence's band-*edge* margin (a candidate can sit
 *      exactly at a band's center yet still be an imperfect match to that
 *      specific pattern's own cited textbook ratio, if the center and the
 *      ideal differ).
 *   2. **AB=CD time symmetry** — a widely-cited secondary harmonic
 *      confirmation (Carney, and the broader harmonic-trading literature)
 *      that the AB and CD legs' own calendar-time durations should be
 *      comparable. Scored as the shorter duration's fraction of the
 *      longer (100 = identical duration, decaying toward 0 as they
 *      diverge) — a genuinely additional signal, not a restatement of
 *      price-ratio conformance.
 */
export function scoreInterpretation(candidate: HarmonicPatternCandidate): HarmonicPatternCandidate {
  const idealProximityAverage = candidate.ratioChecks.reduce((sum, check) => sum + check.idealProximityScore, 0) / candidate.ratioChecks.length;

  const abLeg = candidate.legs.find((leg) => leg.label === 'AB')!;
  const cdLeg = candidate.legs.find((leg) => leg.label === 'CD')!;
  const abDurationMs = abLeg.endTimestamp.getTime() - abLeg.startTimestamp.getTime();
  const cdDurationMs = cdLeg.endTimestamp.getTime() - cdLeg.startTimestamp.getTime();
  const longer = Math.max(abDurationMs, cdDurationMs);
  const shorter = Math.min(abDurationMs, cdDurationMs);
  const timeSymmetryScore = longer > 0 ? 100 * (shorter / longer) : 100;

  const interpretationScore = (idealProximityAverage + timeSymmetryScore) / 2;

  return { ...candidate, interpretationScore, timeSymmetryScore };
}
