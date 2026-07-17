import { Injectable } from '@nestjs/common';
import type { MacroDataProvider, ProviderMacroSeriesValue } from './macro-data-provider.interface';
import { MarketDataHttpClient } from '../../market-data/providers/http-client';
import type { LiveDataMetricsRecorder } from '../../market-data/providers/live-data-metrics-recorder.interface';
import { fredObservationsResponseSchema } from './macro-data.schemas';
import { normalizeFredObservation } from './macro-data.normalize';

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

/**
 * Live Macro Context provider (L1-007, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 7). Implements the new MacroDataProvider interface in full.
 * FRED is the Blueprint's own sole-recommended source for this domain
 * (§3: "Macro Context (new) | FRED | — | Free, authoritative, no reason
 * to pay elsewhere") -- no dual-provider tension, mirroring L1-004's
 * CFTC-direct precedent. Reuses MarketDataHttpClient (L1-001) directly by
 * import, following the same precedent already applied in
 * L1-003/L1-004/L1-005/L1-006.
 */
@Injectable()
export class FredMacroDataProvider implements MacroDataProvider {
  readonly name = 'fred';
  private readonly client: MarketDataHttpClient;

  constructor(
    private readonly apiKey: string,
    metrics?: LiveDataMetricsRecorder,
  ) {
    this.client = new MarketDataHttpClient('fred', undefined, 'macro-data', metrics);
  }

  async getLatestSeriesValue(seriesId: string): Promise<ProviderMacroSeriesValue | null> {
    const url = `${BASE_URL}?series_id=${encodeURIComponent(seriesId)}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=1`;
    const raw = await this.client.fetchJson(url);
    const parsed = fredObservationsResponseSchema.parse(raw);
    const [latest] = parsed.observations;
    if (!latest) return null;
    return normalizeFredObservation(seriesId, latest);
  }
}
