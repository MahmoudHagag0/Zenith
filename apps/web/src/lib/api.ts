/**
 * S1-021 Developer Preview -- minimal server-side client for the existing
 * Zenith API. No new backend logic: every function here is a thin fetch
 * wrapper around an already-built, already-tested endpoint
 * (`POST /auth/login`, `POST /auth/register`, `GET /dashboard/decision-center`,
 * `GET /morning-brief`). All calls happen server-side (Route Handlers /
 * Server Components), so no CORS configuration or other change to
 * `apps/api` is required -- the backend is consumed exactly as it exists
 * today.
 *
 * Types below are the minimal subset of each response this preview
 * renders, mirroring the JSON shape `apps/api` already returns (a
 * `Prisma.Decimal` serializes to a string over HTTP, hence `value: string`
 * below) -- not a shared package, since introducing one would be new
 * architecture this Sprint's own Mission forbids.
 */

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Nest's default error body is JSON (`{ message, error, statusCode }`); surfaces the human-readable `message` when present, falling back to the raw body for non-JSON errors. */
async function throwApiError(response: Response): Promise<never> {
  const body = await response.text();
  let message = body || response.statusText;
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (typeof parsed.message === 'string') message = parsed.message;
  } catch {
    // Not JSON -- use the raw body as-is.
  }
  throw new ApiError(response.status, message);
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    await throwApiError(response);
  }
  return response.json() as Promise<T>;
}

/** For endpoints with no response body (e.g. DELETE) -- `apiFetch` would fail parsing an empty body as JSON. */
async function apiFetchVoid(path: string, init?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    await throwApiError(response);
  }
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export async function login(email: string, password: string): Promise<{ accessToken: string }> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function register(email: string, password: string): Promise<{ accessToken: string }> {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
}

// ---- Dashboard (S1-019) ----

export interface LabeledConfidenceView {
  readonly kind: 'DETECTION' | 'INTERPRETATION' | 'REGIME_ADJUSTED' | 'METHODOLOGY_CEILING';
  readonly value: string;
  readonly explanation: string;
}

export interface FailedInstrument {
  readonly assetId: string;
  readonly reason: string;
}

export type DecisionCenterReadiness = 'OPPORTUNITIES_AVAILABLE' | 'NO_CLEAR_OPPORTUNITY' | 'DEGRADED';

/** Subset of `UncertaintyView` (S1-019) actually rendered by any screen -- see `dashboard.types.ts` for the full shape already sent over HTTP. */
export interface UncertaintyView {
  readonly dataQuality: 'COMPLETE' | 'GAPS_PRESENT' | 'MISSING';
  readonly notes: readonly string[];
}

/** Subset of `ContributingProviderView` (S1-019) actually rendered -- the full shape (detection/regime/ceiling confidence, traceability) already exists on the wire but is not needed by any current screen. */
export interface ContributingProviderView {
  readonly providerId: string;
  readonly methodologyFamily?: string;
  readonly interpretationSummary: string;
  readonly interpretationConfidence: LabeledConfidenceView;
  readonly uncertainty: UncertaintyView;
}

/** Subset of `InstrumentReading` (S1-019) -- already embedded on every `RankedOpportunity` by the existing `GET /dashboard/decision-center` response; no backend change was needed to read it. */
export interface InstrumentReadingView {
  readonly topContributors: readonly ContributingProviderView[];
  readonly disagreementDimensions: readonly string[];
}

export interface RankedOpportunity {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
  readonly netDirection: 'BULLISH' | 'BEARISH';
  readonly agreeingDimensions: number;
  readonly disagreementPresent: boolean;
  readonly reading: InstrumentReadingView;
}

export interface DecisionCenterResponse {
  readonly readiness: DecisionCenterReadiness;
  readonly generatedAt: string;
  readonly instrumentsConsidered: number;
  readonly instrumentsFailed: readonly FailedInstrument[];
  readonly opportunities: readonly RankedOpportunity[];
}

export function getDecisionCenter(token: string): Promise<DecisionCenterResponse> {
  return apiFetch('/dashboard/decision-center', { headers: { Authorization: `Bearer ${token}` } });
}

// ---- Morning Brief (S1-020) ----

export interface MorningBriefEntry {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
  readonly netDirection: 'BULLISH' | 'BEARISH';
  readonly story: string;
  readonly why: string;
  readonly confidenceExplanation: string;
  readonly uncertaintyExplanation: string;
  readonly disagreementPresent: boolean;
}

export interface MorningBriefResponse {
  readonly generatedAt: string;
  readonly readiness: DecisionCenterReadiness;
  readonly headline: string;
  readonly entries: readonly MorningBriefEntry[];
  readonly noTradeNarrative?: string;
  readonly instrumentsConsidered: number;
  readonly instrumentsFailed: readonly FailedInstrument[];
}

export function getMorningBrief(token: string): Promise<MorningBriefResponse> {
  return apiFetch('/morning-brief', { headers: { Authorization: `Bearer ${token}` } });
}

// ---- Watchlists (S1-003) ----

export interface WatchlistSummary {
  readonly id: string;
  readonly name: string;
}

export interface WatchlistItemView {
  readonly assetId: string;
  readonly asset: { readonly id: string; readonly symbol: string; readonly name: string };
}

export function getWatchlists(token: string): Promise<WatchlistSummary[]> {
  return apiFetch('/watchlists', { headers: authHeader(token) });
}

export function getWatchlistItems(token: string, watchlistId: string): Promise<WatchlistItemView[]> {
  return apiFetch(`/watchlists/${watchlistId}/items`, { headers: authHeader(token) });
}

export function createWatchlist(token: string, name: string): Promise<WatchlistSummary> {
  return apiFetch('/watchlists', { method: 'POST', headers: authHeader(token), body: JSON.stringify({ name }) });
}

export function addWatchlistItem(token: string, watchlistId: string, assetId: string): Promise<unknown> {
  return apiFetch(`/watchlists/${watchlistId}/items`, { method: 'POST', headers: authHeader(token), body: JSON.stringify({ assetId }) });
}

export function removeWatchlistItem(token: string, watchlistId: string, assetId: string): Promise<void> {
  return apiFetchVoid(`/watchlists/${watchlistId}/items/${assetId}`, { method: 'DELETE', headers: authHeader(token) });
}

// ---- Market Data search (S1-005), reused for "add by symbol" ----

export interface AssetSearchResult {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
}

export function searchAssets(token: string, query: string): Promise<AssetSearchResult[]> {
  return apiFetch(`/market-data/search?q=${encodeURIComponent(query)}`, { headers: authHeader(token) });
}

// ---- Portfolios (S1-004) + Analytics (S1-006) ----

export interface PortfolioSummary {
  readonly id: string;
  readonly name: string;
}

export function getPortfolios(token: string): Promise<PortfolioSummary[]> {
  return apiFetch('/portfolios', { headers: authHeader(token) });
}

export function createPortfolio(token: string, name: string): Promise<PortfolioSummary> {
  return apiFetch('/portfolios', { method: 'POST', headers: authHeader(token), body: JSON.stringify({ name }) });
}

export interface PositionAnalyticsView {
  readonly positionId: string;
  readonly assetId: string;
  readonly symbol: string;
  readonly name: string;
  readonly quantity: string;
  readonly averageCost: string;
  readonly currentPrice: string | null;
  readonly marketValue: string | null;
  readonly unrealizedPnl: string | null;
  readonly unrealizedPnlPercent: string | null;
  readonly portfolioWeight: string | null;
  readonly dataQuality: { readonly dataStatus: string; readonly freshness: 'FRESH' | 'STALE' | 'MISSING' };
}

export interface PortfolioAnalyticsView {
  readonly portfolioId: string;
  readonly generatedAt: string;
  readonly summary: {
    readonly totalMarketValue: string;
    readonly totalUnrealizedPnl: string;
    readonly totalRealizedPnl: string;
    readonly combinedPnl: string;
    readonly unrealizedPercent: string | null;
  };
  readonly positions: readonly PositionAnalyticsView[];
  readonly portfolioHealth: { readonly score: number; readonly reasoning: string; readonly contributingFactors: readonly string[] };
  readonly decisionReadiness: { readonly status: 'READY_FOR_ANALYSIS' | 'ANALYSIS_LIMITED'; readonly reasoning: string };
  readonly dataQuality: { readonly dataStatus: string; readonly freshness: 'FRESH' | 'STALE' | 'MISSING' };
  readonly humanSummary: string;
}

export function getPortfolioAnalytics(token: string, portfolioId: string): Promise<PortfolioAnalyticsView> {
  return apiFetch(`/portfolios/${portfolioId}/analytics`, { headers: authHeader(token) });
}

export interface TransactionView {
  readonly id: string;
  readonly positionId: string;
  readonly type: 'BUY' | 'SELL';
  readonly quantity: string;
  readonly price: string;
  readonly executedAt: string;
}

export function getPositionTransactions(token: string, portfolioId: string, positionId: string): Promise<TransactionView[]> {
  return apiFetch(`/portfolios/${portfolioId}/positions/${positionId}/transactions`, { headers: authHeader(token) });
}

// ---- Trading Journal (S1-029) ----

export interface JournalEntryView {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly transactionId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateJournalEntryPayload {
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly transactionId?: string;
}

export function getJournalEntries(token: string): Promise<JournalEntryView[]> {
  return apiFetch('/journal', { headers: authHeader(token) });
}

export function createJournalEntry(token: string, payload: CreateJournalEntryPayload): Promise<JournalEntryView> {
  return apiFetch('/journal', { method: 'POST', headers: authHeader(token), body: JSON.stringify(payload) });
}

export function deleteJournalEntry(token: string, id: string): Promise<void> {
  return apiFetchVoid(`/journal/${id}`, { method: 'DELETE', headers: authHeader(token) });
}
