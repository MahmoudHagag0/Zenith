import type { Prisma } from '@zenith/database';

/**
 * ICT/SMC-internal types (S1-010). These exist only inside this directory
 * and are never surfaced as a new field on the shared, methodology-neutral
 * `AnalysisProvider` contract (`Evidence`, `Interpretation`, `Limitations`,
 * `Traceability`, `LabeledConfidence` — S1-008). A future Provider never
 * needs to know these types exist.
 *
 * `DisplacementLeg` is this Provider's minimal, internal expression of the
 * Architecture Team's binding Implementation Guidance #1
 * (`S1-010_SPRINT_BRIEF.md`, Approval Section): the liquidity-narrative
 * progression `Liquidity Event -> Displacement -> Imbalance ->
 * Institutional Reaction`. Order Blocks, Fair Value Gaps, and Liquidity
 * Sweeps each carry a `stage` tag and, where genuinely found, a link back
 * to the `DisplacementLeg` that connects them — so the data shape does not
 * have to change if a future sprint chains these stages into real
 * reasoning. V1 does not implement that reasoning; it does not prevent it
 * either. Per the Architecture Team's explicit direction, `DisplacementLeg`
 * stays inside `providers/ict-smc/` — it is not promoted into the generic
 * Analysis Provider Framework unless a future methodology sprint
 * demonstrates genuine cross-Provider reuse, decided then via the normal
 * ADR process.
 */

export type IctNarrativeStage = 'LIQUIDITY_EVENT' | 'DISPLACEMENT' | 'IMBALANCE' | 'INSTITUTIONAL_REACTION';

export type IctSmcDirection = 'BULLISH' | 'BEARISH';

/** The impulse price leg following a Swing Detector `BOS` event — stage `DISPLACEMENT`. Confined to `BOS` only; see `ict-smc-displacement.util.ts`. */
export interface DisplacementLeg {
  readonly direction: IctSmcDirection;
  /** The `BOS` event's own swing timestamp — the leg's confirming break. */
  readonly structureEventTimestamp: Date;
  readonly startTimestamp: Date;
  readonly startIndex: number;
  readonly endIndex: number;
}

/** stage `INSTITUTIONAL_REACTION` — the last opposing-direction candle originating a `DisplacementLeg`. */
export interface OrderBlock {
  readonly stage: 'INSTITUTIONAL_REACTION';
  readonly direction: IctSmcDirection;
  readonly timestamp: Date;
  readonly high: Prisma.Decimal;
  readonly low: Prisma.Decimal;
  readonly displacementLegTimestamp: Date;
}

/** stage `IMBALANCE` — a three-candle price gap. */
export interface FairValueGap {
  readonly stage: 'IMBALANCE';
  readonly direction: IctSmcDirection;
  readonly startTimestamp: Date;
  readonly endTimestamp: Date;
  readonly gapLow: Prisma.Decimal;
  readonly gapHigh: Prisma.Decimal;
  /** Present only when this gap's index range falls within a detected `DisplacementLeg`'s span. Absent otherwise — not every imbalance arises from a labeled structure break, and V1 does not force one. */
  readonly displacementLegTimestamp?: Date;
}

/** stage `LIQUIDITY_EVENT` — a pierce-then-close-back-inside of a prior swing extreme. */
export interface LiquiditySweep {
  readonly stage: 'LIQUIDITY_EVENT';
  readonly direction: IctSmcDirection;
  readonly timestamp: Date;
  readonly sweptLevel: Prisma.Decimal;
  /** Present only when a `DisplacementLeg` immediately follows within the disclosed bar window — best-effort, unscored. */
  readonly displacementLegTimestamp?: Date;
}

export interface IctSmcBiasHypothesis {
  readonly direction: IctSmcDirection;
  /** 0-100, raw score before wrapping into a labeled Confidence. */
  readonly score: number;
  /** Which primitive type dominates this direction's evidence — keys Regime-Adjusted Confidence's modulation rule. 'NEUTRAL' when Order Block and Liquidity Sweep counts tie. */
  readonly dominantPrimitive: 'ORDER_BLOCK' | 'LIQUIDITY_SWEEP' | 'NEUTRAL';
  readonly summary: string;
}
