import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@zenith/database';
import { PrismaService } from '../database/prisma.service';
import { MACRO_DATA_PROVIDER, type MacroDataProvider } from './providers/macro-data-provider.interface';
import { TRACKED_MACRO_SERIES } from './tracked-macro-series';

const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Macro Context caching layer (L1-007, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 7). Mirrors CorporateActionsService's shape, adapted for a
 * domain with no Asset relation at all -- Macro Context series are
 * global economic time series, not scoped to any tracked instrument.
 * Per Architecture Team Scope Option A (2026-07-17): this service only
 * ever reads/writes the independent `MacroSeriesValue` table; no
 * consumer (NarrativeComposerService, WorkspaceService) is touched.
 */
@Injectable()
export class MacroDataService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MACRO_DATA_PROVIDER) private readonly provider: MacroDataProvider,
  ) {}

  /** Latest stored observation per tracked series. */
  async getLatestValues() {
    const values = await Promise.all(
      TRACKED_MACRO_SERIES.map((seriesId) =>
        this.prisma.macroSeriesValue.findFirst({ where: { seriesId }, orderBy: { observationDate: 'desc' } }),
      ),
    );
    return values.filter((value): value is NonNullable<typeof value> => value !== null);
  }

  /** Used by MacroDataSyncService -- populates the cache for one tracked series. */
  async syncSeries(seriesId: string): Promise<void> {
    const latest = await this.prisma.macroSeriesValue.findFirst({ where: { seriesId }, orderBy: { retrievedAt: 'desc' } });
    if (latest && Date.now() - latest.retrievedAt.getTime() < REFRESH_WINDOW_MS) return;

    const observation = await this.provider.getLatestSeriesValue(seriesId);
    if (!observation) return;

    await this.prisma.macroSeriesValue.upsert({
      where: { seriesId_observationDate: { seriesId, observationDate: observation.observationDate } },
      create: {
        seriesId,
        observationDate: observation.observationDate,
        value: observation.value,
        provider: this.provider.name,
        rawPayload: observation.raw as Prisma.InputJsonValue,
      },
      update: {
        value: observation.value,
        provider: this.provider.name,
        rawPayload: observation.raw as Prisma.InputJsonValue,
      },
    });
  }
}
