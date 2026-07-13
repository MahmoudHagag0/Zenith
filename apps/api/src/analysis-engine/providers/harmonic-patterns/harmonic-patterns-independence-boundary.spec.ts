import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's independence mandate (S1-013
 * Sprint Brief, Scope item 14; Architecture Requirements):
 * `HarmonicPatternsProvider` remains completely independent of
 * `WyckoffProvider`, `IctSmcProvider`, and `ElliottWaveProvider`. Scans
 * every file under `providers/harmonic-patterns/` for any literal
 * reference to `wyckoff`, `ict-smc`/`ICT_SMC`, or `elliott` and fails if
 * one is found. A lexical check only, the same category and spirit as
 * the Anti-Corruption boundary test and every prior Provider's own
 * independence/vocabulary boundary tests.
 *
 * Learned directly from S1-010/S1-011's own self-review: a doc comment
 * explaining *why* this Provider is independent of the others can itself
 * trip this test by naming them. Every doc comment in this module is
 * worded to describe the independence property without naming the other
 * Providers.
 */
const INDEPENDENCE_TERMS = [/wyckoff/i, /ict-smc/i, /ict_smc/i, /elliott/i];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'harmonic-patterns-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Harmonic Patterns Provider independence boundary', () => {
  it('contains no reference to Wyckoff, ICT/SMC, or Elliott Wave anywhere under providers/harmonic-patterns/', () => {
    const harmonicPatternsRoot = __dirname;
    const offenders: string[] = [];

    for (const file of collectTsFiles(harmonicPatternsRoot)) {
      const content = readFileSync(file, 'utf8');
      if (INDEPENDENCE_TERMS.some((term) => term.test(content))) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
