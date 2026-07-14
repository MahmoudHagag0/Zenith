import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

/**
 * VSA-internal types (S1-018). These exist only inside this directory
 * and are never surfaced as a new field on the shared, methodology-
 * neutral `AnalysisProvider` contract (`Evidence`, `Interpretation`,
 * `Limitations`, `Traceability`, `LabeledConfidence` — S1-008). A future
 * Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-018 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/vsa/` until a
 * dedicated future ADR authorizes promotion — never proactively.
 */

/** A single bar's own spread (high-low range) relative to ATR (S1-018 Sprint Brief, Scope item 2). */
export type SpreadClassification = 'NARROW' | 'AVERAGE' | 'WIDE';

/** A single bar's own volume relative to a trailing average computed strictly from preceding bars (S1-018 Sprint Brief, Scope item 2). */
export type VolumeClassification = 'LOW' | 'AVERAGE' | 'HIGH' | 'ULTRA_HIGH';

/** Where this bar's own close fell within its own spread (S1-018 Sprint Brief, Scope item 2). */
export type ClosePosition = 'NEAR_HIGH' | 'MID' | 'NEAR_LOW';

/** This bar's own direction, from close vs. open. */
export type BarDirection = 'UP' | 'DOWN';

/**
 * One bar's own complete raw classification (S1-018 Sprint Brief, Scope
 * item 2) — the entire raw Evidence vocabulary this Provider's signal
 * detection (Scope item 3) is built from. Carries both the classified
 * label and its own underlying ratio, so downstream Confidence scoring
 * (Scope item 5) can measure anomaly magnitude directly without
 * recomputing anything.
 */
export interface ClassifiedBar {
  readonly point: MarketSeriesPoint;
  /** This bar's own index within `MarketSeries.points`. */
  readonly index: number;
  readonly atr: Prisma.Decimal;
  readonly spread: SpreadClassification;
  /** This bar's own (high-low) divided by ATR. */
  readonly spreadAtrRatio: number;
  readonly volume: VolumeClassification;
  /** This bar's own volume divided by the trailing average volume of the preceding bars in the lookback window. */
  readonly volumeRatio: number;
  readonly closePosition: ClosePosition;
  /** (close-low)/(high-low), 0-1. */
  readonly closePositionRatio: number;
  readonly direction: BarDirection;
}

/**
 * The bounded, named set of VSA signal types this Provider detects
 * (S1-018 Sprint Brief, Scope item 3). Deliberately reuses several
 * historically accurate terms (Upthrust, Shakeout, Stopping Volume is
 * Climax-adjacent) this methodology's own founder built directly atop
 * an earlier, related methodology's own principles — this shared
 * terminology is honestly disclosed (Sprint Objective), not avoided.
 * The detection mechanism itself is entirely self-contained, single-bar,
 * and structurally unrelated to any whole-range schematic-phase concept.
 */
export type VsaSignalType = 'NO_DEMAND' | 'NO_SUPPLY' | 'UPTHRUST' | 'SHAKEOUT' | 'STOPPING_VOLUME';

/** A detected signal — one qualifying bar and its own matched signal type. */
export interface VsaSignal {
  readonly type: VsaSignalType;
  readonly bar: ClassifiedBar;
}

/** The disclosed, forward-looking condition that would contradict this signal's own implied bias -- directly answering "what invalidates this reading?". */
export interface VsaInvalidation {
  readonly description: string;
}

/**
 * A complete, classified, scored VSA reading -- one of at most two
 * currently-surviving hypotheses (bounded by recency), never claimed as
 * the only signal that exists in the scanned window.
 */
export interface VsaHypothesis {
  readonly signal: VsaSignal;
  readonly invalidation: VsaInvalidation;
  /** Whether this signal's own bar occurred at or near a Swing-Detector-identified swing high/low (S1-018 Sprint Brief, Scope item 5). */
  readonly swingProximate: boolean;
}
