import type { Prisma } from '@zenith/database';
import type { ComputationMetadata } from '../common/computation-metadata.util';

export type SwingType = 'HIGH' | 'LOW';
export type SwingClassification = 'HH' | 'LH' | 'HL' | 'LL' | null;
export type TrendDirection = 'UP' | 'DOWN' | 'UNKNOWN';
export type StructureEventType = 'BOS' | 'CHoCH';
export type StructureEventDirection = 'BULLISH' | 'BEARISH';

export interface Swing {
  readonly timestamp: Date;
  readonly type: SwingType;
  readonly price: Prisma.Decimal;
  /** `null` only for the first swing of its type (no prior swing to compare against). */
  readonly classification: SwingClassification;
}

export interface StructureEvent {
  readonly timestamp: Date;
  readonly type: StructureEventType;
  readonly direction: StructureEventDirection;
  readonly trendBefore: TrendDirection;
  readonly trendAfter: TrendDirection;
  readonly swing: Swing;
}

export interface SwingDetectionParams {
  readonly sensitivity: number;
}

export interface SwingDetectionResult {
  readonly sensitivity: number;
  readonly swings: readonly Swing[];
  readonly structureEvents: readonly StructureEvent[];
  readonly currentTrend: TrendDirection;
  readonly metadata: ComputationMetadata;
}
