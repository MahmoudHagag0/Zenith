import { Test, TestingModule } from '@nestjs/testing';
import { ProviderExecutionService } from './provider-execution.service';
import { ObservabilityService } from '../common/observability.service';
import { ANALYSIS_PROVIDERS } from './analysis-provider.tokens';
import { FixtureProvider } from './__fixtures__/fixture-provider';
import type { MarketSeries } from '../market-series/market-series.types';

function emptySeries(): MarketSeries {
  return {
    assetId: 'asset-1',
    requestedRange: { from: new Date('2026-01-01'), to: new Date('2026-01-01') },
    points: [],
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

async function buildService(providers: FixtureProvider[]): Promise<ProviderExecutionService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [ProviderExecutionService, ObservabilityService, { provide: ANALYSIS_PROVIDERS, useValue: providers }],
  }).compile();
  return module.get(ProviderExecutionService);
}

describe('ProviderExecutionService', () => {
  describe('dependency resolution (WP3 integration)', () => {
    it('invokes a dependency chain in order and every Provider participates', async () => {
      const a = new FixtureProvider({ id: 'a' });
      const b = new FixtureProvider({ id: 'b', dependsOn: ['a'] });
      const service = await buildService([b, a]);

      const run = service.runNewAnalysis(emptySeries());
      const fast = await run.fastTier;
      expect(fast.participating.map((p) => p.providerId).sort()).toEqual(['a', 'b']);
      expect(fast.nonParticipating).toEqual([]);
    });

    it('propagates non-participation to a dependent when a dependency fails', async () => {
      const a = new FixtureProvider({ id: 'a', behavior: 'THROW' });
      const b = new FixtureProvider({ id: 'b', dependsOn: ['a'] });
      const service = await buildService([a, b]);

      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      const aEntry = fast.nonParticipating.find((e) => e.providerId === 'a');
      const bEntry = fast.nonParticipating.find((e) => e.providerId === 'b');
      expect(aEntry?.reason).toBe('ERROR');
      expect(bEntry?.reason).toBe('DEPENDENCY_NON_PARTICIPATING');
    });
  });

  describe('fast/slow tier separation (WP4)', () => {
    it('resolves fastTier without waiting on a slow-tier Provider still in progress', async () => {
      const fast = new FixtureProvider({ id: 'fast', tier: 'FAST' });
      const slow = new FixtureProvider({ id: 'slow', tier: 'SLOW', delayMs: 200 });
      const service = await buildService([fast, slow]);

      const start = Date.now();
      const run = service.runNewAnalysis(emptySeries());
      const fastResult = await run.fastTier;
      const elapsed = Date.now() - start;

      expect(fastResult.participating.map((p) => p.providerId)).toEqual(['fast']);
      expect(elapsed).toBeLessThan(150);

      const slowResult = await run.slowTier;
      expect(slowResult.participating.map((p) => p.providerId)).toEqual(['slow']);
    });
  });

  describe('partial failure reporting (WP5)', () => {
    it('reports a throwing Provider as non-participating, distinct from a succeeding one, against the full registered count', async () => {
      const ok = new FixtureProvider({ id: 'ok' });
      const bad = new FixtureProvider({ id: 'bad', behavior: 'THROW' });
      const service = await buildService([ok, bad]);

      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fast.totalRegistered).toBe(2);
      expect(fast.participating.map((p) => p.providerId)).toEqual(['ok']);
      expect(fast.nonParticipating).toEqual([{ providerId: 'bad', reason: 'ERROR', detail: 'bad fixture configured to throw' }]);
    });

    it('reports a hanging Provider as TIMEOUT once its timeoutMs elapses', async () => {
      const hanging = new FixtureProvider({ id: 'hanging', behavior: 'HANG', timeoutMs: 30 });
      const service = await buildService([hanging]);

      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fast.nonParticipating).toHaveLength(1);
      expect(fast.nonParticipating[0].reason).toBe('TIMEOUT');
    }, 10_000);
  });

  describe('circuit breaker (WP6 integration)', () => {
    it('opens the circuit after repeated failures and excludes the Provider without re-invoking it', async () => {
      const flaky = new FixtureProvider({ id: 'flaky', behavior: 'THROW' });
      const service = await buildService([flaky]);

      await service.runNewAnalysis(emptySeries()).fastTier;
      await service.runNewAnalysis(emptySeries()).fastTier;
      await service.runNewAnalysis(emptySeries()).fastTier;
      expect(flaky.invocationCount).toBe(3);

      const fourth = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fourth.nonParticipating[0].reason).toBe('CIRCUIT_OPEN');
      expect(flaky.invocationCount).toBe(3);
    });
  });

  describe('Provider Lifecycle gating (WP7)', () => {
    it('excludes a DEPRECATED Provider from a new run but still allows direct invocation', async () => {
      const deprecated = new FixtureProvider({ id: 'dep', lifecycleState: 'DEPRECATED' });
      const service = await buildService([deprecated]);

      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fast.nonParticipating[0]).toMatchObject({ providerId: 'dep', reason: 'LIFECYCLE_EXCLUDED' });

      const direct = await service.runProviderDirectly('dep', emptySeries());
      expect('result' in direct).toBe(true);
    });

    it('never invokes a RETIRED Provider, by any call path', async () => {
      const retired = new FixtureProvider({ id: 'retired', lifecycleState: 'RETIRED' });
      const service = await buildService([retired]);

      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fast.nonParticipating[0]).toMatchObject({ providerId: 'retired', reason: 'LIFECYCLE_EXCLUDED' });

      const direct = await service.runProviderDirectly('retired', emptySeries());
      expect(direct).toMatchObject({ reason: 'LIFECYCLE_EXCLUDED' });
      expect(retired.invocationCount).toBe(0);
    });

    it('participates an ACTIVE Provider in a new run', async () => {
      const active = new FixtureProvider({ id: 'active' });
      const service = await buildService([active]);
      const fast = await service.runNewAnalysis(emptySeries()).fastTier;
      expect(fast.participating.map((p) => p.providerId)).toEqual(['active']);
    });
  });

  describe('runProviderDirectly', () => {
    it('reports ERROR for an unregistered Provider id', async () => {
      const service = await buildService([]);
      const result = await service.runProviderDirectly('does-not-exist', emptySeries());
      expect(result).toMatchObject({ providerId: 'does-not-exist', reason: 'ERROR' });
    });
  });
});
