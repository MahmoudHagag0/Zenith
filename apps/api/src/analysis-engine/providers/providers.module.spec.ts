import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersModule } from './providers.module';
import { ANALYSIS_PROVIDERS } from './analysis-provider.tokens';
import { FixtureProvider } from './__fixtures__/fixture-provider';
import type { AnalysisProvider } from './analysis-provider.types';

describe('ProvidersModule (WP2)', () => {
  it('resolves ANALYSIS_PROVIDERS to an empty array in the production module', async () => {
    const module: TestingModule = await Test.createTestingModule({ imports: [ProvidersModule] }).compile();
    const providers = module.get<AnalysisProvider[]>(ANALYSIS_PROVIDERS);
    expect(providers).toEqual([]);
  });

  it('resolves ANALYSIS_PROVIDERS to the configured set when fixture Providers are registered', async () => {
    const fixtureA = new FixtureProvider({ id: 'fixture-a' });
    const fixtureB = new FixtureProvider({ id: 'fixture-b' });
    const module: TestingModule = await Test.createTestingModule({
      providers: [{ provide: ANALYSIS_PROVIDERS, useFactory: () => [fixtureA, fixtureB] }],
    }).compile();
    const providers = module.get<AnalysisProvider[]>(ANALYSIS_PROVIDERS);
    expect(providers).toEqual([fixtureA, fixtureB]);
  });
});
