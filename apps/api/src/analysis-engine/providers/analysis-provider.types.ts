import { Prisma } from '@zenith/database';
import type { MarketSeries } from '../market-series/market-series.types';

/**
 * The Analysis Provider Framework's base contract (ADR-006,
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md — "Analysis Provider Framework",
 * "Evidence / Interpretation / Limitations Contract"). No real Provider is
 * implemented in S1-008 — these types are exercised only by in-test
 * fixture Providers (S1-008 Sprint Brief, Scope item 7); the first real
 * Provider is S1-009.
 */

export type ProviderLifecycleState = 'ACTIVE' | 'DEPRECATED' | 'RETIRED';

export type ProviderTier = 'FAST' | 'SLOW';

/**
 * Which of the four distinct Confidence concepts a labeled value
 * represents (Confidence Model). Two differently-`kind`ed confidence
 * values must never be compared as if equivalent.
 */
export type ConfidenceKind = 'DETECTION' | 'INTERPRETATION' | 'REGIME_ADJUSTED' | 'METHODOLOGY_CEILING';

/** A single labeled confidence value (0-100) with its own explanation. */
export interface LabeledConfidence {
  readonly kind: ConfidenceKind;
  readonly value: Prisma.Decimal;
  readonly explanation: string;
}

/** Detected/missing conditions and supporting/conflicting evidence for this Provider's reading. */
export interface Evidence {
  readonly detectedConditions: readonly string[];
  readonly missingConditions: readonly string[];
  readonly supporting: readonly string[];
  readonly conflicting: readonly string[];
}

/**
 * One entry of a Provider's `interpretation` array. Always present as an
 * array — length one for single-hypothesis Providers, length N for
 * multi-hypothesis ones — so every Consumer can treat every Provider
 * polymorphically. Interpretation is the Provider's own deterministic
 * reading of its Evidence, never a trading recommendation.
 */
export interface Interpretation {
  readonly summary: string;
  /** kind: 'INTERPRETATION' — ranks entries within a multi-hypothesis array. */
  readonly confidence: LabeledConfidence;
  /** kind: 'REGIME_ADJUSTED' — this entry's confidence scaled by the Regime/Context Service's current read (Confidence Model). Never compared to `confidence` above as if equivalent — a different kind entirely. */
  readonly regimeAdjustedConfidence: LabeledConfidence;
}

/**
 * Known constraints on this specific result. A Provider facing missing or
 * unusable input data returns a populated `Limitations` entry here — it
 * never throws.
 */
export interface Limitations {
  readonly dataQuality: 'COMPLETE' | 'GAPS_PRESENT' | 'MISSING';
  readonly assumptions: readonly string[];
  readonly notes: readonly string[];
}

/**
 * Raw data references, intermediate-calculation references, condition
 * derivations, and confidence derivation — a chain back to this result's
 * origin (Traceability). In-memory only in S1-008: no persistence layer,
 * Prisma model, or storage mechanism exists yet (approved Architecture
 * Team decision — see S1-008 Sprint Brief). Persisting a trace record by
 * ID is deferred to whichever of S1-009 or S1-012 (Confluence) first
 * needs to retain one beyond a single request/response.
 */
export interface TraceabilityRecord {
  readonly rawDataReferences: readonly string[];
  readonly intermediateCalculations: readonly { readonly computation: string; readonly computationVersion: string }[];
  readonly conditionDerivations: readonly string[];
  readonly confidenceDerivation: string;
}

/** The standard shape every Analysis Provider returns (ADR-006). */
export interface AnalysisProviderResult {
  readonly contractVersion: string;
  readonly evidence: Evidence;
  readonly interpretation: readonly Interpretation[];
  readonly limitations: Limitations;
  readonly traceability: TraceabilityRecord;
  /** kind: 'DETECTION' — how well the Evidence matches this Provider's own pattern/event definition (Confidence Model). One value per result, not per `interpretation` entry. */
  readonly detectionConfidence: LabeledConfidence;
  /** kind: 'METHODOLOGY_CEILING' — a disclosed, Provider-level cap reflecting source quality (Confidence Model). Constant per Provider, not per result. */
  readonly methodologyConfidenceCeiling: LabeledConfidence;
}

/**
 * Every Analysis Provider implements this interface, registered as a
 * NestJS multi-provider (ADR-006). Dependencies on another Provider's
 * output are declared by `id` — a stable identifier/token — never by
 * importing another Provider's concrete class, so the Execution Engine
 * resolves dependencies at runtime with no Provider compile-time coupled
 * to another's implementation.
 */
export interface AnalysisProvider {
  /** Stable identifier other Providers reference in `dependsOn`. Never a concrete class reference. */
  readonly id: string;
  /** Self-declared; read, never assigned, by the Confluence Engine (ADR-007, S1-012). */
  readonly methodologyFamily?: string;
  /** Versions this Provider's own interpretation logic — distinct from `contractVersion` (output shape). */
  readonly computationVersion: string;
  readonly lifecycleState: ProviderLifecycleState;
  /** A SLOW-tier Provider's execution must never block a FAST-tier Provider's result in the same run. */
  readonly tier: ProviderTier;
  /** Other Providers' stable `id`s this Provider depends on. Resolved via topological sort before invocation. */
  readonly dependsOn?: readonly string[];
  /** Optional per-Provider invocation timeout override; falls back to the Execution Engine's default when unset. */
  readonly timeoutMs?: number;

  analyze(series: MarketSeries): Promise<AnalysisProviderResult>;
  /**
   * ADR-006 establishes only that this method exists on the interface;
   * ADR-007 (S1-012) defines its target vocabulary, versioning, and
   * conformance requirements exclusively. Approved Architecture Team
   * decision (S1-008): a documented no-op placeholder until then. Nothing
   * calls this method in S1-008 — Confluence, its only consumer, does not
   * exist until S1-012.
   */
  normalize(): void;
}
