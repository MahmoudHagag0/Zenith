import { MorningBriefService } from './morning-brief.service';
import type { DecisionCenterResponse } from '../dashboard/dashboard.types';
import type { MorningBriefResponse } from './morning-brief.types';

describe('MorningBriefService (S1-020 WP2)', () => {
  it('calls DashboardService.getDecisionCenter exactly once and passes its exact return value to the composer -- no independent aggregation or ranking', async () => {
    const decisionCenter: DecisionCenterResponse = {
      readiness: 'OPPORTUNITIES_AVAILABLE',
      generatedAt: '2026-01-01T00:00:00.000Z',
      instrumentsConsidered: 2,
      instrumentsFailed: [],
      opportunities: [],
    };
    const composed: MorningBriefResponse = {
      generatedAt: decisionCenter.generatedAt,
      readiness: decisionCenter.readiness,
      headline: 'headline',
      entries: [],
      instrumentsConsidered: 2,
      instrumentsFailed: [],
    };

    const getDecisionCenter = jest.fn().mockResolvedValue(decisionCenter);
    const compose = jest.fn().mockReturnValue(composed);
    const service = new MorningBriefService({ getDecisionCenter } as never, { compose } as never);

    const result = await service.getMorningBrief('user-1');

    expect(getDecisionCenter).toHaveBeenCalledTimes(1);
    expect(getDecisionCenter).toHaveBeenCalledWith('user-1');
    expect(compose).toHaveBeenCalledTimes(1);
    expect(compose).toHaveBeenCalledWith(decisionCenter);
    expect(result).toBe(composed);
  });

  it('propagates a DashboardService failure rather than swallowing it or fabricating a result', async () => {
    const getDecisionCenter = jest.fn().mockRejectedValue(new Error('boom'));
    const compose = jest.fn();
    const service = new MorningBriefService({ getDecisionCenter } as never, { compose } as never);

    await expect(service.getMorningBrief('user-1')).rejects.toThrow('boom');
    expect(compose).not.toHaveBeenCalled();
  });
});
