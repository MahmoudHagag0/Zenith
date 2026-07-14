import type { Prisma } from '@zenith/database';

/**
 * Elliott-Wave-internal types (S1-011). These exist only inside this
 * directory and are never surfaced as a new field on the shared,
 * methodology-neutral `AnalysisProvider` contract (`Evidence`,
 * `Interpretation`, `Limitations`, `Traceability`, `LabeledConfidence` —
 * S1-008). A future Provider never needs to know these types exist.
 *
 * Per the Architecture Team's direction (S1-011 Sprint Brief, Non-Scope /
 * Architecture Requirements): if any concept here later looks reusable
 * across methodologies, it stays inside `providers/elliott-wave/` until a
 * dedicated future ADR authorizes promotion — never proactively.
 */

export type WaveDirection = 'BULLISH' | 'BEARISH';

/** One of the five swing-to-swing legs making up a candidate 5-wave motive (impulse) count. */
export interface ImpulseWaveLeg {
  readonly waveNumber: 1 | 2 | 3 | 4 | 5;
  readonly startTimestamp: Date;
  readonly startPrice: Prisma.Decimal;
  readonly endTimestamp: Date;
  readonly endPrice: Prisma.Decimal;
}

export type ElliottRule = 'RULE_1' | 'RULE_2' | 'RULE_3';

/**
 * The disclosed, forward-looking price level that would invalidate a
 * surviving candidate (S1-011 Sprint Brief, Scope item 6) — directly
 * answering "what invalidates the current count?". Always Wave 1's own
 * endpoint price, per the real-world Elliott Wave convention that a
 * subsequent price move back across it retroactively falsifies the count
 * via Rule 3, regardless of which Rule was closest to being at risk
 * during the count's own formation.
 */
export interface WaveInvalidation {
  readonly rule: ElliottRule;
  readonly level: Prisma.Decimal;
  readonly description: string;
}

/** How comfortably (not just technically) each of Elliott's Three Rules was satisfied — 0-100, the basis for Detection Confidence and Implementation Guidance #5's "what weakens it" disclosure. */
export interface RuleMargins {
  readonly rule1: number;
  readonly rule2: number;
  readonly rule3: number;
}

/** One Fibonacci-guideline proximity result (S1-011 Sprint Brief, Scope item 4) — non-binding, contributes to ranking/confidence only, never to survival. */
export interface FibonacciGuidelineCheck {
  readonly label: string;
  readonly actualPrice: Prisma.Decimal;
  readonly nearestGuidelineRatio: number;
  readonly nearestGuidelinePrice: Prisma.Decimal;
  /** 0-100; 100 = at the guideline level exactly, decaying to 0 at the disclosed tolerance boundary. */
  readonly proximityScore: number;
}

/** A 5-wave candidate that has survived Elliott's Three Rules (`elliott-wave-rules.util.ts`), before Fibonacci-guideline scoring (WP4) is attached. */
export interface RuleValidatedCandidate {
  readonly direction: WaveDirection;
  readonly legs: readonly ImpulseWaveLeg[];
  readonly invalidation: WaveInvalidation;
  readonly ruleMargins: RuleMargins;
}

/**
 * A complete, Rule-validated, Fibonacci-scored 5-wave motive (impulse)
 * candidate — the strongest currently-surviving interpretation of the
 * available market evidence, never claimed as the one objectively correct
 * count (Architecture Team Implementation Guidance #6). `survivalReasons`
 * and `weaknesses` are the concrete, internal expression of Implementation
 * Guidance #5's transparency requirement.
 */
export interface WaveCountCandidate extends RuleValidatedCandidate {
  readonly guidelineChecks: readonly FibonacciGuidelineCheck[];
  /** 0-100 aggregate Fibonacci-guideline proximity, feeding Interpretation Confidence. */
  readonly guidelineScore: number;
  readonly survivalReasons: readonly string[];
  readonly weaknesses: readonly string[];
}
