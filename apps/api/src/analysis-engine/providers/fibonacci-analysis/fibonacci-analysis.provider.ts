import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { ComputationOutput } from '../../indicator-engine/indicator-engine.types';
import { generateFibonacciLevels } from './fibonacci-analysis-level-generator.util';
import { clusterConfluence } from './fibonacci-analysis-confluence.util';
import { classifyReaction, determineRole } from './fibonacci-analysis-reaction-classifier.util';
import { scoreInterpretation, scoreQuality } from './fibonacci-analysis-quality-scoring.util';
import { buildInvalidation, buildSurvivalReasons, buildWeaknesses, selectHypotheses } from './fibonacci-analysis-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './fibonacci-analysis-confidence.util';
import { normalizeFibonacciAnalysisResult } from './fibonacci-analysis-normalize.util';
import type { FibonacciDirection, FibonacciHypothesis } from './fibonacci-analysis.types';
import type { NormalizedProviderOutput } from '../normalized-vocabulary.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-017 Sprint Brief, Missing
 * Decisions) for the shared computation calls this Provider makes. The
 * swing sensitivity matches the value chosen for every other registered
 * Provider so every Provider reads the same underlying structural
 * substrate consistently — not because this Provider depends on any of
 * them (S1-017 Sprint Brief, Scope item 1).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

function findAtrAtOrBefore(atrResult: ComputationOutput<Prisma.Decimal>, timestamp: Date): Prisma.Decimal | null {
  let found: Prisma.Decimal | null = null;
  for (const entry of atrResult.series) {
    if (entry.timestamp.getTime() <= timestamp.getTime()) {
      found = entry.value;
    } else {
      break;
    }
  }
  return found;
}

function flip(direction: FibonacciDirection): FibonacciDirection {
  return direction === 'BULLISH' ? 'BEARISH' : 'BULLISH';
}

/**
 * The Fibonacci Analysis Provider (S1-017) -- the eighth real
 * `AnalysisProvider` (ADR-006), reading cross-leg Fibonacci confluence:
 * retracement and extension levels drawn from a bounded window of recent
 * swing legs, clustered into confluence zones only where independently-
 * derived ratios genuinely agree, then read for their own reaction
 * quality and probabilistic support/resistance significance. Every
 * Fibonacci-Analysis-specific concept lives only inside
 * `providers/fibonacci-analysis/` -- the shared framework
 * (`AnalysisProvider`, the Execution Engine, Lifecycle, Confidence
 * Model, Traceability, dependency system, observability, Confluence
 * Engine) remains generic, exactly as it must for every future Provider
 * to plug in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory -- verified mechanically by
 * `fibonacci-analysis-independence-boundary.spec.ts`. Shared consumption
 * of `INDICATOR_ENGINE.fibonacciLevels()` (already consumed elsewhere in
 * this system for a different analytical purpose) is expected shared-
 * infrastructure reuse, never a coupling between Providers.
 *
 * Tier `SLOW`: a bounded multi-leg scan and a cross-leg clustering pass,
 * the same tiering category as every other bounded-multi-window-search
 * Provider in this system.
 */
@Injectable()
export class FibonacciAnalysisProvider implements AnalysisProvider {
  readonly id = 'FIBONACCI_ANALYSIS';
  readonly methodologyFamily = 'FIBONACCI_ANALYSIS';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency -- this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
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
    const atrResult = this.indicatorEngine.atr(series, { period: ATR_PERIOD });

    if (swingResult.swings.length < 2) {
      return this.buildLimitationsResult(series, swingResult, regimeResult, [], 'Fewer than two swings exist in the supplied series; no leg can be formed.');
    }

    const { levels, legMetadata } = generateFibonacciLevels(swingResult, this.indicatorEngine);
    const currentPoint = series.points[series.points.length - 1];
    const currentPrice = currentPoint.close;
    const atrValue = findAtrAtOrBefore(atrResult, currentPoint.timestamp) ?? new Prisma.Decimal(0);
    const candidates = clusterConfluence(levels, atrValue);

    const mostRecentSwingTimestamp = swingResult.swings[swingResult.swings.length - 1].timestamp;
    const subsequentPoints = series.points.filter((point) => point.timestamp.getTime() > mostRecentSwingTimestamp.getTime());

    const roleReferencePrice = subsequentPoints[0]?.close ?? currentPrice;

    const allHypotheses: FibonacciHypothesis[] = candidates.map((candidate) => {
      const role = determineRole(candidate.price, roleReferencePrice);
      const reactionState = classifyReaction(candidate.price, role, subsequentPoints, atrValue);
      const qualityScore = scoreQuality(candidate, atrValue);
      const interpretationScore = scoreInterpretation(qualityScore, reactionState);
      const invalidation = buildInvalidation(candidate);
      const baseDirection: FibonacciDirection = role === 'SUPPORT' ? 'BULLISH' : 'BEARISH';
      const direction = reactionState === 'BROKEN' ? flip(baseDirection) : baseDirection;

      const draft: FibonacciHypothesis = { candidate, direction, reactionState, qualityScore, interpretationScore, invalidation, survivalReasons: [], weaknesses: [] };
      return { ...draft, survivalReasons: buildSurvivalReasons(draft), weaknesses: buildWeaknesses(draft) };
    });

    const hypotheses = selectHypotheses(allHypotheses, currentPrice);

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
        assumptions: [`Primary reading synthesized from the level/zone nearest to current price; ${hypotheses.length} hypothesis(es) survived, ranked by proximity.`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, atrResult, legMetadata),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(result: AnalysisProviderResult): NormalizedProviderOutput {
    return normalizeFibonacciAnalysisResult(this.id, this.methodologyFamily, result);
  }

  /**
   * Composes this reading's disclosed summary: machine-parseable
   * `[DIRECTION:...]`/`[REACTION:...]` tags (consumed only by this
   * Provider's own `normalize()` mapping, never by another Provider),
   * followed by the human-readable disclosure of why this reading
   * currently holds, what weakens it, and what would invalidate it --
   * the same transparency discipline established across every prior
   * Provider in this system.
   */
  private buildSummary(hypothesis: FibonacciHypothesis): string {
    const weaknessText = hypothesis.weaknesses.length > 0 ? hypothesis.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    const ratios = [...new Set(hypothesis.candidate.contributingLevels.map((level) => level.ratio))].join('/');
    return [
      `[DIRECTION:${hypothesis.direction}] [REACTION:${hypothesis.reactionState}]`,
      `The strongest currently-surviving interpretation (not asserted as the objectively correct reading): a ${hypothesis.candidate.dominantType} ${hypothesis.candidate.confluenceCount > 1 ? 'confluence zone' : 'level'} (ratio(s) ${ratios}) at ${hypothesis.candidate.price.toFixed(2)}, ${hypothesis.candidate.confluenceCount} independent leg(s) agreeing.`,
      hypothesis.survivalReasons.join(' '),
      weaknessText,
      hypothesis.invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly FibonacciHypothesis[]) {
    const primary = hypotheses[0];
    const detectedConditions = hypotheses.map(
      (hypothesis) => `${hypothesis.candidate.dominantType} ${hypothesis.candidate.confluenceCount > 1 ? 'confluence zone' : 'level'} at ${hypothesis.candidate.price.toFixed(2)} (${hypothesis.candidate.confluenceCount} leg(s)).`,
    );

    return {
      detectedConditions,
      missingConditions: [],
      supporting: [...primary.survivalReasons],
      conflicting: hypotheses.flatMap((hypothesis) => hypothesis.weaknesses),
    };
  }

  private buildLimitationsResult(
    series: MarketSeries,
    swingResult: SwingDetectionResult,
    regimeResult: RegimeContextResult,
    legMetadata: readonly { computation: string; computationVersion: string }[],
    note: string,
  ): AnalysisProviderResult {
    return {
      contractVersion: CONTRACT_VERSION,
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [],
      limitations: {
        dataQuality: series.points.length === 0 ? 'MISSING' : series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [],
        notes: [note],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, undefined, legMetadata),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(
    swingResult: SwingDetectionResult,
    regimeResult: RegimeContextResult,
    atrResult: ComputationOutput<Prisma.Decimal> | undefined,
    legMetadata: readonly { computation: string; computationVersion: string }[],
  ) {
    const intermediateCalculations = [
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
    ];
    if (atrResult) {
      intermediateCalculations.push({ computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion });
    }
    if (legMetadata.length > 0) {
      intermediateCalculations.push({ computation: legMetadata[0].computation, computationVersion: legMetadata[0].computationVersion });
    }

    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence adjusted by reaction state; Regime-Adjusted Confidence scaled by volatilityState=${regimeResult.volatilityState}, bifurcated by retracement-vs-extension level type; Detection Confidence from this reading's own weakest-link confluence/precision margin; Methodology Confidence Ceiling constant for FIBONACCI_ANALYSIS.`,
    };
  }
}
