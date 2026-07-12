import { Prisma } from '@zenith/database';
import type { ComputationMetadata } from '../common/computation-metadata.util';
import type { MarketSeriesPoint } from '../market-series/market-series.types';

export interface IndicatorSeriesEntry<V> {
  readonly timestamp: Date;
  readonly value: V;
}

export interface ComputationOutput<V> {
  readonly series: readonly IndicatorSeriesEntry<V>[];
  readonly metadata: ComputationMetadata;
}

/** A single calculator in the Indicator Engine's internal registry. */
export interface IndicatorCalculator<TParams, TValue> {
  readonly name: string;
  compute(points: readonly MarketSeriesPoint[], params: TParams): ComputationOutput<TValue>;
}

export interface SmaParams {
  readonly period: number;
}

export interface EmaParams {
  readonly period: number;
}

export interface RsiParams {
  readonly period: number;
}

export interface MacdParams {
  readonly fastPeriod: number;
  readonly slowPeriod: number;
  readonly signalPeriod: number;
}

export interface MacdValue {
  readonly line: Prisma.Decimal;
  readonly signal: Prisma.Decimal;
  readonly histogram: Prisma.Decimal;
}

export interface BollingerBandsParams {
  readonly period: number;
  readonly stdDevMultiplier: number;
}

export interface BollingerBandsValue {
  readonly middle: Prisma.Decimal;
  readonly upper: Prisma.Decimal;
  readonly lower: Prisma.Decimal;
}

export interface AtrParams {
  readonly period: number;
}

export interface AdxParams {
  readonly period: number;
}

export interface AdxValue {
  readonly adx: Prisma.Decimal;
  readonly plusDI: Prisma.Decimal;
  readonly minusDI: Prisma.Decimal;
}

export interface DonchianChannelParams {
  readonly period: number;
}

export interface DonchianChannelValue {
  readonly upper: Prisma.Decimal;
  readonly lower: Prisma.Decimal;
  readonly middle: Prisma.Decimal;
}

export interface FibonacciParams {
  readonly anchorStart: Prisma.Decimal;
  readonly anchorEnd: Prisma.Decimal;
}

/** A single Fibonacci level. `isTrueFibonacciRatio` is false only for 50%. */
export interface FibonacciLevel {
  readonly ratio: number;
  readonly price: Prisma.Decimal;
  readonly isTrueFibonacciRatio: boolean;
}
