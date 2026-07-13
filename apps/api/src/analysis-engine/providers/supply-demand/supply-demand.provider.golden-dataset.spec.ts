import { Test, TestingModule } from '@nestjs/testing';
import { SupplyDemandProvider } from './supply-demand.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildRegimeResult, buildSeries, candle } from './supply-demand-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-016 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 14): unlike other
 * registered methodologies, each of which already discloses its own
 * reliance (in its own respective sprint) on a single, individually-
 * authored canonical text, Supply & Demand has no single canonical
 * primary text — it is taught across many decentralized, independently-
 * authored retail-trading sources (Sam Seiden and the "Online Trading
 * Academy" curriculum, among many others), with genuine terminology
 * variance but unusually high cross-source agreement on the core
 * concepts themselves: a tight consolidation ("base") immediately before
 * a strong, impulsive move away leaves behind a zone; an untested zone
 * is stronger than a repeatedly-tested one; a decisive close through the
 * zone's own far edge fully invalidates ("mitigates") it. These two
 * tests reproduce those widely-taught qualitative instances end-to-end,
 * not a specific numbered figure from any one text.
 */
describe('SupplyDemandProvider golden-dataset conformance (S1-016 WP12)', () => {
  it('reproduces the canonical fresh, unmitigated demand-zone instance: a tight base after a drop, followed by a strong rally away, never since retested', async () => {
    // Preceding candle (day 0): a drop into the base -- DROP_BASE_RALLY, a reversal-origin demand zone.
    // Base (day 1): a single tight, indecisive candle -- the consolidation institutional buying left behind.
    // Departure (day 2): a strong, impulsive rally away -- the base's own upper/lower extremes become the zone's proximal/distal lines.
    // Day 3 (current price): price has continued higher, never returning to test the zone -- FRESH/UNMITIGATED.
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }),
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
      candle(3, { open: 112, high: 120, low: 111.5, close: 119 }),
    ];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyDemandProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrResult(points, 2)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('UP', 'TRENDING')) } },
      ],
    }).compile();
    const provider = module.get(SupplyDemandProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('[TYPE:DEMAND]');
    expect(result.interpretation[0].summary).toContain('[FRESHNESS:FRESH]');
    expect(result.interpretation[0].summary).toContain('[MITIGATION:UNMITIGATED]');
    expect(result.interpretation[0].summary).toContain('DROP_BASE_RALLY');
    expect(result.interpretation[0].summary).toContain('strongest currently-surviving interpretation');
    expect(result.interpretation[0].summary).toContain('invalidate');

    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.interpretation[0].confidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.methodologyConfidenceCeiling.explanation.length).toBeGreaterThan(0);
    expect(result.evidence.detectedConditions.length).toBeGreaterThan(0);
    expect(result.traceability.intermediateCalculations.length).toBe(2);
  });

  it('reproduces the canonical fully-mitigated (failed) supply-zone instance: a tight base after a rally, followed by a strong drop away, later decisively closed back through', async () => {
    // Preceding candle (day 0): a rally into the base -- RALLY_BASE_DROP, a reversal-origin supply zone.
    // Base (day 1): a single tight, indecisive candle.
    // Departure (day 2): a strong, impulsive drop away -- proximal (base low) / distal (base high).
    // Day 3: price rallies back and closes decisively beyond the distal line -- FULLY_MITIGATED, a zone that has already failed.
    const points = [
      candle(0, { open: 100, high: 105.5, low: 99.5, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104.8, close: 105.4 }),
      candle(2, { open: 105.4, high: 106, low: 97, close: 98 }),
      candle(3, { open: 98, high: 108, low: 97.5, close: 107 }),
    ];
    const series = buildSeries(points);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyDemandProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: jest.fn().mockReturnValue(buildAtrResult(points, 2)) } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: jest.fn().mockReturnValue(buildRegimeResult('UP', 'RANGING')) } },
      ],
    }).compile();
    const provider = module.get(SupplyDemandProvider);

    const result = await provider.analyze(series);

    expect(result.interpretation[0].summary).toContain('[TYPE:SUPPLY]');
    expect(result.interpretation[0].summary).toContain('[FRESHNESS:TESTED_ONCE]');
    expect(result.interpretation[0].summary).toContain('[MITIGATION:FULLY_MITIGATED]');
    expect(result.interpretation[0].summary).toContain('RALLY_BASE_DROP');
    expect(result.interpretation[0].summary).toContain('failing');
    expect(result.interpretation[0].summary).toContain('invalidate');

    // A zone that has already failed once reads at a materially lower Interpretation Confidence than a fresh one.
    expect(result.interpretation[0].confidence.value.toNumber()).toBeLessThan(result.detectionConfidence.value.toNumber());
    expect(result.traceability.intermediateCalculations.length).toBe(2);
  });
});
