import type { Prisma } from '@zenith/database';

/**
 * Wyckoff-internal types (S1-009). These exist only inside this
 * directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider (ICT/SMC, Elliott Wave, etc.) never needs
 * to know these types exist.
 */

export type WyckoffSchematicSide = 'ACCUMULATION' | 'DISTRIBUTION';

/**
 * A candidate trading range — the structural anchor every event below is
 * detected relative to. Deliberately side-agnostic: a range is just a
 * bounded price zone. Whether it turns out to host an Accumulation or a
 * Distribution schematic (or neither) is only knowable once event
 * detection is attempted against it (see `WyckoffSideEvents`).
 */
export interface WyckoffRange {
  readonly support: Prisma.Decimal;
  readonly resistance: Prisma.Decimal;
  readonly startTimestamp: Date;
  readonly endTimestamp: Date;
}

/**
 * The Wyckoff Schematic #1 event vocabulary. `AR`, `ST`, and `TEST` are
 * shared labels between Accumulation and Distribution (same name,
 * side-dependent meaning — this is Wyckoff's own vocabulary, not an
 * error); the remaining ten are side-specific.
 */
export type WyckoffEventType =
  | 'PS'
  | 'SC'
  | 'AR'
  | 'ST'
  | 'SPRING'
  | 'TEST'
  | 'SOS'
  | 'LPS'
  | 'PSY'
  | 'BC'
  | 'UT_UTAD'
  | 'SOW'
  | 'LPSY';

export interface WyckoffEvent {
  readonly type: WyckoffEventType;
  readonly timestamp: Date;
  readonly price: Prisma.Decimal;
  /** Human-readable, e.g. "Selling Climax: swing low at 98.10 with a 3.1x volume spike." */
  readonly description: string;
}

/** The result of attempting one side's (Accumulation or Distribution) event detection against a `WyckoffRange`. */
export interface WyckoffSideEvents {
  readonly side: WyckoffSchematicSide;
  readonly events: readonly WyckoffEvent[];
}

export type WyckoffPhase = 'A' | 'B' | 'C' | 'D' | 'E';

/** One candidate reading of the detected event sequence — an entry of the eventual bounded `interpretation[]`. */
export interface WyckoffPhaseHypothesis {
  readonly phase: WyckoffPhase;
  readonly side: WyckoffSchematicSide;
  /** 0-100, raw score before wrapping into a labeled `InterpretationConfidence`. */
  readonly score: number;
  readonly supportingEvents: readonly WyckoffEventType[];
  readonly summary: string;
}
