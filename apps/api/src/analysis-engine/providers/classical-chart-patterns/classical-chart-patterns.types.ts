import type { Prisma } from '@zenith/database';

/**
 * Classical-Chart-Patterns-internal types (S1-014). These exist only
 * inside this directory and are never surfaced as a new field on the
 * shared, methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-014 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside
 * `providers/classical-chart-patterns/` until a dedicated future ADR
 * authorizes promotion — never proactively.
 */

export type PatternDirection = 'BULLISH' | 'BEARISH';

export type ChartPatternType = 'HEAD_AND_SHOULDERS' | 'INVERSE_HEAD_AND_SHOULDERS' | 'DOUBLE_TOP' | 'DOUBLE_BOTTOM';

/** One swing's own labeled role within a candidate (e.g. `LEFT_SHOULDER`, `HEAD`, `PEAK_1`). */
export interface PatternPoint {
  readonly label: string;
  readonly timestamp: Date;
  readonly price: Prisma.Decimal;
}

/** A pattern shape before any hard-criterion check (WP3) -- shape only, not yet known to survive. */
export interface RawChartPatternCandidate {
  readonly patternType: ChartPatternType;
  readonly direction: PatternDirection;
  readonly points: readonly PatternPoint[];
}

/** One hard structural criterion's own margin (0-100; how comfortably, not just technically, it was satisfied) -- the basis for Detection Confidence. */
export interface ShapeCriterionCheck {
  readonly label: string;
  readonly marginScore: number;
}

/**
 * Whether, and how strongly, this candidate's own neckline has since been
 * broken in its anticipated direction (S1-014 Sprint Brief, Scope item 5)
 * -- `'UNCONFIRMED'` (still forming, a genuine but weaker hypothesis,
 * never discarded), `'CONFIRMED'` (a subsequent close broke the
 * neckline), or `'VOLUME_CONFIRMED'` (a confirming close whose own volume
 * exceeded the pattern's formation-period average by a disclosed margin
 * -- Edwards & Magee's own emphasis on volume-expanding breakouts).
 */
export type ConfirmationStatus = 'UNCONFIRMED' | 'CONFIRMED' | 'VOLUME_CONFIRMED';

/** The disclosed, forward-looking price level beyond which this hypothesis's own anticipated direction is contradicted -- directly answering "what invalidates this reading?". */
export interface PatternInvalidation {
  readonly level: Prisma.Decimal;
  readonly description: string;
}

/**
 * A complete, shape-valid, confirmation-scored chart pattern candidate --
 * the strongest currently-surviving interpretation of the available
 * market evidence for this specific pattern type, never claimed as the
 * only possible reading.
 */
export interface ChartPatternCandidate {
  readonly patternType: ChartPatternType;
  readonly direction: PatternDirection;
  readonly points: readonly PatternPoint[];
  /** The trough(s) (top patterns) or peak(s) (bottom patterns) level connecting this candidate's own neckline. */
  readonly necklineLevel: Prisma.Decimal;
  readonly shapeChecks: readonly ShapeCriterionCheck[];
  /** 0-100; the minimum `marginScore` across `shapeChecks` -- the weakest criterion determines overall Detection Confidence. */
  readonly detectionScore: number;
  readonly confirmationStatus: ConfirmationStatus;
  /** 0-100; derived from `confirmationStatus` -- feeds Interpretation Confidence. */
  readonly interpretationScore: number;
  readonly invalidation: PatternInvalidation;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
