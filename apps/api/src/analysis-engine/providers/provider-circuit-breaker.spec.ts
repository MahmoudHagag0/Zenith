import { ProviderCircuitBreaker } from './provider-circuit-breaker';

describe('ProviderCircuitBreaker (WP6)', () => {
  it('stays closed below the failure threshold', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    breaker.recordFailure('p1');
    breaker.recordFailure('p1');
    expect(breaker.isOpen('p1')).toBe(false);
  });

  it('opens once consecutive failures reach the threshold', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    breaker.recordFailure('p1');
    breaker.recordFailure('p1');
    breaker.recordFailure('p1');
    expect(breaker.isOpen('p1')).toBe(true);
  });

  it('excludes the Provider until the reset timeout elapses, then allows a probe', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    const t0 = 10_000;
    breaker.recordFailure('p1', t0);
    expect(breaker.isOpen('p1', t0 + 500)).toBe(true);
    expect(breaker.isOpen('p1', t0 + 1500)).toBe(false);
  });

  it('closes the circuit on a successful probe and resets the failure count', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    breaker.recordFailure('p1', 0);
    breaker.recordSuccess('p1');
    expect(breaker.isOpen('p1', 0)).toBe(false);
    expect(breaker.getState('p1').consecutiveFailures).toBe(0);
  });

  it('reopens the circuit if the probe attempt fails again', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    breaker.recordFailure('p1', 0);
    expect(breaker.isOpen('p1', 1500)).toBe(false);
    breaker.recordFailure('p1', 1500);
    expect(breaker.isOpen('p1', 1600)).toBe(true);
  });

  it('tracks independent state per Provider id', () => {
    const breaker = new ProviderCircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
    breaker.recordFailure('p1', 0);
    expect(breaker.isOpen('p1', 0)).toBe(true);
    expect(breaker.isOpen('p2', 0)).toBe(false);
  });
});
