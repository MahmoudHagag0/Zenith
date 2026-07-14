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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(response.status, body || response.statusText);
  }
  return response.json() as Promise<T>;
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

export interface RankedOpportunity {
  readonly assetId: string;
  readonly symbol: string;
  readonly marketName: string;
  readonly netDirection: 'BULLISH' | 'BEARISH';
  readonly agreeingDimensions: number;
  readonly disagreementPresent: boolean;
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
