import { createCotProvider } from './cot-provider.factory';
import { SimulatedCotProvider } from './simulated-cot.provider';
import { LiveCotProvider } from './live-cot.provider';

describe('createCotProvider', () => {
  it('returns SimulatedCotProvider when mode is undefined', () => {
    const provider = createCotProvider(undefined, undefined);
    expect(provider).toBeInstanceOf(SimulatedCotProvider);
  });

  it('returns SimulatedCotProvider when mode is "simulated"', () => {
    const provider = createCotProvider('simulated', undefined);
    expect(provider).toBeInstanceOf(SimulatedCotProvider);
  });

  it('returns LiveCotProvider when mode is "live", with no credential required', () => {
    const provider = createCotProvider('live', undefined);
    expect(provider).toBeInstanceOf(LiveCotProvider);
  });

  it('returns LiveCotProvider when mode is "live" and an app token is configured', () => {
    const provider = createCotProvider('live', 'test-app-token');
    expect(provider).toBeInstanceOf(LiveCotProvider);
  });
});
