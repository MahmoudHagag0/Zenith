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
import { deriveDisplacementLegs } from './ict-smc-displacement.util';
import { detectOrderBlocks } from './ict-smc-order-block.detector';
import { detectFairValueGaps } from './ict-smc-fvg.detector';
import { detectLiquiditySweeps } from './ict-smc-liquidity-sweep.detector';
import { classifyIctSmcBias } from './ict-smc-bias.classifier';
import { buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './ict-smc-confidence.util';
import type { FairValueGap, LiquiditySweep, OrderBlock } from './ict-smc.types';

const COMPUTATION_VERSION = '1.0.0';
const CONTRACT_VERSION = '1.0.0';

/**
 * Disclosed, named calibration constants (S1-010 Sprint Brief, Missing
 * Decisions) for the shared computation calls this Provider makes. The
 * swing sensitivity matches the value chosen for S1-009's Provider so
 * every Provider reads the same underlying structural substrate
 * consistently — not because either Provider depends on the other
 * (S1-010 Sprint Brief, Scope item 2).
 */
const SWING_SENSITIVITY = 3;
const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const ADX_TRENDING_THRESHOLD = 25;
const VOLATILITY_MULTIPLIER = 1.5;

/**
 * The ICT / Smart Money Concepts Analysis Provider (S1-010) — the second
 * real `AnalysisProvider` (ADR-006), reading Order Blocks, Fair Value
 * Gaps, and Liquidity Sweeps via the shared, methodology-neutral
 * computation substrate (S1-007) and Provider contract (S1-008). Every
 * ICT/SMC-specific concept lives only inside `providers/ict-smc/` — the
 * shared framework (`AnalysisProvider`, the Execution Engine, Lifecycle,
 * Confidence Model, Traceability, dependency system, observability)
 * remains generic, exactly as it must for every future Provider to plug
 * in without modification.
 *
 * Fully independent of every other registered Provider: no `dependsOn`,
 * no shared internal types or utilities imported from any other
 * Provider's own module directory — verified mechanically by
 * `ict-smc-independence-boundary.spec.ts`.
 *
 * Tier `FAST`: unlike a bounded multi-hypothesis phase-schematic search
 * (the category S1-009's Provider falls into), this Provider's V1
 * detection rules are each a single deterministic pass over the series
 * with no phase-hypothesis search.
 */
@Injectable()
export class IctSmcProvider implements AnalysisProvider {
  readonly id = 'ICT_SMC';
  readonly methodologyFamily = 'ICT_SMC';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'FAST';
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

    const displacementLegs = deriveDisplacementLegs(series.points, swingResult);
    const orderBlocks = detectOrderBlocks(series.points, displacementLegs);

    const atrResult = this.indicatorEngine.atr(series, { period: ATR_PERIOD });
    const latestAtr = atrResult.series[atrResult.series.length - 1]?.value ?? new Prisma.Decimal(0);

    const fairValueGaps = detectFairValueGaps(series.points, latestAtr, displacementLegs);
    const liquiditySweeps = detectLiquiditySweeps(series.points, swingResult, latestAtr, displacementLegs);

    const totalPrimitives = orderBlocks.length + fairValueGaps.length + liquiditySweeps.length;
    if (totalPrimitives === 0) {
      return this.buildLimitationsResult(
        series,
        swingResult,
        regimeResult,
        atrResult,
        'No Order Block, Fair Value Gap, Liquidity Sweep, or structure event identified in the supplied series.',
      );
    }

    const hypotheses = classifyIctSmcBias(orderBlocks, fairValueGaps, liquiditySweeps);
    const interpretation: Interpretation[] = hypotheses.map((hypothesis) => ({
      summary: hypothesis.summary,
      confidence: buildInterpretationConfidence(hypothesis),
      regimeAdjustedConfidence: buildRegimeAdjustedConfidence(hypothesis, regimeResult),
    }));

    return {
      contractVersion: CONTRACT_VERSION,
      evidence: this.buildEvidence(orderBlocks, fairValueGaps, liquiditySweeps, hypotheses.length > 1),
      interpretation,
      limitations: {
        dataQuality: series.missingDates.length > 0 ? 'GAPS_PRESENT' : 'COMPLETE',
        assumptions: [`Bias synthesized from ${orderBlocks.length} Order Block(s), ${fairValueGaps.length} Fair Value Gap(s), ${liquiditySweeps.length} Liquidity Sweep(s).`],
        notes: [],
      },
      traceability: this.buildTraceability(swingResult, regimeResult, atrResult),
      detectionConfidence: buildDetectionConfidence(totalPrimitives),
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  normalize(): void {
    // No-op placeholder — see AnalysisProvider.normalize()'s doc comment
    // (ADR-006 establishes only that the method exists; ADR-007/S1-012
    // defines its real vocabulary; approved Architecture Team decision,
    // S1-008).
  }

  private buildEvidence(orderBlocks: readonly OrderBlock[], fairValueGaps: readonly FairValueGap[], liquiditySweeps: readonly LiquiditySweep[], conflicting: boolean) {
    const detectedConditions = [
      ...orderBlocks.map((ob) => `${ob.direction} Order Block at ${ob.timestamp.toISOString()} (${ob.low.toFixed(2)}-${ob.high.toFixed(2)}).`),
      ...fairValueGaps.map(
        (fvg) => `${fvg.direction} Fair Value Gap ${fvg.startTimestamp.toISOString()}-${fvg.endTimestamp.toISOString()} (${fvg.gapLow.toFixed(2)}-${fvg.gapHigh.toFixed(2)}).`,
      ),
      ...liquiditySweeps.map((sweep) => `${sweep.direction} Liquidity Sweep at ${sweep.timestamp.toISOString()} (swept level ${sweep.sweptLevel.toFixed(2)}).`),
    ];

    const candidateKinds: Array<[string, boolean]> = [
      ['BULLISH Order Block', orderBlocks.some((ob) => ob.direction === 'BULLISH')],
      ['BEARISH Order Block', orderBlocks.some((ob) => ob.direction === 'BEARISH')],
      ['BULLISH Fair Value Gap', fairValueGaps.some((fvg) => fvg.direction === 'BULLISH')],
      ['BEARISH Fair Value Gap', fairValueGaps.some((fvg) => fvg.direction === 'BEARISH')],
      ['BULLISH Liquidity Sweep', liquiditySweeps.some((sweep) => sweep.direction === 'BULLISH')],
      ['BEARISH Liquidity Sweep', liquiditySweeps.some((sweep) => sweep.direction === 'BEARISH')],
    ];
    const missingConditions = candidateKinds.filter(([, present]) => !present).map(([label]) => `${label} not detected.`);

    return {
      detectedConditions,
      missingConditions,
      supporting: detectedConditions,
      conflicting: conflicting ? ['Bullish and Bearish bias evidence are equally supported -- see interpretation[] for both ranked readings.'] : [],
    };
  }

  private buildLimitationsResult(
    series: MarketSeries,
    swingResult: SwingDetectionResult,
    regimeResult: RegimeContextResult,
    atrResult: ComputationOutput<Prisma.Decimal>,
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
      traceability: this.buildTraceability(swingResult, regimeResult, atrResult),
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(0), explanation: note },
      methodologyConfidenceCeiling: buildMethodologyConfidenceCeiling(),
    };
  }

  private buildTraceability(swingResult: SwingDetectionResult, regimeResult: RegimeContextResult, atrResult: ComputationOutput<Prisma.Decimal>) {
    return {
      rawDataReferences: [`SwingDetection input range: ${swingResult.swings.length} swings, ${swingResult.structureEvents.length} structure events.`],
      intermediateCalculations: [
        { computation: swingResult.metadata.computation, computationVersion: swingResult.metadata.computationVersion },
        { computation: regimeResult.metadata.computation, computationVersion: regimeResult.metadata.computationVersion },
        { computation: atrResult.metadata.computation, computationVersion: atrResult.metadata.computationVersion },
      ],
      conditionDerivations: [`Regime read: ${regimeResult.trendState}/${regimeResult.volatilityState}.`],
      confidenceDerivation: `Interpretation Confidence from bias-hypothesis score; Regime-Adjusted Confidence scaled by trendState=${regimeResult.trendState} and dominant primitive type; Methodology Confidence Ceiling constant for ICT_SMC.`,
    };
  }
}
