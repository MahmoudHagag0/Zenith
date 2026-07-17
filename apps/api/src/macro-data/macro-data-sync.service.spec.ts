import { Test, TestingModule } from '@nestjs/testing';
import { MacroDataSyncService } from './macro-data-sync.service';
import { MacroDataService } from './macro-data.service';
import { TRACKED_MACRO_SERIES } from './tracked-macro-series';

describe('MacroDataSyncService', () => {
  let service: MacroDataSyncService;
  let macroDataService: { syncSeries: jest.Mock };

  beforeEach(async () => {
    macroDataService = { syncSeries: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MacroDataSyncService, { provide: MacroDataService, useValue: macroDataService }],
    }).compile();

    service = module.get<MacroDataSyncService>(MacroDataSyncService);
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
