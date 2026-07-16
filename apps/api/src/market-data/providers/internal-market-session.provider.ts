import { Injectable } from '@nestjs/common';
import type { ProviderHealthStatus } from './market-data-provider.interface';
import type { MarketSessionProvider, MarketStatus } from './market-session-provider.interface';
import { MARKET_SESSION_CONFIG } from './market-session-config';

interface LocalDateTimeParts {
  /** Exchange-local calendar date, 'YYYY-MM-DD'. */
  readonly isoDate: string;
  /** 0 = Sunday ... 6 = Saturday, in the exchange's local calendar. */
  readonly weekday: number;
  readonly minutesSinceMidnight: number;
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function toLocalParts(at: Date, timezone: string): LocalDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(at)) {
    parts[part.type] = part.value;
  }

  // Some ICU builds render midnight as hour "24" under hour12:false --
  // normalize it to 0 rather than let it silently push the day forward.
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);

  return {
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: WEEKDAY_INDEX[parts.weekday],
    minutesSinceMidnight: hour * 60 + minute,
  };
}

function toMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(':').map(Number);
  return hour * 60 + minute;
}

/**
 * Internal Market Sessions Table implementation
 * (28_LIVE_DATA_BLUEPRINT.md Addendum §A2; Architecture Team decision,
 * L1-002, 2026-07-16): the approved primary -- and, for this Sprint, only
 * -- source of truth. External providers are not called for runtime
 * lookups; see `market-session-config.ts` for the maintained table.
 */
@Injectable()
export class InternalMarketSessionProvider implements MarketSessionProvider {
  readonly name = 'internal-market-session-table';

  async getMarketStatus(exchangeCode: string, at: Date = new Date()): Promise<MarketStatus> {
    const config = MARKET_SESSION_CONFIG[exchangeCode];
    if (!config) {
      return 'UNKNOWN';
    }

    const local = toLocalParts(at, config.timezone);

    if (config.holidays.includes(local.isoDate)) {
      return 'CLOSED';
    }
    if (!config.weekdays.includes(local.weekday)) {
      return 'CLOSED';
    }

    const openMinutes = toMinutes(config.openTime);
    const closeMinutes = toMinutes(config.closeTime);
    return local.minutesSinceMidnight >= openMinutes && local.minutesSinceMidnight < closeMinutes ? 'OPEN' : 'CLOSED';
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    return 'UP';
  }
}
