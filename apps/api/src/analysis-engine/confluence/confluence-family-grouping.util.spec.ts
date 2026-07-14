import { groupByFamily } from './confluence-family-grouping.util';

describe('groupByFamily (S1-012 WP8)', () => {
  it('combines two Providers sharing a methodologyFamily into one group, keeping distinct/unfamilied Providers as their own singleton groups', () => {
    const entries = [
      { providerId: 'A', methodologyFamily: 'FAMILY_X' },
      { providerId: 'B', methodologyFamily: 'FAMILY_X' },
      { providerId: 'C', methodologyFamily: 'WYCKOFF' },
      { providerId: 'D', methodologyFamily: undefined },
    ];

    const groups = groupByFamily(entries);

    expect(groups).toHaveLength(3);
    const familyXGroup = groups.find((g) => g.length === 2);
    expect(familyXGroup).toBeDefined();
    expect(familyXGroup!.map((e) => e.providerId).sort()).toEqual(['A', 'B']);
    expect(groups.some((g) => g.length === 1 && g[0].providerId === 'C')).toBe(true);
    expect(groups.some((g) => g.length === 1 && g[0].providerId === 'D')).toBe(true);
  });

  it('returns an empty array for an empty input', () => {
    expect(groupByFamily([])).toEqual([]);
  });

  it('never mutates or assigns methodologyFamily -- it is read-only grouping', () => {
    const entries = [{ providerId: 'A', methodologyFamily: 'FAMILY_X' }];
    const groups = groupByFamily(entries);
    expect(groups[0][0].methodologyFamily).toBe('FAMILY_X');
    expect(entries[0].methodologyFamily).toBe('FAMILY_X');
  });
});
