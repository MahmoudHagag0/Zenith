import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertsService } from './alerts.service';

/**
 * Periodically evaluates every ACTIVE alert, mirroring the existing
 * MarketDataSyncService Cron pattern (S1-005). Runs slightly less often
 * than the quote sync since it depends on the quote/instrument-reading
 * caches that sync already keeps warm.
 */
@Injectable()
export class AlertsSyncService {
  private readonly logger = new Logger(AlertsSyncService.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async evaluateAlerts(): Promise<void> {
    const { evaluated, triggered } = await this.alertsService.evaluateActiveAlerts();
    this.logger.log(`Alert evaluation finished: ${evaluated} active, ${triggered} triggered`);
  }
}
