import { Prisma } from '@zenith/database';
import { applyElliottRules } from './elliott-wave-rules.util';
import type { ImpulseWaveLeg, WaveDirection } from './elliott-wave.types';
import type { RawWaveCandidate } from './elliott-wave-candidate-generator.util';

function leg(waveNumber: 1 | 2 | 3 | 4 | 5, startPrice: number, endPrice: number): ImpulseWaveLeg {
  return {
    waveNumber,
    startTimestamp: new Date(Date.UTC(2026, 0, waveNumber)),
    startPrice: new Prisma.Decimal(startPrice),
    endTimestamp: new Date(Date.UTC(2026, 0, waveNumber + 1)),
    endPrice: new Prisma.Decimal(endPrice),
  };
}

function candidate(direction: WaveDirection, legs: ImpulseWaveLeg[]): RawWaveCandidate {
  return { direction, legs };
}

describe('applyElliottRules (WP3)', () => {
  it('discards a candidate violating Rule 1 (Wave 2 retraces more than 100% of Wave 1)', () => {
    const c = candidate('BULLISH', [leg(1, 100, 120), leg(2, 120, 95), leg(3, 95, 140), leg(4, 140, 115), leg(5, 115, 160)]);
    expect(applyElliottRules(c)).toBeNull();
  });

  it('discards a candidate violating Rule 2 (Wave 3 is the shortest of Waves 1, 3, 5)', () => {
    const c = candidate('BULLISH', [leg(1, 100, 120), leg(2, 120, 110), leg(3, 110, 115), leg(4, 115, 112), leg(5, 112, 142)]);
    expect(applyElliottRules(c)).toBeNull();
  });

  it('discards a candidate violating Rule 3 (Wave 4 enters Wave 1 price territory)', () => {
    const c = candidate('BULLISH', [leg(1, 100, 120), leg(2, 120, 110), leg(3, 110, 150), leg(4, 150, 115), leg(5, 115, 145)]);
    expect(applyElliottRules(c)).toBeNull();
  });

  it('survives when all three Rules are satisfied, and discloses the correct invalidation level and rule margins', () => {
    const c = candidate('BULLISH', [leg(1, 100, 120), leg(2, 120, 108), leg(3, 108, 150), leg(4, 150, 130), leg(5, 130, 160)]);

    const result = applyElliottRules(c);

    expect(result).not.toBeNull();
    expect(result!.invalidation.level).toEqual(new Prisma.Decimal(120));
    expect(result!.invalidation.rule).toBe('RULE_3');
    expect(result!.ruleMargins.rule1).toBeCloseTo(40, 0);
    expect(result!.ruleMargins.rule2).toBe(100);
    expect(result!.ruleMargins.rule3).toBeCloseTo(23.8, 0);
  });

  it('survives a symmetric Bearish candidate, with the invalidation level still Wave 1s own endpoint', () => {
    const c = candidate('BEARISH', [leg(1, 120, 100), leg(2, 100, 112), leg(3, 112, 70), leg(4, 70, 90), leg(5, 90, 60)]);

    const result = applyElliottRules(c);

    expect(result).not.toBeNull();
    expect(result!.invalidation.level).toEqual(new Prisma.Decimal(100));
    expect(result!.invalidation.description).toContain('above');
  });
});
