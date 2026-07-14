import type { Prisma } from '@zenith/database';

/**
 * Harmonic-Patterns-internal types (S1-013). These exist only inside this
 * directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-013 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/harmonic-patterns/`
 * until a dedicated future ADR authorizes promotion — never proactively.
 */

export type PatternDirection = 'BULLISH' | 'BEARISH';

export type PatternType = 'GARTLEY' | 'BAT' | 'BUTTERFLY' | 'CRAB';

/** One of the four X-A-B-C-D legs (XA, AB, BC, CD) making up a candidate harmonic pattern. */
export interface PatternLeg {
  readonly label: 'XA' | 'AB' | 'BC' | 'CD';
  readonly startTimestamp: Date;
  readonly startPrice: Prisma.Decimal;
  readonly endTimestamp: Date;
  readonly endPrice: Prisma.Decimal;
}

/** A single ratio band: `min`/`max` bound band-membership (hard filter); `ideal` is the pattern's own cited reference value (soft, Interpretation Confidence only). */
export interface RatioBand {
  readonly min: number;
  readonly max: number;
  readonly ideal: number;
}

/** One named pattern's own disclosed ratio table (S1-013 Sprint Brief, Scope item 4). */
export interface PatternRatioTable {
  readonly patternType: PatternType;
  readonly ab: RatioBand;
  readonly bc: RatioBand;
  readonly cd: RatioBand;
  /** The `AD`/`XD` ratio -- the completion point's overall retracement or extension of the initial XA leg; every cited source's own single most defining number for this pattern. */
  readonly ad: RatioBand;
}

/** One leg's computed ratio against its matched band -- the basis for both Detection Confidence (margin) and Interpretation Confidence (ideal-proximity). */
export interface LegRatioCheck {
  readonly label: 'AB' | 'BC' | 'CD' | 'AD';
  readonly actualRatio: number;
  readonly band: RatioBand;
  /** 0-100; how far the actual ratio sits from the band's own nearer edge, as a fraction of the band's half-width -- 100 = at the band's center, 0 = at either edge. */
  readonly marginScore: number;
  /** 0-100; how close the actual ratio sits to the band's own cited ideal value -- a genuinely distinct signal from `marginScore` (band-edge distance vs. ideal-value proximity). */
  readonly idealProximityScore: number;
}

/** A 5-point (X,A,B,C,D) candidate before any pattern-type ratio matching (WP3) -- shape only, not yet known to match any named pattern. */
export interface RawPatternCandidate {
  readonly direction: PatternDirection;
  readonly legs: readonly PatternLeg[];
}

/** The disclosed, forward-looking price level beyond which a surviving hypothesis's own D-point completion zone is violated -- directly answering "what invalidates this reading?". */
export interface PatternInvalidation {
  readonly level: Prisma.Decimal;
  readonly description: string;
}

/**
 * A complete, band-matched, scored harmonic pattern candidate -- the
 * strongest currently-surviving interpretation of the available market
 * evidence for this specific pattern type, never claimed as the only
 * possible reading (other pattern types may independently match the same
 * X-A-B-C-D window -- see Scope item 5).
 */
export interface HarmonicPatternCandidate {
  readonly patternType: PatternType;
  readonly direction: PatternDirection;
  readonly legs: readonly PatternLeg[];
  readonly ratioChecks: readonly LegRatioCheck[];
  /** 0-100; the minimum `marginScore` across the four ratio checks -- the weakest leg determines overall Detection Confidence. */
  readonly detectionScore: number;
  /** 0-100; averages ideal-ratio proximity (all four legs) with AB=CD time-symmetry proximity -- feeds Interpretation Confidence. */
  readonly interpretationScore: number;
  /** 0-100; the AB=CD time-symmetry component alone (a genuinely distinct sub-signal from ideal-ratio proximity) -- exposed separately so `normalize()` (S1-012) can honestly gate CONFIRMATION on this specific signal, not the blended `interpretationScore`. */
  readonly timeSymmetryScore: number;
  readonly invalidation: PatternInvalidation;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
