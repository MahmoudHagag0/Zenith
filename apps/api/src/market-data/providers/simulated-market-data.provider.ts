import { Injectable } from '@nestjs/common';
import type {
  MarketDataProvider,
  ProviderCandle,
  ProviderHealthStatus,
  ProviderQuote,
} from './market-data-provider.interface';

// Deterministic pseudo-random generator (mulberry32) so quotes/candles are
// stable for a given seed instead of genuinely random — see ADR-003: this
// provider is a simulated foundation, not a source of real market prices.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

const QUOTE_BUCKET_MS = 10_000;

@Injectable()
export class SimulatedMarketDataProvider implements MarketDataProvider {
  readonly name = 'simulated';

  async getQuote(symbol: string): Promise<ProviderQuote> {
    const now = new Date();
    const bucket = Math.floor(now.getTime() / QUOTE_BUCKET_MS);
    const rand = mulberry32(hashSeed(`${symbol}:${bucket}`));
    const basePrice = 10 + (hashSeed(symbol) % 990);
    const wave = (rand() - 0.5) * 0.02;
    const price = Math.max(0.01, basePrice * (1 + wave));
    return { symbol, price: round2(price), currency: 'USD', asOf: now };
  }

  async getCandles(symbol: string, from: Date, to: Date): Promise<ProviderCandle[]> {
    const candles: ProviderCandle[] = [];
    const basePrice = 10 + (hashSeed(symbol) % 990);
    const end = startOfUtcDay(to);
    for (let day = startOfUtcDay(from); day.getTime() <= end.getTime(); day = addUtcDays(day, 1)) {
      const rand = mulberry32(hashSeed(`${symbol}:${day.toISOString().slice(0, 10)}`));
      const open = basePrice * (1 + (rand() - 0.5) * 0.03);
      const close = open * (1 + (rand() - 0.5) * 0.03);
      const high = Math.max(open, close) * (1 + rand() * 0.01);
      const low = Math.min(open, close) * (1 - rand() * 0.01);
      const volume = 1_000 + Math.floor(rand() * 100_000);
      candles.push({
        date: day,
        open: round2(open),
        high: round2(high),
        low: round2(low),
        close: round2(close),
        volume,
      });
    }
    return candles;
  }

  async checkHealth(): Promise<ProviderHealthStatus> {
    return 'UP';
  }
}
