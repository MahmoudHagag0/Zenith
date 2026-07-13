import { Injectable } from '@nestjs/common';
import type { ConfluenceWeightStrategy } from './confluence.types';

/**
 * The only `ConfluenceWeightStrategy` implementation this phase (ADR-007;
 * S1-012 Sprint Brief, Scope item 5): weight `1.0` for every Provider,
 * regardless of `methodologyFamily`. A future data-driven strategy
 * requires historical validation data this sprint does not have, and its
 * own superseding/additional Decision Log entry — this interface exists
 * precisely so that future strategy needs no Provider or Confluence
 * Engine contract change.
 */
@Injectable()
export class EqualWeightStrategy implements ConfluenceWeightStrategy {
  computeWeight(_providerId: string, _methodologyFamily: string | undefined): { weight: number; weightExplanation: string } {
    return { weight: 1.0, weightExplanation: 'equal weighting, no differential weighting strategy active yet' };
  }
}
