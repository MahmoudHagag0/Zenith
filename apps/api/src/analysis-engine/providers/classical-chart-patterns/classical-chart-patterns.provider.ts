import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import { generateChartPatternCandidates } from './classical-chart-patterns-candidate-generator.util';
import { applyShapeCriteria } from './classical-chart-patterns-shape-criteria.util';
import { scoreConfirmation } from './classical-chart-patterns-confirmation.util';
import { finalizeChartPatternHypotheses, CONFIRMATION_TEXT } from './classical-chart-patterns-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './classical-chart-patterns-confidence.util';
import { normalizeClassicalChartPatternsResult } from './classical-chart-patterns-normalize.util';
import type { ChartPatternCandidate } from './classical-chart-patterns.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constant (S1-014 Sprint Brief, Missing
 * Decisions) for the shared computation call this Provider makes. The
 * swing sensitivity matches the value chosen for all four prior
 * Providers so every Provider reads the same underlying structural
 * substrate consistently -- not because this Provider depends on any of
 * them (S1-014 Sprint Brief, Scope item 2).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * The Classical Chart Patterns Analysis Provider (S1-014) -- the fifth
 * real `AnalysisProvider` (ADR-006), reading Head and Shoulders (+
 * Inverse) and Double Top/Bottom reversal shapes over the shared,
 * methodology-neutral computation substrate (S1-007) and Provider
 * contract (S1-008). Every Classical-Chart-Patterns-specific concept
 * lives only inside `providers/classical-chart-patterns/` -- the shared
 * framework (`AnalysisProvider`, the Execution Engine, Lifecycle,
 * Confidence Model, Traceability, dependency system, observability,
 * Confluence Engine) remains generic, exactly as it must for every
 * future Provider to plug in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory -- verified mechanically by
 * `classical-chart-patterns-independence-boundary.spec.ts`.
 *
 * Tier `SLOW`: a bounded multi-hypothesis search, the same tiering
 * category as every other slow, bounded-search Provider in this system.
 *
 * Deliberately does not inject `INDICATOR_ENGINE` -- this Provider's
 * shape/confirmation criteria are expressed directly over swing prices
 * and `MarketSeries` points, with no genuine use for any existing
 * calculator.
 */
@Injectable()
export class ClassicalChartPatternsProvider implements AnalysisProvider {
  readonly id = 'CLASSICAL_CHART_PATTERNS';
  readonly methodologyFamily = 'CLASSICAL_CHART_PATTERNS';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
    @Inject(SWING_DETECTOR) private readonly swingDetector: SwingDetector,
    @Inject(REGIME_CONTEXT) private readonly regimeContext: RegimeContext,
  ) {}

  async analyze(series: MarketSeries): Promise<AnalysisProviderResult> {
    const swingResult = this.swingDetector.detect(series, { sensitivity: SWING_SENSITIVITY });
    const regimeResult = this.regimeContext.getRegime(series, {
      adxPeriod: ADX_PERIOD,
      atrPeriod: ATR_PERIOD,
      swingSensitivity: SWING_SENSITIVITY,
      adxTrendingThreshold: ADX_TRENDING_THRESHOLD,
      volatilityMultiplier: VOLATILITY_MULTIPLIER,
    });

    const rawCandidates = generateChartPatternCandidates(swingResult);
    const shapeValidCandidates = rawCandidates.map((candidate) => applyShapeCriteria(candidate)).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);

    if (shapeValidCandidates.length === 0) {
      return this.buildLimitationsResult(series, swingResult, regimeResult, 'No candidate satisfied either Head and Shoulders or Double Top/Bottom shape criteria in the supplied series.');
    }

    const scoredCandidates = shapeValidCandidates.map((candidate) => scoreConfirmation(candidate, series));
    const hypotheses = finalizeChartPatternHypotheses(scoredCandidates);

    const interpretation: Interpretation[] = hypotheses.map((hypothesis) => ({
      summary: this.buildSummary(hypothesis),
      confidence: buildInterpretationConfidence(hypothesis),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(hypothesis, regimeResult),
    }));

    const primary = hypotheses[0];

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(hypotheses),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Primary reading synthesized from a ${primary.patternType} match; ${hypotheses.length} hypothesis(es) survived shape-criterion filtering and are ranked by confirmation status.`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeClassicalChartPatternsResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes each hypothesis's disclosed summary: which pattern type
   * matched and why, its own confirmation status, what weakens it, and
   * what would invalidate it -- the same transparency discipline
   * established across every prior bounded-hypothesis Provider in this
   * system.
   */
  private buildSummary(hypothesis: ChartPatternCandidate): string {
    const weaknessText = hypothesis.weaknesses.length > 0 ? hypothesis.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    return [
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${hypothesis.direction} ${hypothesis.patternType} pattern, ${CONFIRMATION_TEXT[hypothesis.confirmationStatus]}.`,
      hypothesis.survivalReasons.join(' '),
      weaknessText,
      hypothesis.invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly ChartPatternCandidate[]) {
    const primary = hypotheses[0];
    const detectedConditions = primary.points.map((point) => `${point.label}: ${point.price.toFixed(2)} at ${point.timestamp.toISOString()}.`);

    return {
      detectedConditions,
      missingConditions: [],
      supporting: [...primary.survivalReasons],
      conflicting: hypotheses.length > 1 ? [`An alternate, comparably-ranked ${hypotheses[1].patternType} interpretation also currently survives -- see interpretation[] for its own disclosure.`] : [],
    };
  }

  private buildLimitationsResult(series: MarketSeries, swingResult: SwingDetectionResult, regimeResult: RegimeContextResult, note: string): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: this.buildTraceability(swingResult, regimeResult),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(swingResult: SwingDetectionResult, regimeResult: RegimeContextResult) {
    const intermediateCalculations = [
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
    ];

    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence from confirmation status; Regime-Adjusted Confidence scaled by trendState=${regimeResult.trendState}; Detection Confidence from the weakest shape-criterion margin; Methodology Confidence Ceiling constant for CLASSICAL_CHART_PATTERNS.`,
    };
  }
}
