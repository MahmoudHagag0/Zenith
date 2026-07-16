import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsSyncService } from './alerts-sync.service';

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, DashboardModule, MarketDataModule],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsSyncService],
  exports: [AlertsService],
})
export class AlertsModule {}
