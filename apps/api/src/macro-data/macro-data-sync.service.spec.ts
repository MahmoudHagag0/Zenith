import { Test, TestingModule } from '@nestjs/testing';
import { MacroDataSyncService } from './macro-data-sync.service';
import { MacroDataService } from './macro-data.service';
import { TRACKED_MACRO_SERIES } from './tracked-macro-series';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';

describe('MacroDataSyncService', () => {
  let service: MacroDataSyncService;
  let macroDataService: { syncSeries: jest.Mock };
  let liveDataObservabilityService: { recordSync: jest.Mock };

  beforeEach(async () => {
    macroDataService = { syncSeries: jest.fn().mockResolvedValue(undefined) };
    liveDataObservabilityService = { recordSync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MacroDataSyncService,
        { provide: MacroDataService, useValue: macroDataService },
        { provide: LiveDataObservabilityService, useValue: liveDataObservabilityService },
      ],
    }).compile();

    service = module.get<MacroDataSyncService>(MacroDataSyncService);
  });

  it('records sync results in LiveDataObservabilityService under the "macro-data" domain', async () => {
    await service.syncTrackedSeries();

    expect(liveDataObservabilityService.recordSync).toHaveBeenCalledWith('macro-data', TRACKED_MACRO_SERIES.length, 0);
  });

  it('syncs every tracked series in the disclosed reference set', async () => {
    await service.syncTrackedSeries();

    expect(macroDataService.syncSeries).toHaveBeenCalledTimes(TRACKED_MACRO_SERIES.length);
    for (const seriesId of TRACKED_MACRO_SERIES) {
      expect(macroDataService.syncSeries).toHaveBeenCalledWith(seriesId);
    }
  });

  it('tolerates a single series failing without aborting the batch', async () => {
    macroDataService.syncSeries.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('provider down'));

    await expect(service.syncTrackedSeries()).resolves.toBeUndefined();

    expect(macroDataService.syncSeries).toHaveBeenCalledTimes(TRACKED_MACRO_SERIES.length);
  });
});
