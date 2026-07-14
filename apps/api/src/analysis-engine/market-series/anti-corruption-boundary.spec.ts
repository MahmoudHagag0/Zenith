import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Enforces, automatically, the Anti-Corruption Layer requirement in
 * 22_ANALYSIS_ENGINE_ARCHITECTURE.md and ADR-005: "The Anti-Corruption
 * Layer's translation adapter is the only code in the Analysis Engine
 * permitted to reference `Candle`/`MarketQuote` Prisma types." Scans every
 * `.ts` source file under `analysis-engine/` outside `market-series/` and
 * fails if any references those type names.
 */
function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Anti-Corruption Layer boundary', () => {
  it('confines Candle/MarketQuote type references to market-series/', () => {
    const analysisEngineRoot = join(__dirname, '..');
    const marketSeriesDir = join(__dirname);
    const offenders: string[] = [];

    for (const file of collectTsFiles(analysisEngineRoot)) {
      if (file.startsWith(marketSeriesDir)) continue;
      const content = readFileSync(file, 'utf8');
      if (/\bCandle\b/.test(content) || /\bMarketQuote\b/.test(content)) {
        offenders.push(file);
      }
    }

    expect(offenders).toEqual([]);
  });
});
