/**
 * Development seed data (S1-026). Populates one demo account with enough
 * real data -- a tracked instrument with real candle history, a watchlist
 * entry, and an open position -- that a freshly-provisioned environment
 * shows a populated Dashboard, Morning Brief, Watchlist, and Portfolio
 * immediately after logging in, with zero manual setup beyond `pnpm dev`.
 *
 * Every number here flows through the real Confluence Engine / Analysis
 * Providers / Analytics Service at request time -- this script only seeds
 * raw candles and account records, never a precomputed reading.
 *
 * Idempotent: if the demo user already exists, the script is a no-op, so
 * it is safe to run on every container start.
 */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@zenith.dev';
const DEMO_PASSWORD = 'DemoPass123!';
const DEMO_SYMBOL = 'ZENDEMO';
const CANDLE_DAYS = 90;
const STARTING_PRICE = 150;
// A steady decline for most of the window, accelerating in the final 15
// days -- reliably yields a real, non-neutral BEARISH Confluence reading
// (verified against the actual nine Analysis Providers) rather than a
// directionless walk that could just as easily net out NEUTRAL.
const DAILY_TREND = -0.35;
const BREAKDOWN_TREND = -0.9;
const BREAKDOWN_WINDOW_DAYS = 15;

// Deterministic pseudo-random generator (mulberry32), the same technique
// `SimulatedMarketDataProvider` already uses (ADR-003) -- reproducible seed
// data instead of a different scenario on every run.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Seed: demo user ${DEMO_EMAIL} already exists, skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });
  const user = await prisma.user.create({ data: { email: DEMO_EMAIL, passwordHash } });

  const exchange = await prisma.exchange.create({ data: { name: 'Zenith Demo Exchange', code: 'ZDX' } });
  const market = await prisma.market.create({ data: { exchangeId: exchange.id, name: 'Zenith Demo Market', type: 'EQUITY' } });
  const asset = await prisma.asset.create({ data: { marketId: market.id, symbol: DEMO_SYMBOL, name: 'Zenith Demo Asset' } });

  const rand = mulberry32(hashSeed(DEMO_SYMBOL));
  const now = new Date();
  let price = STARTING_PRICE;
  const firstPrice = price;
  const candles = [];
  for (let i = CANDLE_DAYS; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const open = price;
    const dayIndex = CANDLE_DAYS - i;
    const trend = dayIndex < CANDLE_DAYS - BREAKDOWN_WINDOW_DAYS ? DAILY_TREND : BREAKDOWN_TREND;
    const noise = (rand() - 0.5) * 1.2;
    const close = Math.max(1, open + trend + noise);
    const high = Math.max(open, close) + rand() * 0.6;
    const low = Math.min(open, close) - rand() * 0.6;
    const volume = 100_000 + Math.round(rand() * 50_000) + (dayIndex > CANDLE_DAYS - BREAKDOWN_WINDOW_DAYS ? 50_000 : 0);
    candles.push({ assetId: asset.id, date, open, high, low, close, volume, provider: 'seed' });
    price = close;
  }
  await prisma.candle.createMany({ data: candles });

  const watchlist = await prisma.watchlist.create({ data: { userId: user.id, name: 'Main' } });
  await prisma.watchlistItem.create({ data: { watchlistId: watchlist.id, assetId: asset.id } });

  const portfolio = await prisma.portfolio.create({ data: { userId: user.id, name: 'Main' } });
  const quantity = 10;
  const position = await prisma.position.create({
    data: { portfolioId: portfolio.id, assetId: asset.id, quantity, averageCost: firstPrice, realizedPnl: 0 },
  });
  const transaction = await prisma.transaction.create({
    data: { positionId: position.id, type: 'BUY', quantity, price: firstPrice, executedAt: new Date(now.getTime() - CANDLE_DAYS * 24 * 60 * 60 * 1000) },
  });

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      transactionId: transaction.id,
      title: `Entered ${DEMO_SYMBOL}`,
      content: 'Opened the position on a pullback into the prior demand zone. Plan is to reassess if the breakdown trend continues.',
      tags: ['setup', 'demo'],
    },
  });

  await prisma.newsItem.create({
    data: {
      assetId: asset.id,
      headline: `${DEMO_SYMBOL} issues routine investor update`,
      summary: `${DEMO_SYMBOL} published a routine update for investors; no material change to guidance was disclosed.`,
      category: 'COMPANY',
      source: 'Zenith Simulated Wire',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
  });

  await prisma.calendarEvent.create({
    data: {
      assetId: asset.id,
      title: `${DEMO_SYMBOL} Quarterly Earnings`,
      category: 'EARNINGS',
      importance: 'HIGH',
      description: `${DEMO_SYMBOL} is scheduled to report its next quarterly results.`,
      scheduledAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Seed: created demo user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) with a tracked instrument (${DEMO_SYMBOL}), a watchlist, an open position, a journal entry, and Calendar/News data.`);
}

function hashSeed(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
