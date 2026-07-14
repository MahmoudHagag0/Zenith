import type { Prisma } from '@zenith/database';
import type { ChartPatternCandidate, PatternPoint, RawChartPatternCandidate, ShapeCriterionCheck } from './classical-chart-patterns.types';

/** How much two prices may differ (as a fraction of their own average) and still be considered "roughly equal" (S1-014 Sprint Brief, Missing Decisions) -- a disclosed, named tolerance, not a silent magic number. */
const SYMMETRY_TOLERANCE_RATIO = 0.1;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findPoint(points: readonly PatternPoint[], label: string): PatternPoint {
  const point = points.find((p) => p.label === label);
  if (!point) throw new Error(`ClassicalChartPatterns: expected point labeled ${label} was not present.`);
  return point;
}

/** Returns `null` if `a`/`b` differ by more than `SYMMETRY_TOLERANCE_RATIO` of their own average (a hard-criterion failure); otherwise a 0-100 margin (100 = identical, decaying to 0 at the tolerance boundary). */
function symmetryCheck(label: string, a: Prisma.Decimal, b: Prisma.Decimal): ShapeCriterionCheck | null {
  const average = a.plus(b).dividedBy(2);
  const diffRatio = a.minus(b).abs().dividedBy(average).toNumber();
  if (diffRatio > SYMMETRY_TOLERANCE_RATIO) return null;
  return { label, marginScore: clamp(100 * (1 - diffRatio / SYMMETRY_TOLERANCE_RATIO), 0, 100) };
}

function averagePrice(...prices: Prisma.Decimal[]): Prisma.Decimal {
  return prices.reduce((sum, p) => sum.plus(p)).dividedBy(prices.length);
}

function applyHeadAndShouldersCriteria(candidate: RawChartPatternCandidate): ChartPatternCandidate | null {
  const { points, patternType, direction } = candidate;
  const leftShoulder = findPoint(points, 'LEFT_SHOULDER');
  const head = findPoint(points, 'HEAD');
  const rightShoulder = findPoint(points, 'RIGHT_SHOULDER');
  const isTop = patternType === 'HEAD_AND_SHOULDERS';
  const leftFlank = isTop ? findPoint(points, 'LEFT_TROUGH') : findPoint(points, 'LEFT_PEAK');
  const rightFlank = isTop ? findPoint(points, 'RIGHT_TROUGH') : findPoint(points, 'RIGHT_PEAK');

  // Head dominance: a hard, binary requirement (not margin-scored) -- the Head must be the most
  // extreme of the three peaks/troughs, or this is not a Head and Shoulders shape at all.
  const headDominant = isTop
    ? head.price.greaterThan(leftShoulder.price) && head.price.greaterThan(rightShoulder.price)
    : head.price.lessThan(leftShoulder.price) && head.price.lessThan(rightShoulder.price);
  if (!headDominant) return null;

  const shoulderSymmetry = symmetryCheck('SHOULDER_SYMMETRY', leftShoulder.price, rightShoulder.price);
  if (!shoulderSymmetry) return null;
  const necklineLevelness = symmetryCheck('NECKLINE_LEVELNESS', leftFlank.price, rightFlank.price);
  if (!necklineLevelness) return null;

  const shapeChecks = [shoulderSymmetry, necklineLevelness];
  return {
    patternType,
    direction,
    points,
    necklineLevel: averagePrice(leftFlank.price, rightFlank.price),
    shapeChecks,
    detectionScore: Math.min(...shapeChecks.map((c) => c.marginScore)),
    confirmationStatus: 'UNCONFIRMED',
    interpretationScore: 0, // populated by WP4 (classical-chart-patterns-confirmation.util.ts)
    invalidation: { level: head.price, description: '' }, // populated by WP4
    survivalReasons: [],
    weaknesses: [],
  };
}

function applyDoubleTopBottomCriteria(candidate: RawChartPatternCandidate): ChartPatternCandidate | null {
  const { points, patternType, direction } = candidate;
  const isTop = patternType === 'DOUBLE_TOP';
  const first = isTop ? findPoint(points, 'PEAK_1') : findPoint(points, 'TROUGH_1');
  const middle = isTop ? findPoint(points, 'TROUGH') : findPoint(points, 'PEAK');
  const second = isTop ? findPoint(points, 'PEAK_2') : findPoint(points, 'TROUGH_2');

  const peakOrTroughSymmetry = symmetryCheck(isTop ? 'PEAK_SYMMETRY' : 'TROUGH_SYMMETRY', first.price, second.price);
  if (!peakOrTroughSymmetry) return null;

  const shapeChecks = [peakOrTroughSymmetry];
  return {
    patternType,
    direction,
    points,
    necklineLevel: middle.price,
    shapeChecks,
    detectionScore: Math.min(...shapeChecks.map((c) => c.marginScore)),
    confirmationStatus: 'UNCONFIRMED',
    interpretationScore: 0, // populated by WP4
    invalidation: { level: second.price, description: '' }, // populated by WP4
    survivalReasons: [],
    weaknesses: [],
  };
}

/**
 * Applies each pattern family's own hard structural (shape) criteria
 * (S1-014 Sprint Brief, Scope item 4) — a candidate failing any hard
 * criterion is discarded outright (returns `null`), never returned as a
 * low-confidence hypothesis, the same "never a low-confidence guess for a
 * falsified structure" discipline established by every prior Provider in
 * this series. Also computes each candidate's own neckline level (the
 * basis for WP4's confirmation scan) and Detection Confidence basis (the
 * minimum shape-criterion margin -- the weakest criterion determines
 * overall structural confidence).
 */
export function applyShapeCriteria(candidate: RawChartPatternCandidate): ChartPatternCandidate | null {
  return candidate.patternType === 'HEAD_AND_SHOULDERS' || candidate.patternType === 'INVERSE_HEAD_AND_SHOULDERS'
    ? applyHeadAndShouldersCriteria(candidate)
    : applyDoubleTopBottomCriteria(candidate);
}
