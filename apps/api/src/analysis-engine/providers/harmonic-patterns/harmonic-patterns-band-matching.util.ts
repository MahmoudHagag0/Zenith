import type { HarmonicPatternCandidate, LegRatioCheck, PatternInvalidation, PatternRatioTable, RatioBand, RawPatternCandidate } from './harmonic-patterns.types';
import { ALL_PATTERN_RATIO_TABLES, computeLegRatios } from './harmonic-patterns-ratio-tables.util';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 0-100; how far `actual` sits from `band`'s own nearer edge, as a fraction of the band's half-width -- 100 = at the band's center, 0 = at either edge, negative-clamped to 0 outside the band (never reached here, since only band members are scored). */
function marginScore(actual: number, band: RatioBand): number {
  const halfWidth = (band.max - band.min) / 2;
  if (halfWidth <= 0) return 100;
  const center = (band.min + band.max) / 2;
  const distanceFromCenter = Math.abs(actual - center);
  return clamp(100 * (1 - distanceFromCenter / halfWidth), 0, 100);
}

/** 0-100; how close `actual` sits to `band.ideal` -- a genuinely distinct signal from `marginScore` (center-of-band vs. cited-ideal-value), scored via the same half-width tolerance. */
function idealProximityScore(actual: number, band: RatioBand): number {
  const halfWidth = (band.max - band.min) / 2;
  if (halfWidth <= 0) return 100;
  const distanceFromIdeal = Math.abs(actual - band.ideal);
  return clamp(100 * (1 - distanceFromIdeal / halfWidth), 0, 100);
}

function withinBand(actual: number, band: RatioBand): boolean {
  return actual >= band.min && actual <= band.max;
}

function buildInvalidation(candidate: RawPatternCandidate, adBand: RatioBand): PatternInvalidation {
  const [xa] = candidate.legs;
  const xaRange = xa.endPrice.minus(xa.startPrice);
  // The AD band's own far edge (the more extreme of its two bounds relative to X), projected
  // to a price level via the XA leg's own signed range -- beyond this level, the D-point
  // completion zone this hypothesis depends on is violated.
  const farRatio = Math.max(adBand.min, adBand.max);
  const level = xa.endPrice.minus(xaRange.times(farRatio));
  const direction = candidate.direction === 'BULLISH' ? 'below' : 'above';
  return {
    level,
    description: `A subsequent close ${direction} ${level.toFixed(2)} (beyond this pattern's own D-point completion zone) would invalidate this reading.`,
  };
}

/**
 * Checks a raw candidate's four computed ratios against **every** named
 * pattern's own bands independently (S1-013 Sprint Brief, Scope items 5,
 * 6) -- never picking a single "best match": a candidate whose ratios
 * satisfy more than one pattern's bands near a shared boundary produces
 * one independent `HarmonicPatternCandidate` per matched pattern, never
 * merged or averaged (Risks, "Cross-pattern ambiguity risk"). A candidate
 * matching zero patterns is not a Harmonic Pattern hypothesis at all --
 * returns an empty array, never a low-confidence guess for a non-match.
 *
 * Also computes each surviving match's Detection Confidence basis (the
 * minimum `marginScore` across the four ratio checks -- the weakest leg
 * determines overall confidence, the same "weakest link" idiom applied
 * consistently across every bounded-hypothesis Provider in this system)
 * and the disclosed, forward-looking `PatternInvalidation` every
 * surviving hypothesis carries.
 *
 * `tables` defaults to the real, disclosed `ALL_PATTERN_RATIO_TABLES` for
 * every production caller; the parameter exists so a unit test can prove
 * the "check every table independently, never merge" mechanism itself
 * with a synthetic overlapping-bands fixture (`*.spec.ts`) — with the
 * real, honestly-sourced ratio tables, the four patterns' own `ad` bands
 * happen to be mutually disjoint (each pattern's own primary
 * differentiator, consistent with how the methodology is taught), so
 * genuine simultaneous multi-pattern matches are rare in practice; the
 * mechanism itself must still be proven correct independent of whether
 * today's specific tables happen to exercise it.
 */
export function matchPatternTypes(candidate: RawPatternCandidate, tables: readonly PatternRatioTable[] = ALL_PATTERN_RATIO_TABLES): HarmonicPatternCandidate[] {
  const ratios = computeLegRatios(candidate);
  const matches: HarmonicPatternCandidate[] = [];

  for (const table of tables) {
    const withinAll = withinBand(ratios.ab, table.ab) && withinBand(ratios.bc, table.bc) && withinBand(ratios.cd, table.cd) && withinBand(ratios.ad, table.ad);
    if (!withinAll) continue;

    const ratioChecks: LegRatioCheck[] = [
      { label: 'AB', actualRatio: ratios.ab, band: table.ab, marginScore: marginScore(ratios.ab, table.ab), idealProximityScore: idealProximityScore(ratios.ab, table.ab) },
      { label: 'BC', actualRatio: ratios.bc, band: table.bc, marginScore: marginScore(ratios.bc, table.bc), idealProximityScore: idealProximityScore(ratios.bc, table.bc) },
      { label: 'CD', actualRatio: ratios.cd, band: table.cd, marginScore: marginScore(ratios.cd, table.cd), idealProximityScore: idealProximityScore(ratios.cd, table.cd) },
      { label: 'AD', actualRatio: ratios.ad, band: table.ad, marginScore: marginScore(ratios.ad, table.ad), idealProximityScore: idealProximityScore(ratios.ad, table.ad) },
    ];
    const detectionScore = Math.min(...ratioChecks.map((check) => check.marginScore));

    matches.push({
      patternType: table.patternType,
      direction: candidate.direction,
      legs: candidate.legs,
      ratioChecks,
      detectionScore,
      interpretationScore: 0, // populated by WP4 (harmonic-patterns-interpretation-scoring.util.ts)
      timeSymmetryScore: 0, // populated by WP4 (harmonic-patterns-interpretation-scoring.util.ts)
      invalidation: buildInvalidation(candidate, table.ad),
      survivalReasons: [],
      weaknesses: [],
    });
  }

  return matches;
}
