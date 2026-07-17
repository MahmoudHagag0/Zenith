import type { CotProvider } from './cot-provider.interface';
import { SimulatedCotProvider } from './simulated-cot.provider';
import { LiveCotProvider } from './live-cot.provider';

/**
 * Selects which CotProvider implementation is bound at the COT_PROVIDER
 * token (28_LIVE_DATA_BLUEPRINT.md §9 Phase 4), mirroring L1-001's
 * `createMarketDataProvider()`: a plain, directly-testable function so the
 * fallback logic can be unit tested without booting Nest's DI container.
 * Unlike L1-001/L1-003, no credential is strictly required -- CFTC's
 * public reporting data needs no API key -- so COT_MODE alone (not a
 * missing-key check) gates the live/simulated choice; an optional
 * app token (Socrata's higher-rate-limit token) is passed through if set.
 */
export function createCotProvider(mode: string | undefined, appToken: string | undefined): CotProvider {
  if (mode === 'live') {
    return new LiveCotProvider(appToken);
  }
  return new SimulatedCotProvider();
}
