import type { ChartPatternCandidate } from './classical-chart-patterns.types';

/** Bounded, disclosed maximum for the pattern-match `interpretation[]` (S1-014 Sprint Brief, Missing Decisions) — an unbounded search is not authorized. */
const MAX_CHART_PATTERN_HYPOTHESES = 2;

/** A shape-criterion margin below this is disclosed as a weakness, not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

const CONFIRMATION_TEXT: Record<ChartPatternCandidate['confirmationStatus'], string> = {
  UNCONFIRMED: 'still forming -- no confirming close beyond the neckline has occurred yet',
  CONFIRMED: 'confirmed by a subsequent close beyond the neckline',
  VOLUME_CONFIRMED: 'confirmed by a subsequent close beyond the neckline on expanding volume',
};

function buildSurvivalReasons(candidate: ChartPatternCandidate): string[] {
  return candidate.shapeChecks.map((check) => `${check.label} satisfied (margin score ${check.marginScore.toFixed(0)}).`);
}

function buildWeaknesses(candidate: ChartPatternCandidate): string[] {
  return candidate.shapeChecks
    .filter((check) => check.marginScore < WEAKNESS_THRESHOLD)
    .map((check) => `${check.label} was satisfied only narrowly (margin score ${check.marginScore.toFixed(0)}) -- a small additional asymmetry would have disqualified this reading entirely.`);
}

/**
 * Ranks shape-valid, confirmation-scored candidates (across both
 * independent candidate-generation scans) by `interpretationScore`
 * (highest first) and bounds the result at `MAX_CHART_PATTERN_HYPOTHESES`
 * (S1-014 Sprint Brief, Scope item 7) — never an unbounded search.
 * Populates each surviving candidate's `survivalReasons`/`weaknesses`,
 * disclosing why each hypothesis currently holds, its own confirmation
 * status (Scope item 5), what weakens it, and (via `invalidation`,
 * already computed in `classical-chart-patterns-confirmation.util.ts`)
 * what would invalidate it -- the same transparency discipline
 * established across every prior bounded-hypothesis Provider in this
 * system.
 */
export function finalizeChartPatternHypotheses(candidates: readonly ChartPatternCandidate[]): ChartPatternCandidate[] {
  return [...candidates]
    .sort((a, b) => b.interpretationScore - a.interpretationScore)
    .slice(0, MAX_CHART_PATTERN_HYPOTHESES)
    .map((candidate) => ({ ...candidate, survivalReasons: buildSurvivalReasons(candidate), weaknesses: buildWeaknesses(candidate) }));
}

export { CONFIRMATION_TEXT };
