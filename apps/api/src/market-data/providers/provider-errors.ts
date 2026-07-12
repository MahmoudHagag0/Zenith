export class ProviderRateLimitedError extends Error {
  constructor(message = 'Provider rate limit exceeded') {
    super(message);
    this.name = 'ProviderRateLimitedError';
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message = 'Provider temporarily unavailable') {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}
