import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { MacroDataController } from './macro-data.controller';
import { MacroDataService } from './macro-data.service';
import { MacroDataSyncService } from './macro-data-sync.service';
import { MACRO_DATA_PROVIDER } from './providers/macro-data-provider.interface';
import { createMacroDataProvider } from './providers/macro-data-provider.factory';

const moduleLogger = new Logger('MacroDataModule');

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [MacroDataController],
  providers: [
    MacroDataService,
    MacroDataSyncService,
    // First real provider as of L1-007 (28_LIVE_DATA_BLUEPRINT.md §9 Phase
    // 7, ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind MACRO_DATA_MODE
    // so an environment without FRED_API_KEY set falls back to
    // SimulatedMacroDataProvider.
    {
      provide: MACRO_DATA_PROVIDER,
      useFactory: () => createMacroDataProvider(process.env.MACRO_DATA_MODE, process.env.FRED_API_KEY, moduleLogger),
    },
  ],
  exports: [MacroDataService],
})
export class MacroDataModule {}
