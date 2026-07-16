import { Injectable } from '@nestjs/common';
import type { CotProvider, CotTraderCategory, ProviderCotReport } from './cot-provider.interface';

// Deterministic pseudo-random generator (mulberry32), the same technique
// SimulatedMarketDataProvider/SimulatedCalendarNewsProvider already use
// (ADR-003) -- reproducible reports for a given symbol+week instead of
// genuinely random.
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const REPORT_WEEKS = 8;
const CATEGORIES: readonly CotTraderCategory[] = ['COMMERCIAL', 'NON_COMMERCIAL', 'NON_REPORTABLE'];
const BASE_OPEN_INTEREST: Record<CotTraderCategory, number> = {
  COMMERCIAL: 60_000,
  NON_COMMERCIAL: 40_000,
  NON_REPORTABLE: 10_000,
};

/** The Tuesday closing out the ISO week containing `date` -- the real CFTC report's own "as of" convention. */
function reportTuesdayForWeek(weekStart: Date): Date {
  const day = weekStart.getUTCDay();
  const daysToTuesday = (2 - day + 7) % 7;
  return new Date(weekStart.getTime() + daysToTuesday * 24 * 60 * 60 * 1000);
}

@Injectable()
export class SimulatedCotProvider implements CotProvider {
  readonly name = 'simulated';

  async getLatestReports(symbol: string): Promise<ProviderCotReport[]> {
    const now = new Date();
    const currentWeekStart = new Date(now.getTime() - (now.getTime() % WEEK_MS));
    const reports: ProviderCotReport[] = [];

    for (let weeksAgo = REPORT_WEEKS - 1; weeksAgo >= 0; weeksAgo--) {
      const weekStart = new Date(currentWeekStart.getTime() - weeksAgo * WEEK_MS);
      const reportDate = reportTuesdayForWeek(weekStart);
      const weekKey = weekStart.toISOString().slice(0, 10);

      for (const category of CATEGORIES) {
        const rand = mulberry32(hashSeed(`${symbol}:cot:${category}:${weekKey}`));
        const base = BASE_OPEN_INTEREST[category];
        const longPositions = Math.round(base * (0.9 + rand() * 0.3));
        const shortPositions = Math.round(base * (0.9 + rand() * 0.3));
        reports.push({ reportDate, category, longPositions, shortPositions });
      }
    }

    return reports;
  }
}
