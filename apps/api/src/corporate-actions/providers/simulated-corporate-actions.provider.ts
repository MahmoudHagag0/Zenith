import { Injectable } from '@nestjs/common';
import type { CorporateActionsProvider, ProviderDividendEvent, ProviderSplitEvent } from './corporate-actions-provider.interface';

/**
 * Deterministic placeholder implementation (ADR-003 precedent) -- reports
 * no corporate actions for any symbol, since splits/dividends are rare,
 * discrete, real-world events with no meaningful simulated equivalent
 * (unlike quotes/news/COT, where a plausible-looking simulated value is
 * useful for UI development). Registered whenever CORPORATE_ACTIONS_MODE
 * is not "live" or the required credential is unset.
 */
@Injectable()
export class SimulatedCorporateActionsProvider implements CorporateActionsProvider {
  readonly name = 'simulated';

  async getSplits(_symbol: string): Promise<ProviderSplitEvent[]> {
    return [];
  }

  async getDividends(_symbol: string): Promise<ProviderDividendEvent[]> {
    return [];
  }
}
