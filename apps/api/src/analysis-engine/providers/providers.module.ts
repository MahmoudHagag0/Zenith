import { Module } from '@nestjs/common';
import { ObservabilityService } from '../common/observability.service';
import { ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE } from './analysis-provider.tokens';
import { ProviderExecutionService } from './provider-execution.service';

/**
 * The Analysis Provider Framework's registry and Execution Engine
 * (ADR-006). `ANALYSIS_PROVIDERS` is a NestJS multi-provider factory
 * exposing every registered `AnalysisProvider` as an array — empty in
 * production, since S1-008 registers no real methodology Provider
 * (Sprint Brief Non-Scope); the first is S1-009, added here as a
 * concrete class plus an `inject` entry on the factory below, never by
 * editing any Provider's own code. Uses its own `ObservabilityService`
 * instance, distinct from the one `AnalysisEngineModule` registers for
 * the Indicator Engine/Swing Detector/Regime Context — Provider
 * failure/timeout rate (this module) and computation rejection rate
 * (S1-007) are deliberately different metrics for different components.
 */
@Module({
  providers: [
    {
      provide: ANALYSIS_PROVIDERS,
      useFactory: () => [],
    },
    ObservabilityService,
    { provide: PROVIDER_EXECUTION_ENGINE, useClass: ProviderExecutionService },
  ],
  exports: [ANALYSIS_PROVIDERS, PROVIDER_EXECUTION_ENGINE],
})
export class ProvidersModule {}
