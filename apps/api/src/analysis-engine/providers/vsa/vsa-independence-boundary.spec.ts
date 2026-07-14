import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's independence mandate (S1-018
 * Sprint Brief, Scope item 10; Architecture Requirements): `VsaProvider`
 * remains completely independent of `WyckoffProvider`, `IctSmcProvider`,
 * `ElliottWaveProvider`, `HarmonicPatternsProvider`,
 * `ClassicalChartPatternsProvider`, `PriceActionProvider`,
 * `SupplyDemandProvider`, and `FibonacciAnalysisProvider` -- most
 * importantly `WyckoffProvider`, given this Sprint's own central named
 * risk (shared historical terminology). Scans every file under
 * `providers/vsa/` for any literal reference to any of them and fails if
 * one is found. A lexical check only, the same category and spirit as
 * the Anti-Corruption boundary test and every prior Provider's own
 * independence boundary tests. Shared named-term vocabulary (Upthrust,
 * Shakeout, Stopping Volume) is expected and disclosed elsewhere in this
 * module (Sprint Objective) -- this test asserts zero file-level
 * reference/import coupling, never term novelty.
 *
 * Learned directly from every prior Provider sprint's own self-review: a
 * doc comment explaining *why* this Provider is independent of another
 * can itself trip this test by naming it. Every doc comment in this
 * module is worded to describe the independence property without naming
 * any other Provider.
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
  /fibonacci-analysis/i,
  /fibonacci_analysis/i,
];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'vsa-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('VSA Provider independence boundary', () => {
  it('contains no reference to any of the eight prior Providers anywhere under providers/vsa/', () => {
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
