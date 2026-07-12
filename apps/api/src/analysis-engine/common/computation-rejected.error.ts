/**
 * Thrown when a computation declines to produce a result because its input
 * was insufficient or invalid (e.g. fewer bars than a given indicator's
 * period requires). This is an expected, correctly-handled outcome, not a
 * bug — distinct from an unhandled exception, which is always a defect.
 * Callers (a future Analysis Provider, S1-008+) are expected to catch this
 * and translate it into their own `Limitations` entry; this sprint's
 * services only need to throw it in a well-typed, recognizable way and
 * record it via ObservabilityService's rejection-rate counter.
 */
export class ComputationRejectedError extends Error {
  constructor(
    public readonly computation: string,
    public readonly reason: string,
  ) {
    super(`${computation} rejected: ${reason}`);
    this.name = 'ComputationRejectedError';
  }
}
