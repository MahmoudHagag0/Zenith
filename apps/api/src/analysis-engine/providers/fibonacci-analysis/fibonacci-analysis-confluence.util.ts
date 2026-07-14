import { Prisma } from '@zenith/database';
import type { FibonacciCandidate, LevelType, RawFibonacciLevel } from './fibonacci-analysis.types';

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): the ATR-relative tolerance within which independently-derived levels from different legs are read as genuine confluence, not coincidence. */
export const CONFLUENCE_TOLERANCE_ATR_MULTIPLE = 0.5;

function dominantType(levels: readonly RawFibonacciLevel[]): LevelType {
  const retracementCount = levels.filter((level) => level.type === 'RETRACEMENT').length;
  return retracementCount >= levels.length - retracementCount ? 'RETRACEMENT' : 'EXTENSION';
}

/**
 * Groups levels from *independent* legs whose prices fall within a
 * disclosed ATR-relative tolerance into a confluence zone (S1-017 Sprint
 * Brief, Scope item 3) -- this methodology's own defining analytical
 * claim, a mechanism no prior Provider has. Two ratios from the *same*
 * leg are never clustered with each other, however close their own
 * prices happen to be -- genuine confluence requires independent
 * agreement, not a single leg's own internal ratio spacing. A level with
 * no cross-leg clustering partner remains a valid standalone candidate
 * (`confluenceCount: 1`), never discarded.
 */
export function clusterConfluence(levels: readonly RawFibonacciLevel[], atrValue: Prisma.Decimal): FibonacciCandidate[] {
  const tolerance = atrValue.times(CONFLUENCE_TOLERANCE_ATR_MULTIPLE);
  const used = new Set<number>();
  const candidates: FibonacciCandidate[] = [];

  for (let i = 0; i < levels.length; i++) {
    if (used.has(i)) continue;
    const cluster = [levels[i]];
    used.add(i);

    for (let j = i + 1; j < levels.length; j++) {
      if (used.has(j)) continue;
      if (levels[j].legIndex === levels[i].legIndex) continue;
      if (levels[j].price.minus(levels[i].price).abs().lessThanOrEqualTo(tolerance)) {
        cluster.push(levels[j]);
        used.add(j);
      }
    }

    const distinctLegs = new Set(cluster.map((level) => level.legIndex));
    const averagePrice = cluster.reduce((sum, level) => sum.plus(level.price), new Prisma.Decimal(0)).dividedBy(cluster.length);

    candidates.push({
      price: averagePrice,
      dominantType: dominantType(cluster),
      contributingLevels: cluster,
      confluenceCount: distinctLegs.size,
    });
  }

  return candidates;
}
