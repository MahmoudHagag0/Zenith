import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

/**
 * Price-Action-internal types (S1-015). These exist only inside this
 * directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-015 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/price-action/` until
 * a dedicated future ADR authorizes promotion — never proactively.
 */

export type KeyLevelType = 'HIGH' | 'LOW';

/** The single most recent swing this Provider reasons about (S1-015 Sprint Brief, Scope item 2) — a prior HIGH is treated as resistance, a prior LOW as support. */
export interface KeyLevel {
  readonly type: KeyLevelType;
  readonly price: Prisma.Decimal;
  readonly timestamp: Date;
}

/**
 * The five mutually-exclusive, hard-classified reaction states (S1-015
 * Sprint Brief, Scope item 4) — never a probabilistic blend, and never a
 * named candlestick pattern.
 */
export type PriceActionState = 'APPROACHING_LEVEL' | 'REJECTED_LEVEL' | 'BREAKOUT_UNCONFIRMED' | 'BREAKOUT_CONFIRMED' | 'BREAKOUT_FAILED';

export type PriceActionDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

/** The structural sequencing result of classification (WP3) -- which points (if any) played which role. */
export interface ReactionClassification {
  readonly state: PriceActionState;
  readonly breakoutPoint: MarketSeriesPoint | null;
  readonly retestPoint: MarketSeriesPoint | null;
  readonly rejectionPoint: MarketSeriesPoint | null;
}

/** The disclosed measurements a reading is built from (S1-015 Sprint Brief, Scope item 5) — never a named pattern lookup. */
export interface QualityScore {
  /** 0-100; wick-to-range ratio for a rejection, or the average of body-to-range and close-position ratios for a breakout/failure. */
  readonly value: number;
  /** ATR-relative distance the closing price cleared beyond the key level (breakout/failure states only; `null` for rejection/approach). */
  readonly atrRelativeClearance: number | null;
  readonly explanation: string;
}

export type ContinuationPace = 'CONTINUATION' | 'EXHAUSTION' | 'NEUTRAL_PACE';

/** The disclosed, forward-looking condition that would contradict this reading -- directly answering "what invalidates this reading?". */
export interface PatternInvalidation {
  readonly level: Prisma.Decimal;
  readonly description: string;
}

/**
 * A complete, classified, scored Price Action reading -- the strongest
 * currently-surviving interpretation of how price is behaving at this
 * Provider's own single key level, never claimed as the only possible
 * reading.
 */
export interface PriceActionReading {
  readonly state: PriceActionState;
  readonly direction: PriceActionDirection;
  readonly keyLevel: KeyLevel;
  readonly classification: ReactionClassification;
  readonly qualityScore: QualityScore;
  /** 0-100; ATR-relative velocity of the current leg. */
  readonly momentumScore: number;
  /** `null` when fewer than two post-breakout points exist to compare (no fabricated classification). */
  readonly continuationPace: ContinuationPace | null;
  readonly invalidation: PatternInvalidation;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
