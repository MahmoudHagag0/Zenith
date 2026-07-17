import { Injectable } from '@nestjs/common';
import type {
  InstrumentMetadataProvider,
  ProviderExchangeMetadata,
  ProviderInstrumentMetadata,
  ProviderSymbolSearchResult,
} from './instrument-metadata-provider.interface';

/**
 * Deterministic placeholder implementation (ADR-003 precedent) -- not a
 * source of real symbol search/metadata. Registered whenever
 * MARKET_DATA_MODE is not "live" or TWELVE_DATA_API_KEY is unset, exactly
 * mirroring SimulatedMarketDataProvider's own gating.
 */
@Injectable()
export class SimulatedInstrumentMetadataProvider implements InstrumentMetadataProvider {
  readonly name = 'simulated';

  async searchSymbols(query: string): Promise<ProviderSymbolSearchResult[]> {
    const symbol = query.trim().toUpperCase();
    if (!symbol) return [];
    return [{ symbol, name: `${symbol} (Simulated Corp)`, exchange: 'SIMULATED' }];
  }

  async getInstrumentMetadata(symbol: string): Promise<ProviderInstrumentMetadata> {
    const normalized = symbol.trim().toUpperCase();
    return { symbol: normalized, name: `${normalized} (Simulated Corp)`, exchange: 'SIMULATED', currency: 'USD', tickSize: 0.01, lotSize: 1 };
  }

  async getExchangeMetadata(exchangeCode: string): Promise<ProviderExchangeMetadata> {
    return { exchangeCode, name: `${exchangeCode} (Simulated Exchange)`, country: 'US', timezone: 'America/New_York' };
  }
}
