/**
 * Shared computation-metadata shape and builder for every Analysis Engine
 * computation (Indicator Engine, Swing Detection, Regime/Context Service),
 * per ADR-005 and 22_ANALYSIS_ENGINE_ARCHITECTURE.md ("Computation
 * Versioning"). Every computation output carries this metadata so a
 * Provider (S1-008+) can assemble Traceability from it.
 *
 * `computationVersion` is distinct from `contractVersion`: this file
 * versions computation *logic*, never output *shape* — `contractVersion`
 * is an Analysis Provider Framework concept (ADR-006) not introduced by
 * this sprint.
 */

/**
 * Per 22_ANALYSIS_ENGINE_ARCHITECTURE.md's Data Quality Model: "Indicator
 * Engine output inherits the freshness of the candles/quotes it
 * consumed." For historical, bar-derived data, "freshness" is a
 * completeness concept (see `MarketSeries`) — this reports whether the
 * input series had gaps (missing requested dates), not a staleness/age
 * concept, which does not apply to historical bars.
 */
export interface ComputationDataQuality {
  readonly completeness: 'COMPLETE' | 'GAPS_PRESENT';
  readonly missingDateCount: number;
}

export interface ComputationMetadata {
  /** Stable name of the computation, e.g. "RSI", "SwingDetection". */
  readonly computation: string;
  /** Parameters used for this specific computation, disclosed in full. */
  readonly parameters: Readonly<Record<string, unknown>>;
  /** Human-readable formula description. */
  readonly formula: string;
  /** Source attribution/citation for the formula. */
  readonly source: string;
  /** The input data range actually consumed. */
  readonly inputRange: {
    readonly from: string | null;
    readonly to: string | null;
    readonly pointCount: number;
  };
  /** ISO timestamp of when this computation ran. */
  readonly computedAt: string;
  /**
   * Versions the computation *logic* (formula/rule implementation), never
   * the output shape. Increments only when a change could alter a
   * previously-computed value for the same input (e.g. a formula
   * correction) — see "Computation Versioning" in
   * 22_ANALYSIS_ENGINE_ARCHITECTURE.md.
   */
  readonly computationVersion: string;
  /** Optional intermediate values meaningful to disclose (e.g. Wilder's smoothed average before the final RSI ratio). */
  readonly intermediateValues?: Readonly<Record<string, unknown>>;
  /** Attached by the orchestrating service (not the calculator itself) via `withDataQuality`, once the source `MarketSeries`'s completeness is known. */
  readonly dataQuality?: ComputationDataQuality;
}

/**
 * Attaches Data Quality (input completeness) to an already-computed
 * result, without requiring every individual calculator to know about
 * `MarketSeries.missingDates` — applied once, generically, by the
 * orchestrating service (Indicator Engine / Swing Detector / Regime
 * Context) that has access to the source `MarketSeries`.
 */
export function withDataQuality<T extends { metadata: ComputationMetadata }>(output: T, missingDateCount: number): T {
  return {
    ...output,
    metadata: {
      ...output.metadata,
      dataQuality: { completeness: missingDateCount > 0 ? 'GAPS_PRESENT' : 'COMPLETE', missingDateCount },
    },
  };
}

export function buildComputationMetadata(input: {
  computation: string;
  parameters: Record<string, unknown>;
  formula: string;
  source: string;
  points: ReadonlyArray<{ timestamp: Date }>;
  computationVersion: string;
  intermediateValues?: Record<string, unknown>;
}): ComputationMetadata {
  const first = input.points[0];
  const last = input.points[input.points.length - 1];
  return {
    computation: input.computation,
    parameters: { ...input.parameters },
    formula: input.formula,
    source: input.source,
    inputRange: {
      from: first ? first.timestamp.toISOString() : null,
      to: last ? last.timestamp.toISOString() : null,
      pointCount: input.points.length,
    },
    computedAt: new Date().toISOString(),
    computationVersion: input.computationVersion,
    ...(input.intermediateValues ? { intermediateValues: { ...input.intermediateValues } } : {}),
  };
}
