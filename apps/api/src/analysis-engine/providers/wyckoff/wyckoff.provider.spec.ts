import { Test, TestingModule } from '@nestjs/testing';
import { WyckoffProvider } from './wyckoff.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';

describe('WyckoffProvider skeleton (WP1)', () => {
  let provider: WyckoffProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: INDICATOR_ENGINE, useValue: {} },
        { provide: SWING_DETECTOR, useValue: {} },
        { provide: REGIME_CONTEXT, useValue: {} },
      ],
    }).compile();
    provider = module.get(WyckoffProvider);
  });

  it('satisfies the full AnalysisProvider interface', () => {
    expect(provider.id).toBe('WYCKOFF');
    expect(provider.methodologyFamily).toBe('WYCKOFF');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.tier).toBe('SLOW');
    expect(provider.computationVersion).toBe('1.0.0');
    expect(provider.dependsOn).toBeUndefined();
    expect(provider.normalize()).toBeUndefined();
  });

  it('is the only Provider currently declaring methodologyFamily WYCKOFF', () => {
    expect(provider.methodologyFamily).toBe('WYCKOFF');
  });
});
