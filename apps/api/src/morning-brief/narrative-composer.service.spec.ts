import { NarrativeComposerService } from './narrative-composer.service';
import type { DecisionCenterResponse } from '../dashboard/dashboard.types';

describe('NarrativeComposerService (S1-020 WP2)', () => {
  it('delegates to composeMorningBrief() with no additional logic of its own', () => {
    const decisionCenter: DecisionCenterResponse = {
      readiness: 'NO_CLEAR_OPPORTUNITY',
      generatedAt: '2026-01-01T00:00:00.000Z',
      instrumentsConsidered: 0,
      instrumentsFailed: [],
      opportunities: [],
    };
    const service = new NarrativeComposerService();
    const result = service.compose(decisionCenter);

    expect(result.readiness).toBe('NO_CLEAR_OPPORTUNITY');
    expect(result.generatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(result.noTradeNarrative).toContain('not currently tracking any instruments');
  });
});
