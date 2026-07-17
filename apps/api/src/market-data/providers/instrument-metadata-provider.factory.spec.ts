import { createInstrumentMetadataProvider } from './instrument-metadata-provider.factory';
import { SimulatedInstrumentMetadataProvider } from './simulated-instrument-metadata.provider';
import { TwelveDataInstrumentMetadataProvider } from './twelve-data-instrument-metadata.provider';

describe('createInstrumentMetadataProvider', () => {
  const logger = { warn: jest.fn() };

  beforeEach(() => {
    logger.warn.mockClear();
  });

  it('returns SimulatedInstrumentMetadataProvider when mode is undefined', () => {
    const provider = createInstrumentMetadataProvider(undefined, undefined, logger);
    expect(provider).toBeInstanceOf(SimulatedInstrumentMetadataProvider);
  });

  it('returns SimulatedInstrumentMetadataProvider when mode is "simulated"', () => {
    const provider = createInstrumentMetadataProvider('some-key', 'simulated', logger);
    expect(provider).toBeInstanceOf(SimulatedInstrumentMetadataProvider);
  });

  it('returns TwelveDataInstrumentMetadataProvider when mode is "live" and an API key is configured', () => {
    const provider = createInstrumentMetadataProvider('real-key', 'live', logger);
    expect(provider).toBeInstanceOf(TwelveDataInstrumentMetadataProvider);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to SimulatedInstrumentMetadataProvider and logs a warning when mode is "live" but no API key is configured', () => {
    const provider = createInstrumentMetadataProvider(undefined, 'live', logger);

    expect(provider).toBeInstanceOf(SimulatedInstrumentMetadataProvider);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('falling back to SimulatedInstrumentMetadataProvider'));
  });
});
