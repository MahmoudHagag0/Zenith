import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's independence mandate (S1-017
 * Sprint Brief, Scope item 12; Architecture Requirements):
 * `FibonacciAnalysisProvider` remains completely independent of
 * `WyckoffProvider`, `IctSmcProvider`, `ElliottWaveProvider`,
 * `HarmonicPatternsProvider`, `ClassicalChartPatternsProvider`,
 * `PriceActionProvider`, and `SupplyDemandProvider` -- most importantly
 * `ElliottWaveProvider` and `HarmonicPatternsProvider`, given the shared
 * underlying ratio vocabulary this Sprint's own Objective names
 * explicitly. Scans every file under `providers/fibonacci-analysis/` for
 * any literal reference to any of them and fails if one is found. A
 * lexical check only, the same category and spirit as the Anti-
 * Corruption boundary test and every prior Provider's own independence
 * boundary tests.
 *
 * Learned directly from every prior Provider sprint's own self-review: a
 * doc comment explaining *why* this Provider is independent of the
 * others can itself trip this test by naming them. Every doc comment in
 * this module is worded to describe the independence property without
 * naming the other Providers.
 */
const INDEPENDENCE_TERMS = [
  /wyckoff/i,
  /ict-smc/i,
  /ict_smc/i,
  /elliott/i,
  /harmonic/i,
  /classical-chart-patterns/i,
  /classical.?chart/i,
  /price-action/i,
  /price_action/i,
  /supply-demand/i,
  /supply_demand/i,
];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'fibonacci-analysis-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Fibonacci Analysis Provider independence boundary', () => {
  it('contains no reference to any of the seven prior Providers anywhere under providers/fibonacci-analysis/', () => {
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
