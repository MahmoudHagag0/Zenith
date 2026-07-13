import { deriveDisplacementLegs } from './ict-smc-displacement.util';
import { bosEvent, buildSwingResult, point, swing } from './ict-smc-test-fixtures';

function flatPoints(count: number) {
  return Array.from({ length: count }, (_, i) => point(i, { open: 100, high: 100, low: 100, close: 100 }));
}

describe('deriveDisplacementLegs (WP2)', () => {
  it('derives a Bullish DisplacementLeg from a BOS event, anchored at the most recent prior swing low', () => {
    const points = flatPoints(6);
    const launchLow = swing('LOW', 90, 1);
    const breakingHigh = swing('HIGH', 110, 4);
    const swingResult = buildSwingResult([launchLow, breakingHigh], [bosEvent('BULLISH', breakingHigh)]);

    const legs = deriveDisplacementLegs(points, swingResult);

    expect(legs).toHaveLength(1);
    expect(legs[0].direction).toBe('BULLISH');
    expect(legs[0].startTimestamp).toEqual(launchLow.timestamp);
    expect(legs[0].structureEventTimestamp).toEqual(breakingHigh.timestamp);
    expect(legs[0].startIndex).toBe(1);
    expect(legs[0].endIndex).toBe(4);
  });

  it('derives a Bearish DisplacementLeg from a BOS event, anchored at the most recent prior swing high', () => {
    const points = flatPoints(6);
    const launchHigh = swing('HIGH', 110, 1);
    const breakingLow = swing('LOW', 90, 4);
    const swingResult = buildSwingResult([launchHigh, breakingLow], [bosEvent('BEARISH', breakingLow)]);

    const legs = deriveDisplacementLegs(points, swingResult);

    expect(legs).toHaveLength(1);
    expect(legs[0].direction).toBe('BEARISH');
    expect(legs[0].startTimestamp).toEqual(launchHigh.timestamp);
  });

  it('produces an empty array when there are no structure events', () => {
    const points = flatPoints(6);
    const swingResult = buildSwingResult([], []);

    expect(deriveDisplacementLegs(points, swingResult)).toEqual([]);
  });

  it('skips a BOS event with no prior opposite-type swing (nothing to anchor a leg to)', () => {
    const points = flatPoints(6);
    const breakingHigh = swing('HIGH', 110, 4);
    const swingResult = buildSwingResult([breakingHigh], [bosEvent('BULLISH', breakingHigh)]);

    expect(deriveDisplacementLegs(points, swingResult)).toEqual([]);
  });

  it('is composed entirely from the supplied swings/structureEvents, never re-deriving structure from raw price shape', () => {
    // Points are perfectly flat -- no real extrema exist in the price data at all.
    // The swingResult fixture nonetheless declares a swing low/high pair, and the
    // leg is still derived correctly, proving this function trusts the Swing
    // Detector's output rather than recomputing extrema from `points` itself.
    const points = flatPoints(6);
    const launchLow = swing('LOW', 100, 1);
    const breakingHigh = swing('HIGH', 100, 4);
    const swingResult = buildSwingResult([launchLow, breakingHigh], [bosEvent('BULLISH', breakingHigh)]);

    expect(deriveDisplacementLegs(points, swingResult)).toHaveLength(1);
  });
});
