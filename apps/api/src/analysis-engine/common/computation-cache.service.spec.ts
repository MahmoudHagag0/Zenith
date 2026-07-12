import { Test, TestingModule } from '@nestjs/testing';
import { ComputationCacheService } from './computation-cache.service';

describe('ComputationCacheService', () => {
  let service: ComputationCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComputationCacheService],
    }).compile();
    service = module.get(ComputationCacheService);
  });

  it('builds a key keyed by (computation, parameters, instrument, data-range)', () => {
    const key1 = service.buildKey('RSI', { period: 14 }, 'asset-1', { from: 'a', to: 'b' });
    const key2 = service.buildKey('RSI', { period: 14 }, 'asset-1', { from: 'a', to: 'b' });
    const key3 = service.buildKey('RSI', { period: 21 }, 'asset-1', { from: 'a', to: 'b' });
    expect(key1).toEqual(key2);
    expect(key1).not.toEqual(key3);
  });

  it('returns undefined on a miss and records it', () => {
    expect(service.get('missing-key')).toBeUndefined();
    expect(service.getStats()).toEqual({ hits: 0, misses: 1, hitRatio: 0 });
  });

  it('returns the cached value on a hit and records it', () => {
    service.set('k', { value: 42 });
    expect(service.get('k')).toEqual({ value: 42 });
    expect(service.getStats()).toEqual({ hits: 1, misses: 0, hitRatio: 1 });
  });

  it('expires an entry after its TTL', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-12T00:00:00.000Z'));
    service.set('k', 'v', 1_000);
    expect(service.get('k')).toBe('v');
    jest.setSystemTime(new Date('2026-07-12T00:00:02.000Z'));
    expect(service.get('k')).toBeUndefined();
    jest.useRealTimers();
  });

  it('differing parameters bypass the cache (distinct keys never collide)', () => {
    const keyA = service.buildKey('SMA', { period: 10 }, 'asset-1', { from: 'a', to: 'b' });
    const keyB = service.buildKey('SMA', { period: 20 }, 'asset-1', { from: 'a', to: 'b' });
    service.set(keyA, 'a-result');
    service.set(keyB, 'b-result');
    expect(service.get(keyA)).toBe('a-result');
    expect(service.get(keyB)).toBe('b-result');
  });
});
