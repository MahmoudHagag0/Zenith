import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const registerSchema = z.object({
  email: z.string().email().max(254, 'Email must be at most 254 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(254, 'Email must be at most 254 characters'),
  password: z.string().min(1, 'Password is required').max(128, 'Password must be at most 128 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Trading Catalog & Watchlist validation — S1-003 (see Sprint Brief Scope items 4).

export const createExchangeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20, 'Code must be at most 20 characters')
    .toUpperCase(),
});

export type CreateExchangeInput = z.infer<typeof createExchangeSchema>;

export const updateExchangeSchema = createExchangeSchema.partial();

export type UpdateExchangeInput = z.infer<typeof updateExchangeSchema>;

export const marketTypeSchema = z.enum(['EQUITY', 'CRYPTO', 'FOREX', 'COMMODITY']);

export const createMarketSchema = z.object({
  exchangeId: z.string().uuid('exchangeId must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  type: marketTypeSchema,
});

export type CreateMarketInput = z.infer<typeof createMarketSchema>;

export const updateMarketSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters').optional(),
  type: marketTypeSchema.optional(),
});

export type UpdateMarketInput = z.infer<typeof updateMarketSchema>;

export const createAssetSchema = z.object({
  marketId: z.string().uuid('marketId must be a valid UUID'),
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be at most 20 characters')
    .toUpperCase(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Symbol is required')
    .max(20, 'Symbol must be at most 20 characters')
    .toUpperCase()
    .optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters').optional(),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const createWatchlistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
});

export type CreateWatchlistInput = z.infer<typeof createWatchlistSchema>;

export const updateWatchlistSchema = createWatchlistSchema;

export type UpdateWatchlistInput = z.infer<typeof updateWatchlistSchema>;

export const addWatchlistItemSchema = z.object({
  assetId: z.string().uuid('assetId must be a valid UUID'),
});

export type AddWatchlistItemInput = z.infer<typeof addWatchlistItemSchema>;

export const createFavouriteAssetSchema = z.object({
  assetId: z.string().uuid('assetId must be a valid UUID'),
});

export type CreateFavouriteAssetInput = z.infer<typeof createFavouriteAssetSchema>;

// Portfolio & Position validation — S1-004 (see Sprint Brief Scope item 8).

export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
});

export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;

export const updatePortfolioSchema = createPortfolioSchema;

export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;

const positiveFinanceNumber = (label: string) =>
  z
    .number()
    .finite(`${label} must be a finite number`)
    .positive(`${label} must be greater than zero`)
    .max(1_000_000_000_000, `${label} is too large`);

export const buySchema = z.object({
  assetId: z.string().uuid('assetId must be a valid UUID'),
  quantity: positiveFinanceNumber('quantity'),
  price: positiveFinanceNumber('price'),
  executedAt: z.string().datetime('executedAt must be an ISO 8601 datetime').optional(),
});

export type BuyInput = z.infer<typeof buySchema>;

export const sellSchema = buySchema;

export type SellInput = z.infer<typeof sellSchema>;

// Market Data validation — S1-005 (see Sprint Brief Scope item 14).

export const searchAssetsQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(100, 'q must be at most 100 characters'),
});

export type SearchAssetsQueryInput = z.infer<typeof searchAssetsQuerySchema>;

// Trading Journal validation — S1-029 (Phase 1 of the post-S1-024 roadmap).

export const createJournalEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters'),
  content: z.string().min(1, 'Content is required').max(10_000, 'Content must be at most 10000 characters'),
  tags: z.array(z.string().min(1).max(50)).max(20, 'At most 20 tags are allowed').default([]),
  transactionId: z.string().uuid('transactionId must be a valid UUID').optional(),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;

export const updateJournalEntrySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters').optional(),
  content: z.string().min(1, 'Content is required').max(10_000, 'Content must be at most 10000 characters').optional(),
  tags: z.array(z.string().min(1).max(50)).max(20, 'At most 20 tags are allowed').optional(),
  transactionId: z.string().uuid('transactionId must be a valid UUID').nullable().optional(),
});

export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;

// Alerts validation — S1-030 (Phase 2 of the post-S1-024 roadmap).

export const alertConditionTypeSchema = z.enum(['DIRECTION_BULLISH', 'DIRECTION_BEARISH', 'PRICE_ABOVE', 'PRICE_BELOW']);

export const createAlertSchema = z
  .object({
    assetId: z.string().uuid('assetId must be a valid UUID'),
    conditionType: alertConditionTypeSchema,
    targetPrice: positiveFinanceNumber('targetPrice').optional(),
  })
  .refine((value) => (value.conditionType === 'PRICE_ABOVE' || value.conditionType === 'PRICE_BELOW' ? value.targetPrice !== undefined : true), {
    message: 'targetPrice is required for PRICE_ABOVE/PRICE_BELOW conditions',
    path: ['targetPrice'],
  });

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

export const candlesQuerySchema = z
  .object({
    from: z.string().datetime('from must be an ISO 8601 datetime'),
    to: z.string().datetime('to must be an ISO 8601 datetime'),
  })
  .refine((value) => new Date(value.from).getTime() <= new Date(value.to).getTime(), {
    message: 'from must not be after to',
    path: ['from'],
  });

export type CandlesQueryInput = z.infer<typeof candlesQuerySchema>;
