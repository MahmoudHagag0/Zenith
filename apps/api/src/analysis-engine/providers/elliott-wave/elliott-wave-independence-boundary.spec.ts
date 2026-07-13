import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's independence mandate (S1-011
 * Sprint Brief, Scope item 10; Architecture Requirements): `ElliottWaveProvider`
 * remains completely independent of both `WyckoffProvider` and
 * `IctSmcProvider`. Scans every file under `providers/elliott-wave/` for
 * any literal reference to `wyckoff` or `ict-smc`/`ICT_SMC` and fails if
 * one is found. A lexical check only, the same category and spirit as
 * the Anti-Corruption boundary test and both prior Providers' own
 * independence/vocabulary boundary tests — not a substitute for
 * code-review judgment, but a real, running check.
 *
 * Learned directly from the S1-010 self-review: a doc comment explaining
 * *why* this Provider is independent of the others can itself trip this
 * test by naming them. Every doc comment in this module is worded to
 * describe the independence property without naming the other Providers.
 */
const INDEPENDENCE_TERMS = [/wyckoff/i, /ict-smc/i, /ict_smc/i];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'elliott-wave-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Elliott Wave Provider independence boundary', () => {
  it('contains no reference to Wyckoff or ICT/SMC anywhere under providers/elliott-wave/', () => {
    const elliottWaveRoot = __dirname;
    const offenders: string[] = [];

    for (const file of collectTsFiles(elliottWaveRoot)) {
      const content = readFileSync(file, 'utf8');
      if (INDEPENDENCE_TERMS.some((term) => term.test(content))) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
