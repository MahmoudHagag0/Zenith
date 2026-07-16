import { TrackedAssetsService } from './tracked-assets.service';

function asset(id: string, symbol: string, marketName = 'NASDAQ') {
  return { id, symbol, market: { name: marketName } };
}

describe('TrackedAssetsService', () => {
  let prisma: {
    watchlistItem: { findMany: jest.Mock };
    favouriteAsset: { findMany: jest.Mock };
    position: { findMany: jest.Mock };
    asset: { findMany: jest.Mock };
  };
  let service: TrackedAssetsService;

  beforeEach(() => {
    prisma = {
      watchlistItem: { findMany: jest.fn().mockResolvedValue([]) },
      favouriteAsset: { findMany: jest.fn().mockResolvedValue([]) },
      position: { findMany: jest.fn().mockResolvedValue([]) },
      asset: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new TrackedAssetsService(prisma as never);
  });

  describe('getTrackedInstrumentsForUser (Dashboard)', () => {
    it('gathers the union of Watchlist and open-Position instruments, deduplicated by assetId', async () => {
      prisma.watchlistItem.findMany.mockResolvedValue([{ asset: asset('a1', 'AAA') }, { asset: asset('a2', 'BBB') }]);
      prisma.position.findMany.mockResolvedValue([{ asset: asset('a2', 'BBB') }, { asset: asset('a3', 'CCC') }]);

      const result = await service.getTrackedInstrumentsForUser('user-1');

      expect(result.map((i) => i.assetId).sort()).toEqual(['a1', 'a2', 'a3']);
      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { portfolio: { userId: 'user-1' }, quantity: { gt: 0 } } }),
      );
    });

    it('does not include Favourites', async () => {
      await service.getTrackedInstrumentsForUser('user-1');

      expect(prisma.favouriteAsset.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getTrackedAssetIdsForUser (Calendar/News)', () => {
    it('returns the deduplicated union of watchlist and position asset IDs for one user', async () => {
      prisma.watchlistItem.findMany.mockResolvedValue([{ assetId: 'asset-1' }]);
      prisma.position.findMany.mockResolvedValue([{ assetId: 'asset-1' }, { assetId: 'asset-2' }]);

      const result = await service.getTrackedAssetIdsForUser('user-1');

      expect(result.sort()).toEqual(['asset-1', 'asset-2']);
    });

    it('does not include Favourites', async () => {
      await service.getTrackedAssetIdsForUser('user-1');

      expect(prisma.favouriteAsset.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getAllTrackedAssetIds (background sync, global)', () => {
    it('deduplicates tracked assets across watchlists, favourites, and positions for every user', async () => {
      prisma.watchlistItem.findMany.mockResolvedValue([{ assetId: 'asset-1' }]);
      prisma.favouriteAsset.findMany.mockResolvedValue([{ assetId: 'asset-2' }]);
      prisma.position.findMany.mockResolvedValue([{ assetId: 'asset-1' }]);

      const result = await service.getAllTrackedAssetIds();

      expect(result.sort()).toEqual(['asset-1', 'asset-2']);
    });

    it('only queries positions with a nonzero quantity, with no userId filter', async () => {
      await service.getAllTrackedAssetIds();

      expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { quantity: { gt: 0 } } }));
    });
  });

  describe('getAllTrackedAssetsWithExchange (background sync gating, L1-002)', () => {
    it('joins the global tracked-asset union to each asset\'s Exchange code', async () => {
      prisma.watchlistItem.findMany.mockResolvedValue([{ assetId: 'asset-1' }]);
      prisma.position.findMany.mockResolvedValue([{ assetId: 'asset-2' }]);
      prisma.asset.findMany.mockResolvedValue([
        { id: 'asset-1', market: { exchange: { code: 'XNAS' } } },
        { id: 'asset-2', market: { exchange: { code: 'XLON' } } },
      ]);

      const result = await service.getAllTrackedAssetsWithExchange();

      expect(result.sort((a, b) => a.assetId.localeCompare(b.assetId))).toEqual([
        { assetId: 'asset-1', exchangeCode: 'XNAS' },
        { assetId: 'asset-2', exchangeCode: 'XLON' },
      ]);
      expect(prisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: expect.arrayContaining(['asset-1', 'asset-2']) } } }),
      );
    });

    it('returns an empty array without querying assets when nothing is tracked', async () => {
      const result = await service.getAllTrackedAssetsWithExchange();

      expect(result).toEqual([]);
      expect(prisma.asset.findMany).not.toHaveBeenCalled();
    });
  });
});
