import { Prisma } from '@zenith/database';
import type { ConfidenceKind } from '../analysis-engine/providers/analysis-provider.types';
import type { NonParticipationReason } from '../analysis-engine/providers/provider-execution.types';
import type { NormalizedDimension, NormalizedReading } from '../analysis-engine/providers/normalized-vocabulary.types';

/**
 * Dashboard-facing DTOs (S1-019 Sprint Brief, Scope item 6). Deliberately
 * narrower than any internal Analysis Engine type — this file is the only
 * shape `DashboardController` ever returns; no `AnalysisProviderResult`,
 * `ConfluenceResult`, or Prisma entity is ever returned directly
 * (`26_DASHBOARD_HOME_SPECIFICATION.md` §3 DASH-002; Mission: "expose
 * exactly what Dashboard needs... avoid leaking internal implementation
 * details").
 */

/** A `LabeledConfidence` value, passed through unmodified -- never collapsed into an unlabeled number (Constitution §6.5, §12.6). */
export interface LabeledConfidenceView {
  readonly kind: ConfidenceKind;
  readonly value: Prisma.Decimal;
  readonly explanation: string;
}

/** `Limitations`-derived uncertainty disclosure, given equal prominence to confidence (Constitution §12.7). */
export interface UncertaintyView {
  readonly dataQuality: 'COMPLETE' | 'GAPS_PRESENT' | 'MISSING';
  readonly assumptions: readonly string[];
  readonly notes: readonly string[];
}

/** A `TraceabilityRecord`, passed through in-memory (no Trace Store exists yet -- see Sprint Brief Out of Scope). */
export interface TraceabilityView {
  readonly rawDataReferences: readonly string[];
  readonly intermediateCalculations: readonly { readonly computation: string; readonly computationVersion: string }[];
  readonly conditionDerivations: readonly string[];
  readonly confidenceDerivation: string;
}

/** One contributing Provider's Dashboard-relevant detail, bounded per instrument (Missing Decision 2). */
export interface ContributingProviderView {
  readonly providerId: string;
  readonly methodologyFamily?: string;
  readonly interpretationSummary: string;
  readonly detectionConfidence: LabeledConfidenceView;
  readonly interpretationConfidence: LabeledConfidenceView;
  readonly regimeAdjustedConfidence: LabeledConfidenceView;
  readonly methodologyConfidenceCeiling: LabeledConfidenceView;
  readonly uncertainty: UncertaintyView;
  readonly traceability: TraceabilityView;
}

/** One of the seven Normalized Vocabulary dimensions, reshaped for Dashboard consumption -- never re-aggregated, only relabeled. */
export interface DimensionConfluenceView {
  readonly dimension: NormalizedDimension;
  readonly aggregateReading: NormalizedReading;
  readonly disagreement: boolean;
}

export interface ParticipationView {
  readonly participatingCount: number;
  readonly totalRegistered: number;
  readonly nonParticipating: readonly { readonly providerId: string; readonly reason: NonParticipationReason; readonly detail: string }[];
}

export type NetDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

/**
 * A Dashboard-ready synthesis for one instrument (S1-019 Sprint Brief,
 * Scope item 2) -- the Confluence Engine Consumer's own output. Never
 * carries a trader/user identifier; this type is asset-scoped only,
 * trader-scoping happens one layer up in `DashboardService`.
 *
 * `netDirection`/`relevanceScore` are computed once here, alongside the
 * dimension aggregation they read from (`net-direction-ranking.util.ts`),
 * rather than re-derived by a caller from the already-reshaped
 * `dimensions` view below (which deliberately omits per-dimension
 * contributor detail -- see `DimensionConfluenceView`). `relevanceScore`
 * is a ranking heuristic ONLY, never a Confidence value (Constitution §6.5).
 */
export interface InstrumentReading {
  readonly assetId: string;
  readonly computedAt: string;
  readonly dimensions: readonly DimensionConfluenceView[];
  readonly participation: ParticipationView;
  readonly topContributors: readonly ContributingProviderView[];
  readonly netDirection: NetDirection;
  readonly relevanceScore: number;
  readonly agreeingDimensions: number;
  readonly disagreementDimensions: readonly NormalizedDimension[];
}

/**
 * One ranked opportunity in the Decision Center response. `netDirection`/
 * `relevanceScore`/`agreeingDimensions` are read directly from `reading`
 * (computed once in `InstrumentReadingService`, never re-derived here).
 * `relevanceScore` is a ranking heuristic ONLY -- it is never a Confidence
 * value, is never displayed as one, and must never be compared to any
 * `LabeledConfidenceView` as if equivalent (Constitution §6.5).
 */
export interface RankedOpportunity {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
  readonly netDirection: Exclude<NetDirection, 'NEUTRAL'>;
  readonly relevanceScore: number;
  readonly agreeingDimensions: number;
  readonly disagreementPresent: boolean;
  readonly reading: InstrumentReading;
}

export type DecisionCenterReadiness = 'OPPORTUNITIES_AVAILABLE' | 'NO_CLEAR_OPPORTUNITY' | 'DEGRADED';

/** An instrument this response could not evaluate at all -- disclosed honestly, never silently dropped (Constitution §4.1, §12.7). */
export interface FailedInstrument {
  readonly assetId: string;
  readonly reason: string;
}

/** The complete response for `GET /dashboard/decision-center` -- powers `DASH-002` (`26_DASHBOARD_HOME_SPECIFICATION.md` §3). */
export interface DecisionCenterResponse {
  readonly readiness: DecisionCenterReadiness;
  readonly generatedAt: string;
  readonly instrumentsConsidered: number;
  readonly instrumentsFailed: readonly FailedInstrument[];
  readonly opportunities: readonly RankedOpportunity[];
}
