import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mechanically enforces this Sprint's central design mandate (S1-010
 * Sprint Brief, Scope item 10; Architecture Requirements; Architecture
 * Team's Task Breakdown approval decision): `IctSmcProvider` remains
 * completely independent of `WyckoffProvider`. Scans every file under
 * `providers/ict-smc/` for any literal reference to `wyckoff` (import
 * path or otherwise) and fails if one is found. A lexical check only, the
 * same category and spirit as the Anti-Corruption boundary test and the
 * Wyckoff VSA-vocabulary boundary test (S1-009) — not a substitute for
 * code-review judgment, but a real, running check.
 */
const INDEPENDENCE_TERM = /wyckoff/i;

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'ict-smc-independence-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('ICT/SMC Provider independence boundary', () => {
  it('contains no reference to Wyckoff anywhere under providers/ict-smc/', () => {
    const ictSmcRoot = __dirname;
    const offenders: string[] = [];

    for (const file of collectTsFiles(ictSmcRoot)) {
      const content = readFileSync(file, 'utf8');
      if (INDEPENDENCE_TERM.test(content)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
