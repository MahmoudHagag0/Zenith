import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@zenith/database';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import {
  CORPORATE_ACTIONS_PROVIDER,
  type CorporateActionsProvider,
} from './providers/corporate-actions-provider.interface';

const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Corporate Actions caching layer (L1-006, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 6). Mirrors CotService's shape, but scoped ONLY to the
 * independent `CorporateAction` table -- per Architecture Team Decision 1
 * (2026-07-16), this service must never read or write `Candle`,
 * `Position`, or `Transaction`. It records raw split/dividend events only;
 * no adjustment, no recalculation, no portfolio cash logic of any kind
 * belongs here (Decision 2).
 *
 * Idempotency (Architecture Team requirement): persistence uses
 * `upsert()` against the real `(assetId, type, effectiveDate)` unique
 * key, so re-processing the same split or dividend never creates a
 * duplicate row or alters a previously-stored result.
 */
@Injectable()
export class CorporateActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    @Inject(CORPORATE_ACTIONS_PROVIDER) private readonly provider: CorporateActionsProvider,
  ) {}

  async getActionsForAsset(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    await this.ensureCached(asset.id, asset.symbol);
    return this.prisma.corporateAction.findMany({
      where: { assetId },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /** Used by CorporateActionsSyncService -- populates the cache for one already-resolved asset. */
  async syncAsset(assetId: string, symbol: string): Promise<void> {
    await this.ensureCached(assetId, symbol);
  }

  private async ensureCached(assetId: string, symbol: string): Promise<void> {
    const latest = await this.prisma.corporateAction.findFirst({
      where: { assetId },
      orderBy: { retrievedAt: 'desc' },
    });
    if (latest && Date.now() - latest.retrievedAt.getTime() < REFRESH_WINDOW_MS) return;

    const [splits, dividends] = await Promise.all([this.provider.getSplits(symbol), this.provider.getDividends(symbol)]);

    await Promise.all([
      ...splits.map((event) =>
        this.prisma.corporateAction.upsert({
          where: { assetId_type_effectiveDate: { assetId, type: 'SPLIT', effectiveDate: event.effectiveDate } },
          create: {
            assetId,
            type: 'SPLIT',
            effectiveDate: event.effectiveDate,
            ratio: event.ratio,
            provider: this.provider.name,
            providerEventId: event.providerEventId,
            rawPayload: event.raw as Prisma.InputJsonValue,
          },
          update: {
            ratio: event.ratio,
            provider: this.provider.name,
            providerEventId: event.providerEventId,
            rawPayload: event.raw as Prisma.InputJsonValue,
          },
        }),
      ),
      ...dividends.map((event) =>
        this.prisma.corporateAction.upsert({
          where: { assetId_type_effectiveDate: { assetId, type: 'DIVIDEND', effectiveDate: event.effectiveDate } },
          create: {
            assetId,
            type: 'DIVIDEND',
            effectiveDate: event.effectiveDate,
            amount: event.amount,
            currency: event.currency,
            provider: this.provider.name,
            providerEventId: event.providerEventId,
            rawPayload: event.raw as Prisma.InputJsonValue,
          },
          update: {
            amount: event.amount,
            currency: event.currency,
            provider: this.provider.name,
            providerEventId: event.providerEventId,
            rawPayload: event.raw as Prisma.InputJsonValue,
          },
        }),
      ),
    ]);
  }
}
