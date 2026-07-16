import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { CotController } from './cot.controller';
import { CotService } from './cot.service';
import { CotSyncService } from './cot-sync.service';
import { COT_PROVIDER } from './providers/cot-provider.interface';
import { SimulatedCotProvider } from './providers/simulated-cot.provider';

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, MarketDataModule],
  controllers: [CotController],
  providers: [
    CotService,
    CotSyncService,
    // Only registered implementation as of S1-032 (mirroring ADR-003) --
    // simulated, not a real CFTC feed. A future real provider requires
    // only a new class and a change to this one registration.
    { provide: COT_PROVIDER, useClass: SimulatedCotProvider },
  ],
  exports: [CotService],
})
export class CotModule {}
