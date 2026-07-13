import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import type { AnalysisProvider, AnalysisProviderResult, Interpretation, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import { generateWaveCountCandidates } from './elliott-wave-candidate-generator.util';
import { applyElliottRules } from './elliott-wave-rules.util';
import { scoreFibonacciGuidelines } from './elliott-wave-fibonacci-guideline.util';
import { finalizeWaveCountHypotheses } from './elliott-wave-hypothesis.util';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './elliott-wave-confidence.util';
import type { WaveCountCandidate } from './elliott-wave.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-011 Sprint Brief, Missing
 * Decisions) for the shared computation calls this Provider makes. The
 * swing sensitivity matches the value chosen for both prior Providers so
 * every Provider reads the same underlying structural substrate
 * consistently — not because this Provider depends on either of them
 * (S1-011 Sprint Brief, Scope item 2).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * The Elliott Wave Analysis Provider (S1-011) — the third real
 * `AnalysisProvider` (ADR-006), reading a bounded 5-wave motive (impulse)
 * count over the shared, methodology-neutral computation substrate
 * (S1-007) and Provider contract (S1-008). Every Elliott-Wave-specific
 * concept lives only inside `providers/elliott-wave/` — the shared
 * framework (`AnalysisProvider`, the Execution Engine, Lifecycle,
 * Confidence Model, Traceability, dependency system, observability)
 * remains generic, exactly as it must for every future Provider to plug
 * in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory — verified mechanically by
 * `elliott-wave-independence-boundary.spec.ts`.
 *
 * Tier `SLOW`: the architecture document's own named example of a
 * bounded multi-hypothesis search that must never block a FAST-tier
 * Provider's result.
 *
 * Per the Architecture Team's Implementation Guidance #6: every surviving
 * candidate is the strongest currently-valid interpretation of the
 * available evidence, never claimed as objectively correct — reflected
 * throughout this module's own wording, not only in its output text.
 */
@Injectable()
export class ElliottWaveProvider implements AnalysisProvider {
  readonly id = 'ELLIOTT_WAVE';
  readonly methodologyFamily = 'ELLIOTT_WAVE';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency — this Provider consumes shared computation (S1-007) directly, never another Provider's output. */
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

    const rawCandidates = generateWaveCountCandidates(swingResult);
    const validatedCandidates = rawCandidates.map((candidate) => applyElliottRules(candidate)).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);

    if (validatedCandidates.length === 0) {
      return this.buildLimitationsResult(
        series,
        swingResult,
        regimeResult,
        "No 5-wave motive (impulse) candidate survived Elliott's Three Rules in the supplied series.",
      );
    }

    const scoredCandidates = validatedCandidates.map((candidate) => scoreFibonacciGuidelines(candidate, this.indicatorEngine));
    const hypotheses = finalizeWaveCountHypotheses(scoredCandidates);

    const interpretation: Interpretation[] = hypotheses.map((hypothesis) => ({
      summary: this.buildSummary(hypothesis),
      confidence: buildInterpretationConfidence(hypothesis),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(hypothesis, regimeResult),
    }));

    const primary = hypotheses[0];
    const fibonacciMetadataSample = this.indicatorEngine.fibonacciLevels({ anchorStart: primary.legs[0].startPrice, anchorEnd: primary.legs[0].endPrice });

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(hypotheses),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Primary wave count synthesized from ${primary.legs.length} legs; ${hypotheses.length} hypothesis(es) survived Elliott's Three Rules and are ranked by Fibonacci-guideline proximity.`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, fibonacciMetadataSample.metadata),
      detectionConfidence: buildDetectionConfidence(primary),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(): void {
    // No-op placeholder — see AnalysisProvider.normalize()'s doc comment
    // (ADR-006 establishes only that the method exists; ADR-007/S1-012
    // defines its real vocabulary; approved Architecture Team decision,
    // S1-008).
  }

  /**
   * Composes each hypothesis's disclosed summary per Implementation
   * Guidance #5 (why it survives / what weakens it / what invalidates
   * it) and Implementation Guidance #6 (the strongest currently-
   * surviving interpretation, never claimed as objectively correct).
   */
  private buildSummary(hypothesis: WaveCountCandidate): string {
    const weaknessText = hypothesis.weaknesses.length > 0 ? hypothesis.weaknesses.join(' ') : 'No material weakness identified in this reading.';
    return [
      `The strongest currently-surviving interpretation (not asserted as the objectively correct count): a ${hypothesis.direction} 5-wave impulse.`,
      hypothesis.survivalReasons.join(' '),
      weaknessText,
      hypothesis.invalidation.description,
    ].join(' ');
  }

  private buildEvidence(hypotheses: readonly WaveCountCandidate[]) {
    const primary = hypotheses[0];
    const detectedConditions = primary.legs.map((leg) => `Wave ${leg.waveNumber}: ${leg.startPrice.toFixed(2)} -> ${leg.endPrice.toFixed(2)}.`);

    return {
      detectedConditions,
      missingConditions: [],
      supporting: [...primary.survivalReasons],
      conflicting: hypotheses.length > 1 ? [`An alternate, comparably-ranked ${hypotheses[1].direction} interpretation also currently survives -- see interpretation[] for its own disclosure.`] : [],
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
      traceability: this.buildTraceability(swingResult, regimeResult, null),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(swingResult: SwingDetectionResult, regimeResult: RegimeContextResult, fibonacciMetadata: ReturnType<IndicatorEngine['fibonacciLevels']>['metadata'] | null) {
    const intermediateCalculations = [
      { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
      { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
      ...(fibonacciMetadata ? [{ computation: fibonacciMetadata.computation, computationVersion: fibonacciMetadata.computationVersion }] : []),
    ];

    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings.`],
      intermediateCalculations,
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence from Fibonacci-guideline proximity; Regime-Adjusted Confidence scaled by trendState=${regimeResult.trendState}; Detection Confidence from the weakest Rule margin; Methodology Confidence Ceiling constant for ELLIOTT_WAVE.`,
    };
  }
}
