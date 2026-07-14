import type { HarmonicPatternCandidate } from './harmonic-patterns.types';

/** Bounded, disclosed maximum for the pattern-match `interpretation[]` (S1-013 Sprint Brief, Missing Decisions) — an unbounded search is not authorized. */
const MAX_PATTERN_HYPOTHESES = 2;

/** A margin/ideal-proximity/time-symmetry score below this is disclosed as a weakness, not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

function buildSurvivalReasons(candidate: HarmonicPatternCandidate): string[] {
  return candidate.ratioChecks.map(
    (check) =>
      `${check.label} ratio ${check.actualRatio.toFixed(3)} falls within ${candidate.patternType}'s own published band [${check.band.min}-${check.band.max}] (margin score ${check.marginScore.toFixed(0)}).`,
  );
}

function buildWeaknesses(candidate: HarmonicPatternCandidate): string[] {
  const weaknesses: string[] = [];

  for (const check of candidate.ratioChecks) {
    if (check.marginScore < WEAKNESS_THRESHOLD) {
      weaknesses.push(`${check.label} ratio ${check.actualRatio.toFixed(3)} sits close to ${candidate.patternType}'s own band edge (margin score ${check.marginScore.toFixed(0)}) — a small additional move would have disqualified this reading entirely.`);
    }
    if (check.idealProximityScore < WEAKNESS_THRESHOLD) {
      weaknesses.push(`${check.label} ratio ${check.actualRatio.toFixed(3)} landed far from ${candidate.patternType}'s own cited ideal value ${check.band.ideal} (proximity score ${check.idealProximityScore.toFixed(0)}), weakening confidence in this reading's precision.`);
    }
  }

  return weaknesses;
}

/**
 * Ranks band-matched, Interpretation-scored candidates (across every
 * window and every matched pattern type) by `interpretationScore`
 * (highest first) and bounds the result at `MAX_PATTERN_HYPOTHESES`
 * (S1-013 Sprint Brief, Scope item 8) — never an unbounded search, and
 * never merging distinct pattern-type matches for the same window into
 * one (Scope item 5's own cross-pattern-ambiguity design). Populates each
 * surviving candidate's `survivalReasons`/`weaknesses`, disclosing why
 * each hypothesis currently holds, what weakens it, and (via
 * `invalidation`, already computed in `harmonic-patterns-band-matching.util.ts`)
 * what would invalidate it — the same three-part transparency discipline
 * established across every prior bounded-hypothesis Provider in this
 * system.
 */
export function finalizeHarmonicHypotheses(candidates: readonly HarmonicPatternCandidate[]): HarmonicPatternCandidate[] {
  return [...candidates]
    .sort((a, b) => b.interpretationScore - a.interpretationScore)
    .slice(0, MAX_PATTERN_HYPOTHESES)
    .map((candidate) => ({ ...candidate, survivalReasons: buildSurvivalReasons(candidate), weaknesses: buildWeaknesses(candidate) }));
}
