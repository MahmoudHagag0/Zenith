import { Test, TestingModule } from '@nestjs/testing';
import { ComputationCacheService } from './common/computation-cache.service';
import { ObservabilityService } from './common/observability.service';
import { IndicatorEngineService } from './indicator-engine/indicator-engine.service';
import { INDICATOR_ENGINE } from './indicator-engine/indicator-engine.tokens';
import { SwingDetectionService } from './swing-detection/swing-detection.service';
import { SWING_DETECTOR } from './swing-detection/swing-detection.tokens';
import { RegimeContextService } from './regime-context/regime-context.service';
import { REGIME_CONTEXT } from './regime-context/regime-context.tokens';
import { ANALYSIS_PROVIDERS } from './providers/analysis-provider.tokens';
import { WyckoffProvider } from './providers/wyckoff/wyckoff.provider';
import type { IndicatorEngine } from './indicator-engine/indicator-engine.tokens';
import type { SwingDetector } from './swing-detection/swing-detection.tokens';
import type { RegimeContext } from './regime-context/regime-context.tokens';
import type { AnalysisProvider } from './providers/analysis-provider.types';

/**
 * Verifies `AnalysisEngineModule`'s actual `ANALYSIS_PROVIDERS` wiring —
 * the real `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` service
 * classes (not mocks), exactly as registered there — per the S1-009 Task
 * Breakdown's WP9 verification checkpoint: the array must resolve to
 * exactly one entry, `WyckoffProvider`, the first real methodology
 * Provider (S1-008 registered none; ADR-006: "every future Provider
 * sprint, S1-009 onward"). Deliberately does not import the real
 * `AnalysisEngineModule` (which pulls in `MarketDataModule` ->
 * `DatabaseModule`, a live Prisma connection this unit test has no need
 * of) — this replicates only the providers this specific factory
 * depends on, matching `AnalysisEngineModule`'s own registration
 * exactly.
 */
describe('AnalysisEngineModule ANALYSIS_PROVIDERS wiring (S1-009 WP9)', () => {
  it('resolves to exactly one entry: WyckoffProvider, built from the real shared services', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComputationCacheService,
        ObservabilityService,
        { provide: INDICATOR_ENGINE, useClass: IndicatorEngineService },
        { provide: SWING_DETECTOR, useClass: SwingDetectionService },
        { provide: REGIME_CONTEXT, useClass: RegimeContextService },
        {
          provide: ANALYSIS_PROVIDERS,
          useFactory: (indicatorEngine: IndicatorEngine, swingDetector: SwingDetector, regimeContext: RegimeContext): AnalysisProvider[] => [
            new WyckoffProvider(indicatorEngine, swingDetector, regimeContext),
          ],
          inject: [INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT],
        },
      ],
    }).compile();

    const providers = module.get<AnalysisProvider[]>(ANALYSIS_PROVIDERS);
    expect(providers).toHaveLength(1);
    expect(providers[0]).toBeInstanceOf(WyckoffProvider);
    expect(providers[0].id).toBe('WYCKOFF');
    expect(providers[0].methodologyFamily).toBe('WYCKOFF');
    expect(providers[0].lifecycleState).toBe('ACTIVE');
  });
});
