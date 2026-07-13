import { readFileSync } from 'fs';
import { join } from 'path';
import { Prisma } from '@zenith/database';
import { classifyWyckoffPhase, MAX_PHASE_HYPOTHESES } from './wyckoff-phase.classifier';
import type { WyckoffEvent, WyckoffEventType, WyckoffSideEvents } from './wyckoff.types';

function event(type: WyckoffEventType): WyckoffEvent {
  return { type, timestamp: new Date(Date.UTC(2026, 0, 1)), price: new Prisma.Decimal(100), description: type };
}

function sideEvents(types: WyckoffEventType[]): WyckoffSideEvents {
  return { side: 'ACCUMULATION', events: types.map(event) };
}

describe('classifyWyckoffPhase (WP5)', () => {
  it('returns no hypotheses when no events were detected', () => {
    expect(classifyWyckoffPhase(sideEvents([]))).toEqual([]);
  });

  it('returns a single Phase A hypothesis after PS alone', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS']));
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('A');
  });

  it('returns a single Phase A hypothesis after SC', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS', 'SC']));
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('A');
  });

  it('returns more than one ranked candidate at the genuinely ambiguous Phase A/B boundary (after AR)', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS', 'SC', 'AR']));
    expect(result.length).toBeGreaterThan(1);
    expect(result.length).toBeLessThanOrEqual(MAX_PHASE_HYPOTHESES);
    expect(result.map((h) => h.phase).sort()).toEqual(['A', 'B']);
  });

  it('returns a single Phase B hypothesis after ST confirms range-testing', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS', 'SC', 'AR', 'ST']));
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('B');
  });

  it('returns more than one ranked candidate at the genuinely ambiguous Phase B/C boundary (after Spring, before Test)', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS', 'SC', 'AR', 'ST', 'SPRING']));
    expect(result.length).toBeGreaterThan(1);
    expect(result.length).toBeLessThanOrEqual(MAX_PHASE_HYPOTHESES);
    expect(result.map((h) => h.phase).sort()).toEqual(['B', 'C']);
  });

  it('returns exactly one candidate once the schematic is unambiguously complete through LPS', () => {
    const result = classifyWyckoffPhase(sideEvents(['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST', 'SOS', 'LPS']));
    expect(result).toHaveLength(1);
    expect(result[0].phase).toBe('D');
    expect(result[0].supportingEvents).toEqual(['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST', 'SOS', 'LPS']);
  });

  it('mirrors the same phase mapping for Distribution event types', () => {
    const types: WyckoffEventType[] = ['PSY', 'BC', 'AR', 'ST', 'UT_UTAD'];
    const distributionEvents: WyckoffSideEvents = { side: 'DISTRIBUTION', events: types.map(event) };
    const result = classifyWyckoffPhase(distributionEvents);
    expect(result.map((h) => h.phase).sort()).toEqual(['B', 'C']);
    expect(result.every((h) => h.side === 'DISTRIBUTION')).toBe(true);
  });

  it('records the Phase-schematic attribution distinctly from Three Laws attribution in its own documentation (Sprint Brief Acceptance Criteria)', () => {
    const source = readFileSync(join(__dirname, 'wyckoff-phase.classifier.ts'), 'utf8');
    expect(source).toMatch(/Wyckoff Method curriculum|Stock Market Institute/);
    expect(source).toMatch(/Three Laws/);
    // Never presented as one undifferentiated "Wyckoff says": the source
    // must explicitly say the two are different, not merely mention both.
    expect(source).toMatch(/distinct from Wyckoff's own (original )?Three Laws/);
  });
});
