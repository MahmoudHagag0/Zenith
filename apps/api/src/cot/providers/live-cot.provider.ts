import { Injectable } from '@nestjs/common';
import type { CotProvider, ProviderCotReport } from './cot-provider.interface';
import { MarketDataHttpClient } from '../../market-data/providers/http-client';
import { CFTC_CONTRACT_MAPPING } from './cftc-contract-mapping';
import { cftcLegacyReportResponseSchema } from './cot.schemas';
import { normalizeCftcRow } from './cot.normalize';

// CFTC's Socrata Open Data API resource ID for the Legacy Futures-Only
// report -- the report type whose category taxonomy
// (Commercial/Non-Commercial/Non-Reportable) matches the existing
// CotTraderCategory enum (Disaggregated/Financial Futures use different
// categories and are out of this Sprint's scope). Validate this resource
// ID against CFTC's currently published dataset at deployment time --
// Socrata resource IDs are stable but not something this Sprint can
// confirm live (see Sprint Brief Risk #3, environment egress block).
const CFTC_LEGACY_FUTURES_ONLY_RESOURCE = '6dca-aqww';
const BASE_URL = `https://publicreporting.cftc.gov/resource/${CFTC_LEGACY_FUTURES_ONLY_RESOURCE}.json`;
const REPORT_WEEKS = 8;

/**
 * Live COT provider (L1-004, 28_LIVE_DATA_BLUEPRINT.md §9 Phase 4).
 * Implements the existing CotProvider interface in full (S1-032 origin,
 * ADR-003 precedent) -- no interface change, no consumer change. Sources
 * data directly from the CFTC's public Socrata API -- the Blueprint's own
 * "sole COT source" recommendation, so there is no secondary/failover path
 * to implement. Reuses MarketDataHttpClient (L1-001) directly by import,
 * following the same precedent already applied in L1-003.
 *
 * A symbol with no entry in the internal contract mapping table
 * (cftc-contract-mapping.ts) returns an empty report list -- a real,
 * expected outcome (not every tracked asset has a COT-reportable futures
 * contract), never an error.
 */
@Injectable()
export class LiveCotProvider implements CotProvider {
  readonly name = 'cftc';
  private readonly httpClient = new MarketDataHttpClient(this.name);

  constructor(private readonly appToken?: string) {}

  async getLatestReports(symbol: string): Promise<ProviderCotReport[]> {
    const contractCode = CFTC_CONTRACT_MAPPING[symbol];
    if (!contractCode) {
      return [];
    }

    const params = new URLSearchParams({
      $where: `cftc_contract_market_code='${contractCode}'`,
      $order: 'report_date_as_yyyy_mm_dd DESC',
      $limit: String(REPORT_WEEKS),
    });
    if (this.appToken) {
      params.set('$$app_token', this.appToken);
    }

    const raw = await this.httpClient.fetchJson(`${BASE_URL}?${params.toString()}`);
    const parsed = cftcLegacyReportResponseSchema.parse(raw);
    return parsed.flatMap(normalizeCftcRow);
  }
}
