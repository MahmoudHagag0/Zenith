import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * A lightweight, supplementary safety net (S1-009 Sprint Brief, Scope
 * item 4 / Acceptance Criteria) against drifting into VSA's territory:
 * flags literal VSA-specific terminology anywhere in the Wyckoff
 * Provider's own source. Not a substitute for code-review judgment (it
 * is a lexical check only — it cannot catch overreach expressed under
 * different words), but a real, running check, analogous in spirit to
 * (and far weaker than) the Anti-Corruption boundary test.
 */
const VSA_TERMS = [/no demand/i, /no supply/i, /stopping volume/i, /effort\s*vs\.?\s*result score/i];

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && entry !== 'wyckoff-volume-boundary.spec.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Wyckoff volume boundary', () => {
  it('contains no literal VSA-specific terminology anywhere under providers/wyckoff/', () => {
    const wyckoffRoot = __dirname;
    const offenders: string[] = [];

    for (const file of collectTsFiles(wyckoffRoot)) {
      const content = readFileSync(file, 'utf8');
      if (VSA_TERMS.some((term) => term.test(content))) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
