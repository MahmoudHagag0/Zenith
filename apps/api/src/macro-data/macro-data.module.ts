import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { MacroDataController } from './macro-data.controller';
import { MacroDataService } from './macro-data.service';
import { MacroDataSyncService } from './macro-data-sync.service';
import { MACRO_DATA_PROVIDER } from './providers/macro-data-provider.interface';
import { createMacroDataProvider } from './providers/macro-data-provider.factory';

const moduleLogger = new Logger('MacroDataModule');

@Module({
  imports: [DatabaseModule, AuthModule, MonitoringModule],
  controllers: [MacroDataController],
  providers: [
    MacroDataService,
    MacroDataSyncService,
    // First real provider as of L1-007 (28_LIVE_DATA_BLUEPRINT.md §9 Phase
    // 7, ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind MACRO_DATA_MODE
    // so an environment without FRED_API_KEY set falls back to
    // SimulatedMacroDataProvider. As of L1-008, LiveDataObservabilityService
    // is threaded through for passive provider-health/metrics recording.
    {
      provide: MACRO_DATA_PROVIDER,
      useFactory: (liveDataObservabilityService: LiveDataObservabilityService) =>
        createMacroDataProvider(process.env.MACRO_DATA_MODE, process.env.FRED_API_KEY, moduleLogger, liveDataObservabilityService),
      inject: [LiveDataObservabilityService],
    },
  ],
  exports: [MacroDataService],
})
export class MacroDataModule {}
