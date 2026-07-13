import { Module } from '@nestjs/common';
import { MarketDataModule } from '../market-data/market-data.module';
import { ComputationCacheService } from './common/computation-cache.service';
import { ObservabilityService } from './common/observability.service';
import { MarketSeriesService } from './market-series/market-series.service';
import { IndicatorEngineService } from './indicator-engine/indicator-engine.service';
import { INDICATOR_ENGINE } from './indicator-engine/indicator-engine.tokens';
import { SwingDetectionService } from './swing-detection/swing-detection.service';
import { SWING_DETECTOR } from './swing-detection/swing-detection.tokens';
import { RegimeContextService } from './regime-context/regime-context.service';
import { REGIME_CONTEXT } from './regime-context/regime-context.tokens';
import { ProvidersModule } from './providers/providers.module';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from './providers/analysis-provider.tokens';

/**
 * S1-007 — Analysis Engine Foundation (Indicator Engine, Swing Detection
 * Infrastructure, Regime/Context Service) and S1-008 — Analysis Provider
 * Framework (Provider registry, Execution Engine), per ADR-005/ADR-006
 * and 22_ANALYSIS_ENGINE_ARCHITECTURE.md. Every service here is consumed
 * exclusively via its injection token (never its concrete class),
 * following the `MARKET_DATA_PROVIDER` precedent of ADR-003. No
 * controller, no HTTP surface — these are internal, composable services
 * only; interpretation (Evidence/Confidence/trading language) begins
 * only once a real Analysis Provider exists (S1-009). No new Prisma
 * models; depends one-way on `MarketDataModule` (Market Data has zero
 * knowledge of this module).
 */
@Module({
  imports: [MarketDataModule, ProvidersModule],
  providers: [
    ComputationCacheService,
    ObservabilityService,
    MarketSeriesService,
    { provide: INDICATOR_ENGINE, useClass: IndicatorEngineService },
    { provide: SWING_DETECTOR, useClass: SwingDetectionService },
    { provide: REGIME_CONTEXT, useClass: RegimeContextService },
  ],
  exports: [MarketSeriesService, INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT, ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE],
})
export class AnalysisEngineModule {}
