import type { MarketSeries } from '../market-series/market-series.types';
import type { ConfluenceResult } from './confluence.types';

/** Every consumer of the Confluence Engine depends on this interface only, never the concrete `ConfluenceService` class (ADR-003/005/006 token-injection precedent). */
export interface ConfluenceEngine {
  computeConfluence(series: MarketSeries): Promise<ConfluenceResult>;
}

export const CONFLUENCE_ENGINE = 'CONFLUENCE_ENGINE';
export const CONFLUENCE_WEIGHT_STRATEGY = 'CONFLUENCE_WEIGHT_STRATEGY';
