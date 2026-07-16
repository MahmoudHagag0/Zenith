import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { CreateAlertInput } from '@zenith/validation';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { InstrumentReadingService } from '../dashboard/instrument-reading.service';
import { MarketDataService } from '../market-data/market-data.service';
import { isRecordNotFoundError } from '../common/prisma-errors';

const NOT_FOUND_MESSAGE = 'Alert not found';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    private readonly instrumentReadingService: InstrumentReadingService,
    private readonly marketDataService: MarketDataService,
  ) {}

  findAll(userId: string) {
    return this.prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, input: CreateAlertInput) {
    await this.assetsService.findOne(input.assetId);
    return this.prisma.alert.create({
      data: {
        userId,
        assetId: input.assetId,
        conditionType: input.conditionType,
        targetPrice: input.targetPrice,
      },
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    const alert = await this.findOwned(userId, id);
    try {
      await this.prisma.alert.delete({ where: { id: alert.id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException(NOT_FOUND_MESSAGE);
      }
      throw error;
    }
  }

  private async findOwned(userId: string, id: string) {
    const alert = await this.prisma.alert.findUnique({ where: { id } });
    // An alert that exists but belongs to another user is reported as 404, not
    // 403, matching the WatchlistsService/JournalService convention.
    if (!alert || alert.userId !== userId) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    return alert;
  }

  /**
   * Evaluates every ACTIVE alert, grouped by asset so a shared instrument
   * reading/quote is fetched at most once per asset regardless of how many
   * alerts (across however many users) reference it. Direction conditions
   * reuse the existing Confluence Engine reading (InstrumentReadingService,
   * S1-019); price conditions reuse the existing cached MarketQuote
   * (MarketDataService, S1-005) -- no new signal source is computed here.
   */
  async evaluateActiveAlerts(): Promise<{ evaluated: number; triggered: number }> {
    const activeAlerts = await this.prisma.alert.findMany({ where: { status: 'ACTIVE' } });
    let triggered = 0;

    const alertsByAsset = new Map<string, typeof activeAlerts>();
    for (const alert of activeAlerts) {
      const group = alertsByAsset.get(alert.assetId) ?? [];
      group.push(alert);
      alertsByAsset.set(alert.assetId, group);
    }

    for (const [assetId, alerts] of alertsByAsset) {
      const needsDirection = alerts.some((a) => a.conditionType === 'DIRECTION_BULLISH' || a.conditionType === 'DIRECTION_BEARISH');
      const needsPrice = alerts.some((a) => a.conditionType === 'PRICE_ABOVE' || a.conditionType === 'PRICE_BELOW');

      let netDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | undefined;
      let currentPrice: number | undefined;

      try {
        if (needsDirection) {
          const reading = await this.instrumentReadingService.getInstrumentReading(assetId);
          netDirection = reading.netDirection;
        }
        if (needsPrice) {
          const quote = await this.marketDataService.getQuote(assetId);
          currentPrice = Number(quote.price);
        }
      } catch (error) {
        this.logger.warn(`Alert evaluation failed for asset ${assetId}: ${(error as Error).message}`);
        continue;
      }

      for (const alert of alerts) {
        const outcome = this.evaluateCondition(alert.conditionType, alert.targetPrice ? Number(alert.targetPrice) : undefined, netDirection, currentPrice);
        if (!outcome) continue;
        await this.prisma.alert.update({
          where: { id: alert.id },
          data: { status: 'TRIGGERED', triggeredAt: new Date(), triggeredNote: outcome },
        });
        triggered += 1;
      }
    }

    return { evaluated: activeAlerts.length, triggered };
  }

  private evaluateCondition(
    conditionType: string,
    targetPrice: number | undefined,
    netDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | undefined,
    currentPrice: number | undefined,
  ): string | undefined {
    if (conditionType === 'DIRECTION_BULLISH' && netDirection === 'BULLISH') {
      return 'Confluence reading turned BULLISH.';
    }
    if (conditionType === 'DIRECTION_BEARISH' && netDirection === 'BEARISH') {
      return 'Confluence reading turned BEARISH.';
    }
    if (conditionType === 'PRICE_ABOVE' && targetPrice !== undefined && currentPrice !== undefined && currentPrice > targetPrice) {
      return `Price ${currentPrice} rose above ${targetPrice}.`;
    }
    if (conditionType === 'PRICE_BELOW' && targetPrice !== undefined && currentPrice !== undefined && currentPrice < targetPrice) {
      return `Price ${currentPrice} fell below ${targetPrice}.`;
    }
    return undefined;
  }
}
