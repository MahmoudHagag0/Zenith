import { Inject, Injectable } from '@nestjs/common';
import type { AnalysisProvider, AnalysisProviderResult, ProviderLifecycleState, ProviderTier } from '../analysis-provider.types';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR, type SwingDetector } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT, type RegimeContext } from '../../regime-context/regime-context.tokens';
import type { MarketSeries } from '../../market-series/market-series.types';

const COMPUTATION_VERSION = '1.0.0';

/**
 * The Wyckoff Method Analysis Provider (S1-009) — the first real
 * `AnalysisProvider` (ADR-006), reading price structure through the
 * Wyckoff Method's Schematic #1 (Accumulation/Distribution) via the
 * shared, methodology-neutral computation substrate (S1-007) and
 * Provider contract (S1-008). Every Wyckoff-specific concept (ranges,
 * events, phases) lives only inside `providers/wyckoff/` — the shared
 * framework (`AnalysisProvider`, the Execution Engine, Lifecycle,
 * Confidence Model, Traceability, dependency system, observability)
 * remains generic and Wyckoff-agnostic, exactly as it must for every
 * future Provider (ICT/SMC, Elliott Wave, and others) to plug into
 * without modification.
 *
 * Tier `SLOW`: its phase-schematic reading is a bounded multi-hypothesis
 * search, the same category as Elliott Wave (`22_ANALYSIS_ENGINE_ARCHITECTURE.md`,
 * Known Limitations) — it must never block a FAST-tier Provider's result.
 */
@Injectable()
export class WyckoffProvider implements AnalysisProvider {
  readonly id = 'WYCKOFF';
  readonly methodologyFamily = 'WYCKOFF';
  readonly computationVersion = COMPUTATION_VERSION;
  readonly lifecycleState: ProviderLifecycleState = 'ACTIVE';
  readonly tier: ProviderTier = 'SLOW';
  /** No Provider-to-Provider dependency — Wyckoff consumes shared computation (S1-007) directly, not another Provider's output. */
  readonly dependsOn = undefined;

  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
    @Inject(SWING_DETECTOR) private readonly swingDetector: SwingDetector,
    @Inject(REGIME_CONTEXT) private readonly regimeContext: RegimeContext,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyze(series: MarketSeries): Promise<AnalysisProviderResult> {
    throw new Error('WyckoffProvider.analyze() is not yet implemented — wired in WP2-WP8.');
  }

  normalize(): void {
    // No-op placeholder — see AnalysisProvider.normalize()'s doc comment
    // (ADR-006 establishes only that the method exists; ADR-007/S1-012
    // defines its real vocabulary; approved Architecture Team decision,
    // S1-008).
  }
}
