import type { DecisionCenterReadiness, FailedInstrument, NetDirection } from '../dashboard/dashboard.types';

/**
 * Morning Brief-facing DTOs (S1-020 Sprint Brief, Scope item 1). Every
 * field here is populated by the Narrative Composer (`narrative-composer.util.ts`)
 * from data `DashboardService.getDecisionCenter()` (S1-019) already
 * produced -- no new evidence, Confidence value, or judgment is
 * introduced at this layer.
 */

/** One ranked instrument's own narrative (S1-020 Sprint Brief, Scope item 2). */
export interface MorningBriefEntry {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
  readonly netDirection: Exclude<NetDirection, 'NEUTRAL'>;
  /** Leads with direction and supporting evidence-count, never a bare price/number (Constitution §12.1). */
  readonly story: string;
  /** Quotes the lead contributor's own `interpretationSummary` verbatim. */
  readonly why: string;
  /** Names which Confidence kind is being reported and quotes its own `.explanation` (Constitution §12.6). */
  readonly confidenceExplanation: string;
  /** Quotes Limitations, disclosed disagreement, and non-participation counts (Constitution §12.7). */
  readonly uncertaintyExplanation: string;
  readonly disagreementPresent: boolean;
}

/** The complete response for `GET /morning-brief`. */
export interface MorningBriefResponse {
  readonly generatedAt: string;
  readonly readiness: DecisionCenterReadiness;
  /** A single session-level summary sentence. */
  readonly headline: string;
  /** Bounded to `MAX_MORNING_BRIEF_ENTRIES`; empty when `readiness !== 'OPPORTUNITIES_AVAILABLE'`. */
  readonly entries: readonly MorningBriefEntry[];
  /** Present only when `readiness !== 'OPPORTUNITIES_AVAILABLE'` -- an explicit, calm statement of why (Product Rule 9, Constitution §12.4). */
  readonly noTradeNarrative?: string;
  readonly instrumentsConsidered: number;
  readonly instrumentsFailed: readonly FailedInstrument[];
}
