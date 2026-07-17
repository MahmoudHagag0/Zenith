import { LiveDataObservabilityService } from './live-data-observability.service';

describe('LiveDataObservabilityService', () => {
  let service: LiveDataObservabilityService;

  beforeEach(() => {
    service = new LiveDataObservabilityService();
  });

  describe('getProviderSnapshots', () => {
    it('reports UNKNOWN status for a provider with no recorded calls yet', () => {
      service.recordCircuitState('fred', 'macro-data', false);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.status).toBe('UNKNOWN');
      expect(snapshot.successCount).toBe(0);
      expect(snapshot.failureCount).toBe(0);
    });

    it('reports UP status when the most recent event was a success', () => {
      service.recordSuccess('fred', 'macro-data', 100);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.status).toBe('UP');
      expect(snapshot.lastSuccessAt).not.toBeNull();
    });

    it('reports DEGRADED status when the most recent event was a failure (but circuit is not open)', () => {
      service.recordSuccess('fred', 'macro-data', 100);
      service.recordFailure('fred', 'macro-data', 50, false);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.status).toBe('DEGRADED');
    });

    it('reports DOWN status whenever the circuit is open, regardless of recent successes', () => {
      service.recordSuccess('fred', 'macro-data', 100);
      service.recordCircuitState('fred', 'macro-data', true);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.status).toBe('DOWN');
    });

    it('computes averageLatencyMs across both successes and failures', () => {
      service.recordSuccess('fred', 'macro-data', 100);
      service.recordFailure('fred', 'macro-data', 300, false);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.averageLatencyMs).toBe(200);
    });

    it('accumulates retryCount and rateLimitEvents independently of success/failure counts', () => {
      service.recordRetry('fred', 'macro-data');
      service.recordRetry('fred', 'macro-data');
      service.recordFailure('fred', 'macro-data', 50, true);

      const [snapshot] = service.getProviderSnapshots();

      expect(snapshot.retryCount).toBe(2);
      expect(snapshot.rateLimitEvents).toBe(1);
    });
  });

  describe('getSyncSnapshots', () => {
    it('records the last sync result per domain', () => {
      service.recordSync('cot', 5, 1);

      const [snapshot] = service.getSyncSnapshots();

      expect(snapshot).toEqual(expect.objectContaining({ domain: 'cot', lastSyncSucceeded: 5, lastSyncFailed: 1 }));
      expect(snapshot.lastSyncAt).not.toBeNull();
    });

    it('overwrites the previous result on a subsequent sync (only the last run is kept)', () => {
      service.recordSync('cot', 5, 1);
      service.recordSync('cot', 3, 0);

      const snapshots = service.getSyncSnapshots();

      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toEqual(expect.objectContaining({ lastSyncSucceeded: 3, lastSyncFailed: 0 }));
    });
  });

  describe('getAlerts (documented thresholds, Architecture Team Decision 1)', () => {
    it('raises a CRITICAL alert when a provider circuit is open', () => {
      service.recordCircuitState('fred', 'macro-data', true);

      const alerts = service.getAlerts();

      expect(alerts).toEqual([{ providerId: 'fred', domain: 'macro-data', severity: 'CRITICAL', reason: 'Circuit breaker is open' }]);
    });

    it('raises a WARN alert when failure rate is >= 50% over at least 5 calls', () => {
      for (let i = 0; i < 3; i += 1) service.recordSuccess('fred', 'macro-data', 10);
      for (let i = 0; i < 3; i += 1) service.recordFailure('fred', 'macro-data', 10, false);

      const alerts = service.getAlerts();

      expect(alerts).toContainEqual(expect.objectContaining({ providerId: 'fred', severity: 'WARN', reason: expect.stringContaining('High error rate') }));
    });

    it('does not raise a high-error-rate alert below the minimum sample size, even at 100% failure', () => {
      service.recordFailure('fred', 'macro-data', 10, false);
      service.recordFailure('fred', 'macro-data', 10, false);

      const alerts = service.getAlerts();

      expect(alerts.filter((a) => a.reason.includes('High error rate'))).toHaveLength(0);
    });

    it('raises a WARN alert for any recorded rate-limit event', () => {
      service.recordSuccess('fred', 'macro-data', 10);
      service.recordFailure('fred', 'macro-data', 10, true);

      const alerts = service.getAlerts();

      expect(alerts).toContainEqual(expect.objectContaining({ providerId: 'fred', severity: 'WARN', reason: expect.stringContaining('rate limit event') }));
    });

    it('raises a WARN alert when the last sync run had any failures', () => {
      service.recordSync('cot', 5, 2);

      const alerts = service.getAlerts();

      expect(alerts).toContainEqual(expect.objectContaining({ providerId: 'cot', domain: 'cot', severity: 'WARN', reason: expect.stringContaining('2 failure') }));
    });

    it('raises no alerts for a healthy provider with no sync failures', () => {
      service.recordSuccess('fred', 'macro-data', 10);
      service.recordSync('macro-data', 4, 0);

      expect(service.getAlerts()).toEqual([]);
    });
  });
});
