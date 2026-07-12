import { withRetry } from './retry.util';

describe('withRetry', () => {
  it('returns the result on the first successful attempt without retrying', async () => {
    const fn = jest.fn().mockResolvedValue('ok');

    const result = await withRetry(fn, { retries: 3, baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable failure and eventually succeeds', async () => {
    const fn = jest.fn().mockRejectedValueOnce(new Error('transient')).mockResolvedValue('ok');

    const result = await withRetry(fn, { retries: 3, baseDelayMs: 1 });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting all retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    await expect(withRetry(fn, { retries: 2, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry a non-retryable error, even on the first attempt', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('invalid input'));

    await expect(
      withRetry(fn, { retries: 3, baseDelayMs: 1, isRetryable: () => false }),
    ).rejects.toThrow('invalid input');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
