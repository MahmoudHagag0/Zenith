import { createMacroDataProvider } from './macro-data-provider.factory';
import { SimulatedMacroDataProvider } from './simulated-macro-data.provider';
import { FredMacroDataProvider } from './fred-macro-data.provider';

describe('createMacroDataProvider', () => {
  const logger = { warn: jest.fn() };

  beforeEach(() => {
    logger.warn.mockClear();
  });

  it('returns SimulatedMacroDataProvider when mode is undefined', () => {
    const provider = createMacroDataProvider(undefined, undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedMacroDataProvider);
  });

  it('returns SimulatedMacroDataProvider when mode is "simulated"', () => {
    const provider = createMacroDataProvider('simulated', 'test-key', logger);
    expect(provider).toBeInstanceOf(SimulatedMacroDataProvider);
  });

  it('returns FredMacroDataProvider when mode is "live" and FRED_API_KEY is set', () => {
    const provider = createMacroDataProvider('live', 'test-key', logger);
    expect(provider).toBeInstanceOf(FredMacroDataProvider);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to SimulatedMacroDataProvider and logs a warning when mode is "live" but FRED_API_KEY is missing', () => {
    const provider = createMacroDataProvider('live', undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedMacroDataProvider);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('FRED_API_KEY'));
  });
});
