import type { CorporateActionsProvider } from './corporate-actions-provider.interface';
import { SimulatedCorporateActionsProvider } from './simulated-corporate-actions.provider';
import { FinnhubCorporateActionsProvider } from './finnhub-corporate-actions.provider';

export interface CorporateActionsProviderFactoryLogger {
  warn(message: string): void;
}

/**
 * Selects which CorporateActionsProvider implementation is bound at the
 * CORPORATE_ACTIONS_PROVIDER token (28_LIVE_DATA_BLUEPRINT.md §9 Phase 6),
 * mirroring `createCalendarNewsProvider()`/`createCotProvider()` exactly.
 * Per Architecture Team decision (2026-07-16), Finnhub is the sole
 * provider for this domain -- FINNHUB_API_KEY is reused as-is from L1-003
 * rather than introducing a duplicate credential.
 */
export function createCorporateActionsProvider(
  mode: string | undefined,
  finnhubApiKey: string | undefined,
  logger: CorporateActionsProviderFactoryLogger,
): CorporateActionsProvider {
  if (mode === 'live') {
    if (finnhubApiKey) {
      return new FinnhubCorporateActionsProvider(finnhubApiKey);
    }
    logger.warn('CORPORATE_ACTIONS_MODE=live but FINNHUB_API_KEY is not set — falling back to SimulatedCorporateActionsProvider');
  }
  return new SimulatedCorporateActionsProvider();
}
