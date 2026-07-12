import { buildComputationMetadata } from './computation-metadata.util';

describe('buildComputationMetadata', () => {
  it('includes computationVersion distinct from any contract-level version, and the full parameter set', () => {
    const points = [{ timestamp: new Date('2026-01-01T00:00:00.000Z') }, { timestamp: new Date('2026-01-03T00:00:00.000Z') }];
    const metadata = buildComputationMetadata({
      computation: 'SMA',
      parameters: { period: 5 },
      formula: 'Simple Moving Average',
      source: 'Generic technical analysis convention',
      points,
      computationVersion: '1.0.0',
    });

    expect(metadata.computation).toBe('SMA');
    expect(metadata.parameters).toEqual({ period: 5 });
    expect(metadata.computationVersion).toBe('1.0.0');
    expect(metadata.inputRange).toEqual({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-03T00:00:00.000Z',
      pointCount: 2,
    });
    expect(typeof metadata.computedAt).toBe('string');
    expect(metadata.intermediateValues).toBeUndefined();
  });

  it('handles an empty input range gracefully', () => {
    const metadata = buildComputationMetadata({
      computation: 'RSI',
      parameters: { period: 14 },
      formula: 'Wilder RSI',
      source: 'Wilder, 1978',
      points: [],
      computationVersion: '1.0.0',
    });
    expect(metadata.inputRange).toEqual({ from: null, to: null, pointCount: 0 });
  });

  it('includes intermediateValues only when provided', () => {
    const points = [{ timestamp: new Date('2026-01-01T00:00:00.000Z') }];
    const metadata = buildComputationMetadata({
      computation: 'RSI',
      parameters: { period: 14 },
      formula: 'Wilder RSI',
      source: 'Wilder, 1978',
      points,
      computationVersion: '1.0.0',
      intermediateValues: { avgGain: 1.5, avgLoss: 0.5 },
    });
    expect(metadata.intermediateValues).toEqual({ avgGain: 1.5, avgLoss: 0.5 });
  });

  it('does not mutate the caller-supplied parameters/intermediateValues objects (defensive copy)', () => {
    const parameters = { period: 5 };
    const intermediateValues = { seed: 1 };
    const metadata = buildComputationMetadata({
      computation: 'SMA',
      parameters,
      formula: 'SMA',
      source: 'n/a',
      points: [],
      computationVersion: '1.0.0',
      intermediateValues,
    });
    expect(metadata.parameters).not.toBe(parameters);
    expect(metadata.intermediateValues).not.toBe(intermediateValues);
  });
});
