import type { Prisma } from '@zenith/database';
import type { PatternLeg, PatternRatioTable, PatternType, RawPatternCandidate } from './harmonic-patterns.types';

/**
 * The four named patterns' own disclosed ratio bands and cited ideal
 * values (S1-013 Sprint Brief, Scope item 4; Missing Decisions) —
 * reproducing the widely-taught canonical ratio table found consistently
 * across independent secondary sources (H.M. Gartley's original 1935
 * shape description, Larry Pesavento's 1978 Fibonacci-ratio refinement,
 * and Scott Carney's 2004 "Harmonic Trading" tolerance bands), per the
 * disclosed-fallback allowance established at S1-007/S1-009/S1-010/S1-011
 * (see `harmonic-patterns.provider.golden-dataset.spec.ts` for the full
 * sourcing disclosure). `ideal` is each table's own single most-cited
 * reference value — for a band that is itself narrow around one number
 * (e.g. Gartley's `ab`/`ad`), `ideal` is that number; for a genuinely wide
 * band (e.g. every pattern's own `bc`), `ideal` is the classic 0.618
 * retracement most sources single out within the band as the "cleanest"
 * instance.
 */
export const GARTLEY_RATIOS: PatternRatioTable = {
  patternType: 'GARTLEY',
  ab: { min: 0.58, max: 0.66, ideal: 0.618 },
  bc: { min: 0.382, max: 0.886, ideal: 0.618 },
  cd: { min: 1.13, max: 1.618, ideal: 1.272 },
  ad: { min: 0.75, max: 0.82, ideal: 0.786 },
};

export const BAT_RATIOS: PatternRatioTable = {
  patternType: 'BAT',
  ab: { min: 0.382, max: 0.5, ideal: 0.446 },
  bc: { min: 0.382, max: 0.886, ideal: 0.618 },
  cd: { min: 1.618, max: 2.618, ideal: 2.0 },
  ad: { min: 0.856, max: 0.9, ideal: 0.886 },
};

export const BUTTERFLY_RATIOS: PatternRatioTable = {
  patternType: 'BUTTERFLY',
  ab: { min: 0.75, max: 0.82, ideal: 0.786 },
  bc: { min: 0.382, max: 0.886, ideal: 0.618 },
  cd: { min: 1.618, max: 2.24, ideal: 1.618 },
  ad: { min: 1.27, max: 1.618, ideal: 1.27 },
};

export const CRAB_RATIOS: PatternRatioTable = {
  patternType: 'CRAB',
  ab: { min: 0.382, max: 0.618, ideal: 0.5 },
  bc: { min: 0.382, max: 0.886, ideal: 0.618 },
  cd: { min: 2.24, max: 3.618, ideal: 3.14 },
  ad: { min: 1.58, max: 1.66, ideal: 1.618 },
};

export const ALL_PATTERN_RATIO_TABLES: readonly PatternRatioTable[] = [GARTLEY_RATIOS, BAT_RATIOS, BUTTERFLY_RATIOS, CRAB_RATIOS];

export function patternRatioTableFor(patternType: PatternType): PatternRatioTable {
  const table = ALL_PATTERN_RATIO_TABLES.find((t) => t.patternType === patternType);
  if (!table) {
    throw new Error(`No ratio table registered for pattern type ${patternType}.`);
  }
  return table;
}

function legLength(leg: PatternLeg): Prisma.Decimal {
  return leg.endPrice.minus(leg.startPrice).abs();
}

export interface ComputedLegRatios {
  readonly ab: number;
  readonly bc: number;
  readonly cd: number;
  readonly ad: number;
}

/**
 * Computes a candidate's four defining ratios directly via `Prisma.Decimal`
 * division between its own sequentially-chained legs (S1-013 Sprint
 * Brief, Scope item 4; Architecture Requirements) — never via
 * `INDICATOR_ENGINE.fibonacciLevels()`, since each ratio has its own
 * distinct anchor-leg pair (unlike a single-anchor-pair retracement/
 * extension use case elsewhere in this system), making a direct ratio
 * computation both
 * simpler and more directly traceable to how every cited harmonic-pattern
 * source itself describes verification.
 */
export function computeLegRatios(candidate: RawPatternCandidate): ComputedLegRatios {
  const [xa, ab, bc, cd] = candidate.legs;
  const xaLength = legLength(xa);
  const abLength = legLength(ab);
  const bcLength = legLength(bc);
  // The "AD" ratio -- D's overall retracement/extension of the XA leg, measured directly
  // from A to D (the widely-cited single defining number for each pattern's D-point), not
  // derived from the BC/CD legs -- computed straight from A's price (xa.endPrice) to D's
  // price (cd.endPrice), independent of the intermediate C point.
  const adLength = cd.endPrice.minus(xa.endPrice).abs();

  return {
    ab: abLength.dividedBy(xaLength).toNumber(),
    bc: bcLength.dividedBy(abLength).toNumber(),
    cd: legLength(cd).dividedBy(bcLength).toNumber(),
    ad: adLength.dividedBy(xaLength).toNumber(),
  };
}
