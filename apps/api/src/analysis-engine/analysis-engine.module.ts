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

/**
 * S1-007 — Analysis Engine Foundation. Per ADR-005 and
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md: the Indicator Engine, Swing
 * Detection Infrastructure, and Regime/Context Service are each consumed
 * exclusively via their injection tokens (never their concrete classes),
 * following the `MARKET_DATA_PROVIDER` precedent of ADR-003. No
 * controller, no HTTP surface — these are internal, composable services
 * only; interpretation begins at the Analysis Provider Framework
 * (ADR-006, S1-008). No new Prisma models; depends one-way on
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
  ],
  exports: [MarketSeriesService, INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT],
})
export class AnalysisEngineModule {}
