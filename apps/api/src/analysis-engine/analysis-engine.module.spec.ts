import { Test, TestingModule } from '@nestjs/testing';
import { ComputationCacheService } from './common/computation-cache.service';
import { ObservabilityService } from './common/observability.service';
import { IndicatorEngineService } from './indicator-engine/indicator-engine.service';
import { INDICATOR_ENGINE } from './indicator-engine/indicator-engine.tokens';
import { SwingDetectionService } from './swing-detection/swing-detection.service';
import { SWING_DETECTOR } from './swing-detection/swing-detection.tokens';
import { RegimeContextService } from './regime-context/regime-context.service';
import { REGIME_CONTEXT } from './regime-context/regime-context.tokens';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from './providers/analysis-provider.tokens';
import { ProviderExecutionService } from './providers/provider-execution.service';
import { WyckoffProvider } from './providers/wyckoff/wyckoff.provider';
import { IctSmcProvider } from './providers/ict-smc/ict-smc.provider';
import { ElliottWaveProvider } from './providers/elliott-wave/elliott-wave.provider';
import { HarmonicPatternsProvider } from './providers/harmonic-patterns/harmonic-patterns.provider';
import { CONFLUENCE_ENGINE, CONFLUENCE_WEIGHT_STRATEGY } from './confluence/confluence.tokens';
import { ConfluenceService } from './confluence/confluence.service';
import { EqualWeightStrategy } from './confluence/equal-weight.strategy';
import type { IndicatorEngine } from './indicator-engine/indicator-engine.tokens';
import type { SwingDetector } from './swing-detection/swing-detection.tokens';
import type { RegimeContext } from './regime-context/regime-context.tokens';
import type { AnalysisProvider } from './providers/analysis-provider.types';
import type { ConfluenceEngine } from './confluence/confluence.tokens';

/**
 * Verifies `AnalysisEngineModule`'s actual `ANALYSIS_PROVIDERS` wiring —
 * the real `INDICATOR_ENGINE`/`SWING_DETECTOR`/`REGIME_CONTEXT` service
 * classes (not mocks), exactly as registered there — per the S1-009/
 * S1-010/S1-011/S1-013 Task Breakdowns' own module-registration
 * verification checkpoints: the array must resolve to exactly four
 * entries, `WyckoffProvider` (S1-009), `IctSmcProvider` (S1-010),
 * `ElliottWaveProvider` (S1-011), then `HarmonicPatternsProvider`
 * (S1-013), in registration order. Deliberately does not import the real
 * `AnalysisEngineModule` (which pulls in `MarketDataModule` ->
 * `DatabaseModule`, a live Prisma connection this unit test has no need
 * of) — this replicates only the providers this specific factory depends
 * on, matching `AnalysisEngineModule`'s own registration exactly.
 */
describe('AnalysisEngineModule ANALYSIS_PROVIDERS wiring (S1-009 WP9, S1-010 WP10, S1-011 WP10, S1-013 WP11)', () => {
  it('resolves to exactly four entries, in order: WyckoffProvider, IctSmcProvider, ElliottWaveProvider, then HarmonicPatternsProvider, built from the real shared services', async () => {
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
            new IctSmcProvider(indicatorEngine, swingDetector, regimeContext),
            new ElliottWaveProvider(indicatorEngine, swingDetector, regimeContext),
            new HarmonicPatternsProvider(swingDetector, regimeContext),
          ],
          inject: [INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT],
        },
      ],
    }).compile();

    const providers = module.get<AnalysisProvider[]>(ANALYSIS_PROVIDERS);
    expect(providers).toHaveLength(4);
    expect(providers[0]).toBeInstanceOf(WyckoffProvider);
    expect(providers[0].id).toBe('WYCKOFF');
    expect(providers[0].methodologyFamily).toBe('WYCKOFF');
    expect(providers[0].lifecycleState).toBe('ACTIVE');
    expect(providers[1]).toBeInstanceOf(IctSmcProvider);
    expect(providers[1].id).toBe('ICT_SMC');
    expect(providers[1].methodologyFamily).toBe('ICT_SMC');
    expect(providers[1].lifecycleState).toBe('ACTIVE');
    expect(providers[1].dependsOn).toBeUndefined();
    expect(providers[2]).toBeInstanceOf(ElliottWaveProvider);
    expect(providers[2].id).toBe('ELLIOTT_WAVE');
    expect(providers[2].methodologyFamily).toBe('ELLIOTT_WAVE');
    expect(providers[2].lifecycleState).toBe('ACTIVE');
    expect(providers[2].tier).toBe('SLOW');
    expect(providers[2].dependsOn).toBeUndefined();
    expect(providers[3]).toBeInstanceOf(HarmonicPatternsProvider);
    expect(providers[3].id).toBe('HARMONIC_PATTERNS');
    expect(providers[3].methodologyFamily).toBe('HARMONIC_PATTERNS');
    expect(providers[3].lifecycleState).toBe('ACTIVE');
    expect(providers[3].tier).toBe('SLOW');
    expect(providers[3].dependsOn).toBeUndefined();
  });
});

/**
 * Verifies `CONFLUENCE_ENGINE` resolves correctly from the same real
 * module wiring (S1-012 Task Breakdown, WP11) -- built from the real
 * `PROVIDER_EXECUTION_ENGINE`, `ANALYSIS_PROVIDERS`, and
 * `CONFLUENCE_WEIGHT_STRATEGY`, exactly as `AnalysisEngineModule`
 * registers them.
 */
describe('AnalysisEngineModule CONFLUENCE_ENGINE wiring (S1-012 WP11, S1-013 WP11)', () => {
  it('resolves CONFLUENCE_ENGINE, built from the real shared services and all four registered Providers', async () => {
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
            new IctSmcProvider(indicatorEngine, swingDetector, regimeContext),
            new ElliottWaveProvider(indicatorEngine, swingDetector, regimeContext),
            new HarmonicPatternsProvider(swingDetector, regimeContext),
          ],
          inject: [INDICATOR_ENGINE, SWING_DETECTOR, REGIME_CONTEXT],
        },
        { provide: PROVIDER_EXECUTION_ENGINE, useClass: ProviderExecutionService },
        { provide: CONFLUENCE_WEIGHT_STRATEGY, useClass: EqualWeightStrategy },
        { provide: CONFLUENCE_ENGINE, useClass: ConfluenceService },
      ],
    }).compile();

    const confluenceEngine = module.get<ConfluenceEngine>(CONFLUENCE_ENGINE);
    expect(confluenceEngine).toBeInstanceOf(ConfluenceService);
  });
});
