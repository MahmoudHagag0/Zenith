import type { AnalysisProvider } from './analysis-provider.types';

/**
 * Thrown when Providers declare a circular dependency (e.g. A depends on
 * B, B depends on A) — detected and rejected explicitly, never a silent
 * infinite loop or an unhandled stack overflow (ADR-006, "Analysis
 * Provider Framework").
 */
export class ProviderDependencyCycleError extends Error {
  constructor(public readonly cycle: readonly string[]) {
    super(`Circular Provider dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'ProviderDependencyCycleError';
  }
}

/**
 * Orders Providers so every dependency (declared by stable `id`, never a
 * concrete-class reference) is sorted before its dependents, per ADR-006's
 * Execution Engine requirement. A dependency `id` not present in the given
 * set imposes no ordering constraint here — whether an unresolved
 * dependency should prevent its dependent from running is an execution-
 * time (not sort-time) concern, handled by the Execution Engine via
 * `NonParticipationReason: 'DEPENDENCY_NON_PARTICIPATING'`.
 */
export function topologicalSortProviders(providers: readonly AnalysisProvider[]): AnalysisProvider[] {
  const byId = new Map(providers.map((provider) => [provider.id, provider]));
  const visited = new Set<string>();
  const inProgress = new Set<string>();
  const sorted: AnalysisProvider[] = [];

  function visit(id: string, path: readonly string[]): void {
    if (visited.has(id)) return;
    const provider = byId.get(id);
    if (!provider) return;
    if (inProgress.has(id)) {
      throw new ProviderDependencyCycleError([...path, id]);
    }
    inProgress.add(id);
    for (const dependencyId of provider.dependsOn ?? []) {
      visit(dependencyId, [...path, id]);
    }
    inProgress.delete(id);
    visited.add(id);
    sorted.push(provider);
  }

  for (const provider of providers) {
    visit(provider.id, []);
  }

  return sorted;
}
