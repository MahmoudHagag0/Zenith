import { Injectable } from '@nestjs/common';
import type { MacroDataProvider, ProviderMacroSeriesValue } from './macro-data-provider.interface';

/**
 * Deterministic placeholder implementation (ADR-003 precedent) -- reports
 * no observation for any series, mirroring L1-006's
 * SimulatedCorporateActionsProvider rationale: macro-economic series are
 * precise, externally-verified official figures (Federal Funds Rate, CPI,
 * unemployment, GDP) with no meaningful simulated equivalent, unlike
 * quotes/news/COT, where a plausible-looking simulated value is useful for
 * UI development. Registered whenever MACRO_DATA_MODE is not "live" or the
 * required credential is unset.
 */
@Injectable()
export class SimulatedMacroDataProvider implements MacroDataProvider {
  readonly name = 'simulated';

  async getLatestSeriesValue(_seriesId: string): Promise<ProviderMacroSeriesValue | null> {
    return null;
  }
}
