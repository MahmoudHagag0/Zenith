import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringController } from './monitoring.controller';
import { LiveDataObservabilityService } from './live-data-observability.service';

describe('MonitoringController', () => {
  let controller: MonitoringController;
  let liveDataObservabilityService: { getProviderSnapshots: jest.Mock; getSyncSnapshots: jest.Mock; getAlerts: jest.Mock };

  beforeEach(async () => {
    liveDataObservabilityService = {
      getProviderSnapshots: jest.fn().mockReturnValue([{ providerId: 'fred', domain: 'macro-data' }]),
      getSyncSnapshots: jest.fn().mockReturnValue([{ domain: 'macro-data' }]),
      getAlerts: jest.fn().mockReturnValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [{ provide: LiveDataObservabilityService, useValue: liveDataObservabilityService }],
    }).compile();

    controller = module.get<MonitoringController>(MonitoringController);
  });

  it('getProviderHealth() returns both provider and sync snapshots', () => {
    const result = controller.getProviderHealth();

    expect(result).toEqual({ providers: [{ providerId: 'fred', domain: 'macro-data' }], syncs: [{ domain: 'macro-data' }] });
  });

  it('getAlerts() delegates directly to LiveDataObservabilityService.getAlerts()', () => {
    const result = controller.getAlerts();

    expect(liveDataObservabilityService.getAlerts).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
