import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityService } from './observability.service';
import { ComputationRejectedError } from './computation-rejected.error';

describe('ObservabilityService', () => {
  let service: ObservabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObservabilityService],
    }).compile();
    service = module.get(ObservabilityService);
  });

  it('records latency for a successful computation', () => {
    const result = service.measure('RSI', () => 42);
    expect(result).toBe(42);
    const stats = service.getStats('RSI');
    expect(stats.invocations).toBe(1);
    expect(stats.averageLatencyMs).toBeGreaterThanOrEqual(0);
    expect(stats.rejectionRate).toBe(0);
  });

  it('counts a ComputationRejectedError as a rejection, not an unhandled failure, and rethrows it', () => {
    expect(() =>
      service.measure('RSI', () => {
        throw new ComputationRejectedError('RSI', 'insufficient input');
      }),
    ).toThrow(ComputationRejectedError);

    const stats = service.getStats('RSI');
    expect(stats.invocations).toBe(1);
    expect(stats.rejectionRate).toBe(1);
  });

  it('does not count a genuine unhandled exception as a rejection, but still records latency and rethrows', () => {
    expect(() =>
      service.measure('RSI', () => {
        throw new TypeError('unexpected bug');
      }),
    ).toThrow(TypeError);

    const stats = service.getStats('RSI');
    expect(stats.invocations).toBe(1);
    expect(stats.rejectionRate).toBe(0);
  });

  it('computes rejection rate as a fraction of total invocations', () => {
    service.measure('ATR', () => 1);
    expect(() =>
      service.measure('ATR', () => {
        throw new ComputationRejectedError('ATR', 'not enough bars');
      }),
    ).toThrow(ComputationRejectedError);
    service.measure('ATR', () => 1);

    const stats = service.getStats('ATR');
    expect(stats.invocations).toBe(3);
    expect(stats.rejectionRate).toBeCloseTo(1 / 3, 10);
  });

  it('returns zeroed stats for a computation that has never run', () => {
    expect(service.getStats('never-run')).toEqual({ invocations: 0, averageLatencyMs: 0, rejectionRate: 0 });
  });
});
