import { createCorporateActionsProvider } from './corporate-actions-provider.factory';
import { SimulatedCorporateActionsProvider } from './simulated-corporate-actions.provider';
import { FinnhubCorporateActionsProvider } from './finnhub-corporate-actions.provider';

describe('createCorporateActionsProvider', () => {
  const logger = { warn: jest.fn() };

  beforeEach(() => {
    logger.warn.mockClear();
  });

  it('returns SimulatedCorporateActionsProvider when mode is undefined', () => {
    const provider = createCorporateActionsProvider(undefined, undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedCorporateActionsProvider);
  });

  it('returns SimulatedCorporateActionsProvider when mode is "simulated"', () => {
    const provider = createCorporateActionsProvider('simulated', 'test-key', logger);
    expect(provider).toBeInstanceOf(SimulatedCorporateActionsProvider);
  });

  it('returns FinnhubCorporateActionsProvider when mode is "live" and FINNHUB_API_KEY is set', () => {
    const provider = createCorporateActionsProvider('live', 'test-key', logger);
    expect(provider).toBeInstanceOf(FinnhubCorporateActionsProvider);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to SimulatedCorporateActionsProvider and logs a warning when mode is "live" but FINNHUB_API_KEY is missing', () => {
    const provider = createCorporateActionsProvider('live', undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedCorporateActionsProvider);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('FINNHUB_API_KEY'));
  });
});
