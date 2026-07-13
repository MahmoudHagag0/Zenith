import { Inject, Injectable } from '@nestjs/common';
import { ObservabilityService } from '../common/observability.service';
import type { MarketSeries } from '../market-series/market-series.types';
import { ANALYSIS_PROVIDERS } from './analysis-provider.tokens';
import type { ProviderExecutionEngine } from './analysis-provider.tokens';
import type { AnalysisProvider } from './analysis-provider.types';
import { ProviderCircuitBreaker } from './provider-circuit-breaker';
import { ProviderHealthTracker } from './provider-health.util';
import { topologicalSortProviders } from './provider-topological-sort.util';
import type {
  ExecutionRunResult,
  NonParticipatingEntry,
  ParticipatingEntry,
  TieredExecutionRun,
} from './provider-execution.types';

/**
 * Circuit-breaker and per-invocation timeout defaults — implementation-time
 * calibration (S1-008 Sprint Brief, Missing Decisions), not fixed by
 * ADR-006. A Provider may override the timeout via its own `timeoutMs`.
 */
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_RESET_TIMEOUT_MS = 30_000;

class ProviderTimeoutError extends Error {}

type Outcome = { readonly participated: true; readonly entry: ParticipatingEntry } | { readonly participated: false; readonly entry: NonParticipatingEntry };

/**
 * The Analysis Provider Framework's Execution Engine (ADR-006). Resolves
 * declared dependencies by stable `id` (never a concrete-class reference)
 * via topological sort, invokes each Provider through a per-Provider
 * circuit breaker and timeout, and reports non-participation explicitly
 * and distinctly from participation — never silently neutral or agreeing.
 */
@Injectable()
export class ProviderExecutionService implements ProviderExecutionEngine {
  private readonly circuitBreaker = new ProviderCircuitBreaker({
    failureThreshold: DEFAULT_FAILURE_THRESHOLD,
    resetTimeoutMs: DEFAULT_RESET_TIMEOUT_MS,
  });
  private readonly healthTracker = new ProviderHealthTracker();

  constructor(
    @Inject(ANALYSIS_PROVIDERS) private readonly providers: readonly AnalysisProvider[],
    private readonly observability: ObservabilityService,
  ) {}

  runNewAnalysis(series: MarketSeries): TieredExecutionRun {
    const sorted = topologicalSortProviders(this.providers);
    const outcomes = new Map<string, Promise<Outcome>>();

    for (const provider of sorted) {
      outcomes.set(provider.id, this.scheduleNewRun(provider, series, outcomes));
    }

    return {
      fastTier: this.collect(sorted.filter((provider) => provider.tier === 'FAST'), outcomes),
      slowTier: this.collect(sorted.filter((provider) => provider.tier === 'SLOW'), outcomes),
    };
  }

  async runProviderDirectly(providerId: string, series: MarketSeries): Promise<ParticipatingEntry | NonParticipatingEntry> {
    const provider = this.providers.find((candidate) => candidate.id === providerId);
    if (!provider) {
      return { providerId, reason: 'ERROR', detail: `No registered Provider with id '${providerId}'.` };
    }
    if (provider.lifecycleState === 'RETIRED') {
      return { providerId, reason: 'LIFECYCLE_EXCLUDED', detail: 'RETIRED Providers are not executable, by any call path.' };
    }
    if (this.circuitBreaker.isOpen(provider.id)) {
      return { providerId, reason: 'CIRCUIT_OPEN', detail: 'Circuit is open for this Provider.' };
    }
    const outcome = await this.invoke(provider, series);
    return outcome.entry;
  }

  /** Exposed for observability wiring/tests — not part of the ProviderExecutionEngine contract. */
  getHealthSignal(providerId: string) {
    return this.healthTracker.getSignal(providerId, this.circuitBreaker.isOpen(providerId));
  }

  private async scheduleNewRun(provider: AnalysisProvider, series: MarketSeries, outcomes: Map<string, Promise<Outcome>>): Promise<Outcome> {
    if (provider.lifecycleState !== 'ACTIVE') {
      return {
        participated: false,
        entry: { providerId: provider.id, reason: 'LIFECYCLE_EXCLUDED', detail: `Provider lifecycleState is ${provider.lifecycleState}, excluded from new runs.` },
      };
    }

    for (const dependencyId of provider.dependsOn ?? []) {
      const dependencyOutcome = outcomes.get(dependencyId);
      if (!dependencyOutcome) {
        return {
          participated: false,
          entry: { providerId: provider.id, reason: 'DEPENDENCY_NON_PARTICIPATING', detail: `Declared dependency '${dependencyId}' is not registered.` },
        };
      }
      const resolvedDependency = await dependencyOutcome;
      if (!resolvedDependency.participated) {
        return {
          participated: false,
          entry: { providerId: provider.id, reason: 'DEPENDENCY_NON_PARTICIPATING', detail: `Declared dependency '${dependencyId}' did not participate.` },
        };
      }
    }

    if (this.circuitBreaker.isOpen(provider.id)) {
      return { participated: false, entry: { providerId: provider.id, reason: 'CIRCUIT_OPEN', detail: 'Circuit is open for this Provider.' } };
    }

    return this.invoke(provider, series);
  }

  private async invoke(provider: AnalysisProvider, series: MarketSeries): Promise<Outcome> {
    const timeoutMs = provider.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    try {
      const result = await this.observability.measureAsync(`Provider:${provider.id}`, () => this.raceWithTimeout(provider.analyze(series), timeoutMs));
      this.circuitBreaker.recordSuccess(provider.id);
      const topConfidence = result.interpretation[0]?.confidence.value.toNumber() ?? null;
      this.healthTracker.recordAttempt(provider.id, true, topConfidence);
      return { participated: true, entry: { providerId: provider.id, result } };
    } catch (error) {
      this.circuitBreaker.recordFailure(provider.id);
      this.healthTracker.recordAttempt(provider.id, false);
      if (error instanceof ProviderTimeoutError) {
        return { participated: false, entry: { providerId: provider.id, reason: 'TIMEOUT', detail: error.message } };
      }
      const detail = error instanceof Error ? error.message : String(error);
      return { participated: false, entry: { providerId: provider.id, reason: 'ERROR', detail } };
    }
  }

  private raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new ProviderTimeoutError(`Timed out after ${timeoutMs}ms`)), timeoutMs);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  private async collect(tierProviders: readonly AnalysisProvider[], outcomes: Map<string, Promise<Outcome>>): Promise<ExecutionRunResult> {
    const settled = await Promise.all(tierProviders.map((provider) => outcomes.get(provider.id) as Promise<Outcome>));
    const participating: ParticipatingEntry[] = [];
    const nonParticipating: NonParticipatingEntry[] = [];
    for (const outcome of settled) {
      if (outcome.participated) {
        participating.push(outcome.entry);
      } else {
        nonParticipating.push(outcome.entry);
      }
    }
    return { participating, nonParticipating, totalRegistered: this.providers.length };
  }
}
