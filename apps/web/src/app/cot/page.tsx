import { getCotReports, getWatchlistItems, getWatchlists } from '@/lib/api';
import type { CotReportView } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';

/**
 * The COT (Commitment of Traders) production screen (S1-032, Phase 4 of the
 * post-S1-024 roadmap). Read-only, per tracked instrument (the same
 * Watchlist union already used by the Watchlist screen, S1-024) -- COT
 * reports are a shared cache (mirroring MarketQuote/NewsItem), not
 * user-owned.
 */

interface TrackedAsset {
  readonly id: string;
  readonly symbol: string;
}

export default async function CotPage() {
  const { assets, reportsByAsset } = await withAuth(async (token) => {
    const watchlists = await getWatchlists(token);
    const itemsPerWatchlist = await Promise.all(watchlists.map((w) => getWatchlistItems(token, w.id)));
    const assetById = new Map<string, TrackedAsset>();
    for (const items of itemsPerWatchlist) {
      for (const item of items) {
        assetById.set(item.assetId, { id: item.assetId, symbol: item.asset.symbol });
      }
    }
    const assets = [...assetById.values()];
    const reportsByAsset = new Map(await Promise.all(assets.map(async (asset) => [asset.id, await getCotReports(token, asset.id)] as const)));
    return { assets, reportsByAsset };
  });

  return (
    <main className="page">
      <AppHeader active="/cot" />

      <section className="hero">
        <p className="hero-caption">COT</p>
        <p className="hero-statement">Commitment of Traders positioning for your tracked instruments.</p>
      </section>

      {assets.length === 0 && <p className="muted">No tracked instruments yet -- add one to your Watchlist.</p>}

      {assets.map((asset) => {
        const reports = reportsByAsset.get(asset.id) ?? [];
        const latestByCategory = new Map<string, CotReportView>();
        for (const report of reports) {
          if (!latestByCategory.has(report.category)) latestByCategory.set(report.category, report);
        }
        const latest = [...latestByCategory.values()];

        return (
          <section key={asset.id} className="section-quiet">
            <h2>{asset.symbol}</h2>
            {latest.length === 0 ? (
              <p className="muted">No COT data yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num-col">Long</th>
                    <th className="num-col">Short</th>
                    <th className="num-col">Net</th>
                    <th>As of</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map((report) => (
                    <tr key={report.category}>
                      <td>{report.category.replace('_', ' ')}</td>
                      <td className="num-col">{report.longPositions.toLocaleString()}</td>
                      <td className="num-col">{report.shortPositions.toLocaleString()}</td>
                      <td className="num-col">{report.netPosition.toLocaleString()}</td>
                      <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </main>
  );
}
