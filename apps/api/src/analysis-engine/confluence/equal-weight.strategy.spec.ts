import { EqualWeightStrategy } from './equal-weight.strategy';

describe('EqualWeightStrategy (S1-012 WP7)', () => {
  it('returns weight 1.0 and the exact disclosed weightExplanation for every Provider, regardless of methodologyFamily', () => {
    const strategy = new EqualWeightStrategy();

    expect(strategy.computeWeight('WYCKOFF', 'WYCKOFF')).toEqual({ weight: 1.0, weightExplanation: 'equal weighting, no differential weighting strategy active yet' });
    expect(strategy.computeWeight('ICT_SMC', 'ICT_SMC')).toEqual({ weight: 1.0, weightExplanation: 'equal weighting, no differential weighting strategy active yet' });
    expect(strategy.computeWeight('ELLIOTT_WAVE', undefined)).toEqual({ weight: 1.0, weightExplanation: 'equal weighting, no differential weighting strategy active yet' });
  });
});
