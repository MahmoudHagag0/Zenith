import { FixtureProvider } from './__fixtures__/fixture-provider';
import { ProviderDependencyCycleError, topologicalSortProviders } from './provider-topological-sort.util';

describe('topologicalSortProviders (WP3)', () => {
  it('sorts a linear dependency chain so each dependency precedes its dependent', () => {
    const a = new FixtureProvider({ id: 'a' });
    const b = new FixtureProvider({ id: 'b', dependsOn: ['a'] });
    const c = new FixtureProvider({ id: 'c', dependsOn: ['b'] });

    const sorted = topologicalSortProviders([c, b, a]).map((p) => p.id);
    expect(sorted).toEqual(['a', 'b', 'c']);
  });

  it('detects a cyclic declaration and rejects with a typed error, never an infinite loop', () => {
    const a = new FixtureProvider({ id: 'a', dependsOn: ['b'] });
    const b = new FixtureProvider({ id: 'b', dependsOn: ['a'] });

    expect(() => topologicalSortProviders([a, b])).toThrow(ProviderDependencyCycleError);
  });

  it('imposes no ordering constraint from a dependency id that is not registered', () => {
    const a = new FixtureProvider({ id: 'a', dependsOn: ['not-registered'] });
    const sorted = topologicalSortProviders([a]).map((p) => p.id);
    expect(sorted).toEqual(['a']);
  });

  it('leaves independent Providers in a valid relative order without a declared dependency', () => {
    const a = new FixtureProvider({ id: 'a' });
    const b = new FixtureProvider({ id: 'b' });
    const sorted = topologicalSortProviders([a, b]).map((p) => p.id);
    expect(sorted.sort()).toEqual(['a', 'b']);
  });
});
