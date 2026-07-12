import { Module } from '@nestjs/common';
import { ANALYSIS_PROVIDERS } from './analysis-provider.tokens';

/**
 * The Analysis Provider Framework's registry (ADR-006): a NestJS
 * multi-provider factory exposing every registered `AnalysisProvider` as
 * an array under `ANALYSIS_PROVIDERS`. Empty in production — S1-008
 * registers no real methodology Provider (Sprint Brief Non-Scope); the
 * first is S1-009, added here as a concrete class plus an `inject` entry
 * on the factory below, never by editing any Provider's own code.
 */
@Module({
  providers: [
    {
      provide: ANALYSIS_PROVIDERS,
      useFactory: () => [],
    },
  ],
  exports: [ANALYSIS_PROVIDERS],
})
export class ProvidersModule {}
