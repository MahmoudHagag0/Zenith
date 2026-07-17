export type ProviderStatus = 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export interface ProviderMetricsSnapshot {
  readonly providerId: string;
  readonly domain: string;
  readonly status: ProviderStatus;
  readonly successCount: number;
  readonly failureCount: number;
  readonly averageLatencyMs: number;
  readonly retryCount: number;
  readonly rateLimitEvents: number;
  readonly lastSuccessAt: Date | null;
  readonly lastFailureAt: Date | null;
  readonly circuitOpen: boolean;
}

export interface SyncMetricsSnapshot {
  readonly domain: string;
  readonly lastSyncAt: Date | null;
  readonly lastSyncSucceeded: number;
  readonly lastSyncFailed: number;
}

export type AlertSeverity = 'WARN' | 'CRITICAL';

export interface OperationalAlert {
  readonly providerId: string;
  readonly domain: string;
  readonly severity: AlertSeverity;
  readonly reason: string;
}
