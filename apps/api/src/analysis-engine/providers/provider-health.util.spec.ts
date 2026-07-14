import { ProviderHealthTracker } from './provider-health.util';

describe('ProviderHealthTracker (WP8)', () => {
  it('reports UP with zero samples and no attempts recorded yet', () => {
    const tracker = new ProviderHealthTracker();
    const signal = tracker.getSignal('p1', false);
    expect(signal).toEqual({ status: 'UP', participationRate: 0, averageConfidence: null, failureRate: 0, sampleSize: 0 });
  });

  it('computes participation/failure rate from recorded attempts', () => {
    const tracker = new ProviderHealthTracker();
    tracker.recordAttempt('p1', true, 80);
    tracker.recordAttempt('p1', true, 60);
    tracker.recordAttempt('p1', false);
    const signal = tracker.getSignal('p1', false);
    expect(signal.participationRate).toBeCloseTo(2 / 3, 9);
    expect(signal.failureRate).toBeCloseTo(1 / 3, 9);
    expect(signal.averageConfidence).toBeCloseTo(70, 9);
    expect(signal.sampleSize).toBe(3);
  });

  it('reflects an externally-supplied circuitOpen flag as DOWN regardless of recent success', () => {
    const tracker = new ProviderHealthTracker();
    tracker.recordAttempt('p1', true, 90);
    expect(tracker.getSignal('p1', true).status).toBe('DOWN');
    expect(tracker.getSignal('p1', false).status).toBe('UP');
  });

  it('bounds the rolling window to the configured size, dropping the oldest entries', () => {
    const tracker = new ProviderHealthTracker(2);
    tracker.recordAttempt('p1', false);
    tracker.recordAttempt('p1', true, 100);
    tracker.recordAttempt('p1', true, 100);
    const signal = tracker.getSignal('p1', false);
    expect(signal.sampleSize).toBe(2);
    expect(signal.participationRate).toBe(1);
  });

  it('tracks independent windows per Provider id', () => {
    const tracker = new ProviderHealthTracker();
    tracker.recordAttempt('p1', false);
    tracker.recordAttempt('p2', true, 100);
    expect(tracker.getSignal('p1', false).participationRate).toBe(0);
    expect(tracker.getSignal('p2', false).participationRate).toBe(1);
  });
});
