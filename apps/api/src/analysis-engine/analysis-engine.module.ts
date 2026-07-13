import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComputationCacheService } from './common/computation-cache.service';
import { ObservabilityService } from './common/observability.service';
import { MarketSeriesService } from './market-series/market-series.service';
import { IndicatorEngineService } from './indicator-engine/indicator-engine.service';
import { INDICATOR_ENGINE, type IndicatorEngine } from './indicator-engine/indicator-engine.tokens';
import { SwingDetectionService } from './swing-detection/swing-detection.service';
import { SWING_DETECTOR, type SwingDetector } from './swing-detection/swing-detection.tokens';
import { RegimeContextService } from './regime-context/regime-context.service';
import { REGIME_CONTEXT, type RegimeContext } from './regime-context/regime-context.tokens';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from './providers/analysis-provider.tokens';
import { ProviderExecutionService } from './providers/provider-execution.service';
import { WyckoffProvider } from './providers/wyckoff/wyckoff.provider';
import { IctSmcProvider } from './providers/ict-smc/ict-smc.provider';
import { ElliottWaveProvider } from './providers/elliott-wave/elliott-wave.provider';
import type { AnalysisProvider } from './providers/analysis-provider.types';

/**
 * S1-007 — Analysis Engine Foundation (Indicator Engine, Swing Detection
 * Infrastructure, Regime/Context Service), S1-008 — Analysis Provider
 * Framework (Provider registry, Execution Engine), and S1-009 — the
 * first real Analysis Provider (`WyckoffProvider`), per ADR-005/006 and
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md. Every service here is consumed
 * exclusively via its injection token (never its concrete class),
 * following the `MARKET_DATA_PROVIDER` precedent of ADR-003.
 *
 * `ANALYSIS_PROVIDERS`'s factory is registered here, not in a separate
 * imported module, because it must construct `WyckoffProvider`/
 * `IctSmcProvider`/`ElliottWaveProvider` with the same shared
 * `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` instances this
 * module already owns (NestJS module encapsulation: a module cannot
 * inject a provider declared only in a module that imports it — only the
 * reverse). A future Provider is added the same way: a concrete class
 * plus an entry in this factory's `inject` array, never by editing any
 * existing Provider's own code.
 *
 * No controller, no HTTP surface — these are internal, composable
 * services only. No new Prisma models; depends one-way on
 * `MarketDataModule` (Market Data has zero knowledge of this module).
 */
@Module({
  imports: [MarketDataModule],
  providers: [
    ComputationCacheService,
    ObservabilityService,
    MarketSeriesService,
    { provide: INDICATOR_ENGINE, useClass: IndicatorEngineService },
    { provide: SWING_DETECTOR, useClass: SwingDetectionService },
    { provide: REGIME_CONTEXT, useClass: RegimeContextService },
    {
      provide: ANALYSIS_PROVIDERS,
      useFactory: (indicatorEngine: IndicatorEngine, swingDetector: SwingDetector, regimeContext: RegimeContext): AnalysisProvider[] => [
        new WyckoffProvider(indicatorEngine, swingDetector, regimeContext),
        new IctSmcProvider(indicatorEngine, swingDetector, regimeContext),
        new ElliottWaveProvider(indicatorEngine, swingDetector, regimeContext),
      ],
      inject: [INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT],
    },
    { provide: PROVIDER_EXECUTION_ENGINE, useClass: ProviderExecutionService },
  ],
  exports: [MarketSeriesService, INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT, ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE],
})
export class AnalysisEngineModule {}
