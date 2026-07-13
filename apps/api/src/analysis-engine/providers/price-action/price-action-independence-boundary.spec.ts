import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's independence mandate (S1-015
 * Sprint Brief, Scope item 13; Architecture Requirements):
 * `PriceActionProvider` remains completely independent of `WyckoffProvider`,
 * `IctSmcProvider`, `ElliottWaveProvider`, `HarmonicPatternsProvider`, and
 * `ClassicalChartPatternsProvider`. Scans every file under
 * `providers/price-action/` for any literal reference to `wyckoff`,
 * `ict-smc`/`ICT_SMC`, `elliott`, `harmonic`, or `classical-chart-patterns`/
 * `classical chart` and fails if one is found. A lexical check only, the
 * same category and spirit as the Anti-Corruption boundary test and every
 * prior Provider's own independence/vocabulary boundary tests.
 *
 * Learned directly from every prior Provider sprint's own self-review: a
 * doc comment explaining *why* this Provider is independent of the
 * others can itself trip this test by naming them. Every doc comment in
 * this module is worded to describe the independence property without
 * naming the other Providers.
 */
const INDEPENDENCE_TERMS = [/wyckoff/i, /ict-smc/i, /ict_smc/i, /elliott/i, /harmonic/i, /classical-chart-patterns/i, /classical.?chart/i];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'price-action-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Price Action Provider independence boundary', () => {
  it('contains no reference to Wyckoff, ICT/SMC, Elliott Wave, Harmonic Patterns, or Classical Chart Patterns anywhere under providers/price-action/', () => {
    const root = __dirname;
    const offenders: string[] = [];

    for (const file of collectTsFiles(root)) {
      const content = readFileSync(file, 'utf8');
      if (INDEPENDENCE_TERMS.some((term) => term.test(content))) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
