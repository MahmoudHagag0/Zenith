import type { WaveCountCandidate } from './elliott-wave.types';

/** Bounded, disclosed maximum for the wave-count `interpretation[]` (S1-011 Sprint Brief, Missing Decisions) — an unbounded search is not authorized. */
const MAX_WAVE_COUNT_HYPOTHESES = 2;

/** A Rule margin or guideline proximity score below this is disclosed as a weakness (Implementation Guidance #5), not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

function buildSurvivalReasons(candidate: WaveCountCandidate): string[] {
  const { rule1, rule2, rule3 } = candidate.ruleMargins;
  return [
    `Satisfies Rule 1 (Wave 2's retracement stayed within Wave 1's own range; margin score ${rule1.toFixed(0)}).`,
    `Satisfies Rule 2 (Wave 3 is not the shortest of Waves 1, 3, and 5; margin score ${rule2.toFixed(0)}).`,
    `Satisfies Rule 3 (Wave 4 stayed clear of Wave 1's price territory; margin score ${rule3.toFixed(0)}).`,
  ];
}

function buildWeaknesses(candidate: WaveCountCandidate): string[] {
  const weaknesses: string[] = [];
  const ruleLabels: Record<'rule1' | 'rule2' | 'rule3', string> = { rule1: 'Rule 1', rule2: 'Rule 2', rule3: 'Rule 3' };

  for (const key of ['rule1', 'rule2', 'rule3'] as const) {
    const margin = candidate.ruleMargins[key];
    if (margin < WEAKNESS_THRESHOLD) {
      weaknesses.push(`${ruleLabels[key]} was satisfied only narrowly (margin score ${margin.toFixed(0)}) — a small additional move in the opposite direction would have invalidated this count via ${ruleLabels[key]}.`);
    }
  }

  for (const check of candidate.guidelineChecks) {
    if (check.proximityScore < WEAKNESS_THRESHOLD) {
      weaknesses.push(`${check.label} (nearest guideline ratio ${check.nearestGuidelineRatio}) landed far from that ratio (proximity score ${check.proximityScore.toFixed(0)}), weakening confidence in this count's precision.`);
    }
  }

  return weaknesses;
}

/**
 * Ranks Rule-validated, Fibonacci-scored candidates by `guidelineScore`
 * (highest first) and bounds the result at `MAX_WAVE_COUNT_HYPOTHESES`
 * (S1-011 Sprint Brief, Scope item 5) — never an unbounded search.
 * Populates each surviving candidate's `survivalReasons`/`weaknesses`,
 * the concrete expression of Implementation Guidance #5's transparency
 * requirement: every hypothesis is disclosed as the strongest currently-
 * surviving interpretation of the evidence (Implementation Guidance #6),
 * never as an objectively correct count.
 */
export function finalizeWaveCountHypotheses(candidates: readonly WaveCountCandidate[]): WaveCountCandidate[] {
  return [...candidates]
    .sort((a, b) => b.guidelineScore - a.guidelineScore)
    .slice(0, MAX_WAVE_COUNT_HYPOTHESES)
    .map((candidate) => ({ ...candidate, survivalReasons: buildSurvivalReasons(candidate), weaknesses: buildWeaknesses(candidate) }));
}
