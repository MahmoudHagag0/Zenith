import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { CorporateActionsController } from './corporate-actions.controller';
import { CorporateActionsService } from './corporate-actions.service';
import { CorporateActionsSyncService } from './corporate-actions-sync.service';
import { CORPORATE_ACTIONS_PROVIDER } from './providers/corporate-actions-provider.interface';
import { createCorporateActionsProvider } from './providers/corporate-actions-provider.factory';

const moduleLogger = new Logger('CorporateActionsModule');

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, MarketDataModule],
  controllers: [CorporateActionsController],
  providers: [
    CorporateActionsService,
    CorporateActionsSyncService,
    // First real provider as of L1-006 (28_LIVE_DATA_BLUEPRINT.md §9 Phase
    // 6, ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind
    // CORPORATE_ACTIONS_MODE so an environment without FINNHUB_API_KEY set
    // falls back to SimulatedCorporateActionsProvider.
    {
      provide: CORPORATE_ACTIONS_PROVIDER,
      useFactory: () =>
        createCorporateActionsProvider(process.env.CORPORATE_ACTIONS_MODE, process.env.FINNHUB_API_KEY, moduleLogger),
    },
  ],
  exports: [CorporateActionsService],
})
export class CorporateActionsModule {}
