import type { InstrumentMetadataProvider } from './instrument-metadata-provider.interface';
import { SimulatedInstrumentMetadataProvider } from './simulated-instrument-metadata.provider';
import { TwelveDataInstrumentMetadataProvider } from './twelve-data-instrument-metadata.provider';

export interface InstrumentMetadataProviderFactoryLogger {
  warn(message: string): void;
}

/**
 * Selects which InstrumentMetadataProvider implementation is bound at the
 * INSTRUMENT_METADATA_PROVIDER token (28_LIVE_DATA_BLUEPRINT.md §9 Phase
 * 5), mirroring L1-001's `createMarketDataProvider()` exactly. Reuses the
 * SAME `MARKET_DATA_MODE`/`TWELVE_DATA_API_KEY` flags as
 * `createMarketDataProvider()` rather than introducing a new mode flag --
 * per Architecture Team decision, this domain uses Twelve Data only, the
 * same vendor relationship already gated by that flag.
 */
export function createInstrumentMetadataProvider(
  apiKey: string | undefined,
  mode: string | undefined,
  logger: InstrumentMetadataProviderFactoryLogger,
): InstrumentMetadataProvider {
  if (mode === 'live') {
    if (apiKey) {
      return new TwelveDataInstrumentMetadataProvider(apiKey);
    }
    logger.warn('MARKET_DATA_MODE=live but TWELVE_DATA_API_KEY is not set — falling back to SimulatedInstrumentMetadataProvider');
  }
  return new SimulatedInstrumentMetadataProvider();
}
