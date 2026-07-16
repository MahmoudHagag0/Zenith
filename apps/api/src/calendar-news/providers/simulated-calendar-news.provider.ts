import { Injectable } from '@nestjs/common';
import type {
  CalendarNewsProvider,
  ProviderCalendarEvent,
  ProviderCalendarImportance,
  ProviderNewsCategory,
  ProviderNewsItem,
} from './calendar-news-provider.interface';

// Deterministic pseudo-random generator (mulberry32), the same technique
// SimulatedMarketDataProvider already uses (ADR-003) -- reproducible
// news/events for a given symbol+day instead of genuinely random.
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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

const NEWS_TEMPLATES: ReadonlyArray<{ category: ProviderNewsCategory; headline: (symbol: string) => string; summary: (symbol: string) => string }> = [
  {
    category: 'MARKET',
    headline: (symbol) => `${symbol} moves with broader market sentiment`,
    summary: (symbol) => `${symbol} traded in line with the wider market session, with no company-specific catalyst identified.`,
  },
  {
    category: 'COMPANY',
    headline: (symbol) => `${symbol} issues routine investor update`,
    summary: (symbol) => `${symbol} published a routine update for investors; no material change to guidance was disclosed.`,
  },
  {
    category: 'ECONOMIC',
    headline: () => 'Macro data release affects sector sentiment',
    summary: (symbol) => `A broader macroeconomic data release shifted sentiment across the sector that includes ${symbol}.`,
  },
];

const EVENT_TEMPLATES: ReadonlyArray<{
  category: ProviderNewsCategory;
  importance: ProviderCalendarImportance;
  title: (symbol: string) => string;
  description: (symbol: string) => string;
  daysAhead: number;
}> = [
  {
    category: 'EARNINGS',
    importance: 'HIGH',
    title: (symbol) => `${symbol} Quarterly Earnings`,
    description: (symbol) => `${symbol} is scheduled to report its next quarterly results.`,
    daysAhead: 10,
  },
  {
    category: 'ECONOMIC',
    importance: 'MEDIUM',
    title: () => 'Macro Data Release',
    description: (symbol) => `A scheduled macroeconomic data release relevant to the sector that includes ${symbol}.`,
    daysAhead: 4,
  },
  {
    category: 'COMPANY',
    importance: 'LOW',
    title: (symbol) => `${symbol} Investor Call`,
    description: (symbol) => `${symbol} has a scheduled investor call on the calendar.`,
    daysAhead: 7,
  },
];

@Injectable()
export class SimulatedCalendarNewsProvider implements CalendarNewsProvider {
  readonly name = 'simulated';

  async getNews(symbol: string): Promise<ProviderNewsItem[]> {
    const now = new Date();
    const dayBucket = startOfUtcDay(now).toISOString().slice(0, 10);
    const rand = mulberry32(hashSeed(`${symbol}:news:${dayBucket}`));
    const count = 1 + Math.floor(rand() * 3);
    const items: ProviderNewsItem[] = [];
    for (let i = 0; i < count; i++) {
      const template = NEWS_TEMPLATES[Math.floor(rand() * NEWS_TEMPLATES.length)];
      items.push({
        headline: template.headline(symbol),
        summary: template.summary(symbol),
        category: template.category,
        source: 'Zenith Simulated Wire',
        publishedAt: new Date(now.getTime() - Math.floor(rand() * 6) * 60 * 60 * 1000),
      });
    }
    return items;
  }

  async getUpcomingEvents(symbol: string): Promise<ProviderCalendarEvent[]> {
    const now = new Date();
    const weekBucket = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
    const rand = mulberry32(hashSeed(`${symbol}:events:${weekBucket}`));
    return EVENT_TEMPLATES.map((template) => ({
      title: template.title(symbol),
      category: template.category,
      importance: template.importance,
      description: template.description(symbol),
      scheduledAt: new Date(now.getTime() + (template.daysAhead + Math.floor(rand() * 3)) * 24 * 60 * 60 * 1000),
    }));
  }
}
