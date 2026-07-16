export type CotTraderCategory = 'COMMERCIAL' | 'NON_COMMERCIAL' | 'NON_REPORTABLE';

export interface ProviderCotReport {
  reportDate: Date;
  category: CotTraderCategory;
  longPositions: number;
  shortPositions: number;
}

/**
 * Every consumer of COT data depends on this interface only (mirroring
 * ADR-003/CalendarNewsProvider) -- never on a concrete provider. As of
 * S1-032 the only registered implementation is SimulatedCotProvider; a
 * future real vendor (e.g. the CFTC's own weekly release) requires only a
 * new implementation and module registration, no change to any consumer.
 */
export interface CotProvider {
  readonly name: string;
  getLatestReports(symbol: string): Promise<ProviderCotReport[]>;
}

export const COT_PROVIDER = 'COT_PROVIDER';
