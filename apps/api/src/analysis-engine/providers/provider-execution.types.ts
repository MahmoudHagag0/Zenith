import type { AnalysisProviderResult } from './analysis-provider.types';

/**
 * Why a Provider did not participate in a run — always reported
 * explicitly, never silently treated as neutral or agreeing (ADR-006,
 * "Analysis Provider Framework" — Partial Failure).
 */
export type NonParticipationReason =
  | 'ERROR'
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'LIFECYCLE_EXCLUDED'
  | 'DEPENDENCY_NON_PARTICIPATING';

export interface ParticipatingEntry {
  readonly providerId: string;
  readonly result: AnalysisProviderResult;
}

export interface NonParticipatingEntry {
  readonly providerId: string;
  readonly reason: NonParticipationReason;
  readonly detail: string;
}

/**
 * Distinguishes "N of M available Providers participated" from the full
 * registered count — the Execution Engine never collapses a partial
 * result into an implied full one.
 */
export interface ExecutionRunResult {
  readonly participating: readonly ParticipatingEntry[];
  readonly nonParticipating: readonly NonParticipatingEntry[];
  readonly totalRegistered: number;
}
