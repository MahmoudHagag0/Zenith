import type { Prisma } from '@zenith/database';
import type { ComputationMetadata } from '../common/computation-metadata.util';
import type { TrendDirection } from '../swing-detection/swing-detection.types';

export type TrendState = 'TRENDING' | 'RANGING';
export type VolatilityState = 'HIGH' | 'LOW';

export interface RegimeContextParams {
  readonly adxPeriod: number;
  readonly atrPeriod: number;
  readonly swingSensitivity: number;
  /** Disclosed, never silently defaulted — see Known Limitations (pending Decision Log calibration). */
  readonly adxTrendingThreshold: number;
  /** Disclosed, never silently defaulted — see Known Limitations (pending Decision Log calibration). */
  readonly volatilityMultiplier: number;
}

export interface RegimeContextResult {
  readonly trendState: TrendState;
  readonly trendDirection: TrendDirection;
  readonly volatilityState: VolatilityState;
  readonly adx: Prisma.Decimal;
  readonly atr: Prisma.Decimal;
  readonly atrBaseline: Prisma.Decimal;
  readonly metadata: ComputationMetadata;
}
