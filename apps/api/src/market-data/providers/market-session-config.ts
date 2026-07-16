export interface ExchangeSessionConfig {
  /** IANA timezone the open/close times below are expressed in, e.g. 'America/New_York'. */
  readonly timezone: string;
  /** Local open time, 'HH:mm', 24-hour. */
  readonly openTime: string;
  /** Local close time, 'HH:mm', 24-hour. */
  readonly closeTime: string;
  /** Days the exchange trades: 0 = Sunday ... 6 = Saturday. */
  readonly weekdays: readonly number[];
  /** Exchange-local calendar dates ('YYYY-MM-DD') the exchange is closed despite being an otherwise-trading weekday. */
  readonly holidays: readonly string[];
}

/**
 * Internal Market Sessions Table (28_LIVE_DATA_BLUEPRINT.md Addendum §A2:
 * "Use internal table — seamless... exchange hours change extremely
 * rarely") -- the Architecture-Team-approved primary source of truth for
 * L1-002 (approval, 2026-07-16). External providers are not queried for
 * runtime session/holiday lookups; this table is maintained here only.
 *
 * Exchange codes are whatever `Exchange.code` values exist in this
 * deployment (Exchanges module, S1-003) -- there is no fixed global enum.
 * This table is seeded with a handful of widely known real exchanges as a
 * starting reference; extend it as new exchanges are registered.
 * 2026 holiday dates below are computed from each exchange's published
 * holiday-observance rules (e.g. "third Monday of January" for MLK Day),
 * not copied from a live feed -- treat as a maintained reference, not an
 * authoritative real-time source, and verify before relying on it for a
 * real trading decision.
 *
 * `ZDX` (Zenith Demo Exchange, used by local seed data) intentionally has
 * no entry: an unconfigured code resolves to `MarketStatus: 'UNKNOWN'`,
 * which `MarketDataSyncService` treats as fail-open (poll as normal) --
 * preserving the pre-L1-002 always-poll demo behavior with zero
 * regression, rather than inventing fictitious trading hours for a
 * fictitious exchange.
 */
export const MARKET_SESSION_CONFIG: Readonly<Record<string, ExchangeSessionConfig>> = {
  XNAS: {
    // NASDAQ
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    weekdays: [1, 2, 3, 4, 5],
    holidays: [
      '2026-01-01', // New Year's Day
      '2026-01-19', // Martin Luther King Jr. Day
      '2026-02-16', // Washington's Birthday
      '2026-04-03', // Good Friday
      '2026-05-25', // Memorial Day
      '2026-06-19', // Juneteenth
      '2026-07-03', // Independence Day (observed)
      '2026-09-07', // Labor Day
      '2026-11-26', // Thanksgiving Day
      '2026-12-25', // Christmas Day
    ],
  },
  XNYS: {
    // New York Stock Exchange
    timezone: 'America/New_York',
    openTime: '09:30',
    closeTime: '16:00',
    weekdays: [1, 2, 3, 4, 5],
    holidays: [
      '2026-01-01',
      '2026-01-19',
      '2026-02-16',
      '2026-04-03',
      '2026-05-25',
      '2026-06-19',
      '2026-07-03',
      '2026-09-07',
      '2026-11-26',
      '2026-12-25',
    ],
  },
  XLON: {
    // London Stock Exchange
    timezone: 'Europe/London',
    openTime: '08:00',
    closeTime: '16:30',
    weekdays: [1, 2, 3, 4, 5],
    holidays: [
      '2026-01-01', // New Year's Day
      '2026-04-03', // Good Friday
      '2026-04-06', // Easter Monday
      '2026-05-04', // Early May bank holiday
      '2026-05-25', // Spring bank holiday
      '2026-08-31', // Summer bank holiday
      '2026-12-25', // Christmas Day
      '2026-12-28', // Boxing Day (substitute, 26th falls on a Saturday)
    ],
  },
};
