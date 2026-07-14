import type { Prisma } from '@zenith/database';

/**
 * Fibonacci-Analysis-internal types (S1-017). These exist only inside
 * this directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-017 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/fibonacci-analysis/`
 * until a dedicated future ADR authorizes promotion — never proactively.
 */

/** Whether a level sits within the swing leg (a pullback level) or beyond it (a projected target) — this Provider's own bifurcating variable for Regime-Adjusted Confidence (S1-017 Sprint Brief, Scope item 7). */
export type LevelType = 'RETRACEMENT' | 'EXTENSION';

/** One ratio level, from one specific leg -- the raw unit this Provider clusters into confluence (WP2/WP3). */
export interface RawFibonacciLevel {
  readonly legIndex: number;
  readonly ratio: number;
  readonly price: Prisma.Decimal;
  readonly type: LevelType;
  readonly isTrueFibonacciRatio: boolean;
}

/**
 * Three mutually-exclusive states, determined by touch/close persistence
 * across subsequent points (S1-017 Sprint Brief, Scope item 5) -- a
 * genuinely different mechanism from a single-bar wick/body/close-
 * position measurement.
 */
export type ReactionState = 'UNTESTED' | 'RESPECTED' | 'BROKEN';

/** A confluence zone (2+ independent legs agreeing) or a standalone level (1 leg) -- before health/quality scoring. */
export interface FibonacciCandidate {
  readonly price: Prisma.Decimal;
  readonly dominantType: LevelType;
  readonly contributingLevels: readonly RawFibonacciLevel[];
  /** The count of *distinct* legs contributing -- never inflated by multiple ratios from the same leg. */
  readonly confluenceCount: number;
}

/** The disclosed measurements a candidate's own Detection Confidence is built from (S1-017 Sprint Brief, Scope item 6) -- never a ratio-arithmetic lookup alone. */
export interface FibonacciQualityScore {
  /** 0-100; the weaker of `confluenceScore`/`precisionScore` -- the "weakest link" idiom. */
  readonly value: number;
  readonly confluenceScore: number;
  readonly precisionScore: number;
  readonly explanation: string;
}

/** The disclosed, forward-looking condition that would invalidate this reading -- directly answering "what invalidates this reading?". */
export interface FibonacciInvalidation {
  readonly level: Prisma.Decimal;
  readonly description: string;
}

export type FibonacciDirection = 'BULLISH' | 'BEARISH';

/**
 * A complete, classified, scored Fibonacci reading -- one of at most two
 * currently-surviving hypotheses (ranked by proximity to current price),
 * never claimed as the only level/zone that exists.
 */
export interface FibonacciHypothesis {
  readonly candidate: FibonacciCandidate;
  readonly direction: FibonacciDirection;
  readonly reactionState: ReactionState;
  readonly qualityScore: FibonacciQualityScore;
  readonly interpretationScore: number;
  readonly invalidation: FibonacciInvalidation;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
