import type { MacroDataProvider } from './macro-data-provider.interface';
import { SimulatedMacroDataProvider } from './simulated-macro-data.provider';
import { FredMacroDataProvider } from './fred-macro-data.provider';

export interface MacroDataProviderFactoryLogger {
  warn(message: string): void;
}

/**
 * Selects which MacroDataProvider implementation is bound at the
 * MACRO_DATA_PROVIDER token (28_LIVE_DATA_BLUEPRINT.md §9 Phase 7),
 * mirroring every prior L1 Sprint's factory pattern: a plain,
 * directly-testable function so the fallback logic can be unit tested
 * without booting Nest's DI container. FRED_API_KEY is required for live
 * mode; a missing key falls back to Simulated with a logged warning
 * rather than attempting a keyless real API call.
 */
export function createMacroDataProvider(
  mode: string | undefined,
  fredApiKey: string | undefined,
  logger: MacroDataProviderFactoryLogger,
): MacroDataProvider {
  if (mode === 'live') {
    if (fredApiKey) {
      return new FredMacroDataProvider(fredApiKey);
    }
    logger.warn('MACRO_DATA_MODE=live but FRED_API_KEY is not set — falling back to SimulatedMacroDataProvider');
  }
  return new SimulatedMacroDataProvider();
}
