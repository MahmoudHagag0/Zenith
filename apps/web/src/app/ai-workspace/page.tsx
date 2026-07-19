import Link from 'next/link';
import { getWatchlistItems, getWatchlists, getWorkspace } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';
import { DirectionBadge } from '@/components/dashboard-parts';
import { ReasoningAsk } from './reasoning-ask';

/**
 * The AI Workspace production screen (S1-033, Phase 5 of the post-S1-024
 * roadmap). The cross-cutting reasoning layer: one instrument, everything
 * Zenith already knows about it in one place. Every field rendered here
 * comes straight from the new GET /workspace/:assetId response, which is
 * itself a pure composition of already-built services (Confluence Engine
 * reading via Dashboard, Calendar/News, COT, Alerts, Journal) -- no
 * calculation happens in this screen or in WorkspaceService.
 */

interface TrackedAsset {
  readonly id: string;
  readonly symbol: string;
}

export default async function AiWorkspacePage({ searchParams }: { searchParams: Promise<{ assetId?: string }> }) {
  const { assetId: requestedAssetId } = await searchParams;
  const { assets, workspace } = await withAuth(async (token) => {
    const watchlists = await getWatchlists(token);
    const itemsPerWatchlist = await Promise.all(watchlists.map((w) => getWatchlistItems(token, w.id)));
    const assetById = new Map<string, TrackedAsset>();
    for (const items of itemsPerWatchlist) {
      for (const item of items) {
        assetById.set(item.assetId, { id: item.assetId, symbol: item.asset.symbol });
      }
    }
    const assets = [...assetById.values()];
    const selectedAssetId = requestedAssetId && assetById.has(requestedAssetId) ? requestedAssetId : assets[0]?.id;
    const workspace = selectedAssetId ? await getWorkspace(token, selectedAssetId) : null;
    return { assets, workspace };
  });

  return (
    <main className="page">
      <AppHeader active="/ai-workspace" />

      <section className="hero">
        <p className="hero-caption">AI Workspace</p>
        <p className="hero-statement">Everything Zenith knows about one instrument, in one place.</p>
      </section>

      {assets.length > 1 && (
        <nav className="app-nav">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/ai-workspace?assetId=${asset.id}`}
              className={asset.id === workspace?.assetId ? 'nav-link nav-link-active' : 'nav-link'}
            >
              {asset.symbol}
            </Link>
          ))}
        </nav>
      )}

      {!workspace ? (
        <p className="muted">No tracked instruments yet -- add one to your Watchlist.</p>
      ) : (
        <>
          <section className="section-quiet">
            <h2>{workspace.symbol} -- Confluence Reading</h2>
            {workspace.reading && workspace.reading.netDirection !== 'NEUTRAL' ? (
              <p>
                <DirectionBadge direction={workspace.reading.netDirection} /> agreeing across {workspace.reading.agreeingDimensions} / 7 dimensions
                {workspace.reading.disagreementDimensions.length > 0 ? <span className="muted"> (disagreement present)</span> : null}
              </p>
            ) : workspace.reading ? (
              <p className="muted">No directional bias currently.</p>
            ) : (
              <p className="muted">Could not be evaluated this session: {workspace.readingFailureReason}</p>
            )}
          </section>

          <ReasoningAsk assetId={workspace.assetId} />

          <section className="section-quiet">
            <h2>Alerts ({workspace.alerts.length})</h2>
            {workspace.alerts.length === 0 ? (
              <p className="muted">No alerts for this instrument.</p>
            ) : (
              <ul className="watchlist-items">
                {workspace.alerts.map((alert) => (
                  <li key={alert.id} className="watchlist-item">
                    <span>
                      {alert.conditionType.replace('_', ' ')} -- <span className="muted">{alert.status}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-quiet">
            <h2>Journal Entries ({workspace.journalEntries.length})</h2>
            {workspace.journalEntries.length === 0 ? (
              <p className="muted">No journal entries linked to this instrument.</p>
            ) : (
              <ul className="watchlist-items">
                {workspace.journalEntries.map((entry) => (
                  <li key={entry.id} className="watchlist-item">
                    <strong>{entry.title}</strong>
                    <p>{entry.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-quiet">
            <h2>Upcoming Events ({workspace.upcomingEvents.length})</h2>
            {workspace.upcomingEvents.length === 0 ? (
              <p className="muted">No upcoming events.</p>
            ) : (
              <ul className="watchlist-items">
                {workspace.upcomingEvents.map((event) => (
                  <li key={event.id} className="watchlist-item">
                    <strong>{event.title}</strong> <span className="muted">{event.importance}</span>
                    <p>{event.description}</p>
                    <p className="muted">{new Date(event.scheduledAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-quiet">
            <h2>Recent News ({workspace.news.length})</h2>
            {workspace.news.length === 0 ? (
              <p className="muted">No recent news.</p>
            ) : (
              <ul className="watchlist-items">
                {workspace.news.map((item) => (
                  <li key={item.id} className="watchlist-item">
                    <strong>{item.headline}</strong> <span className="muted">{item.source}</span>
                    <p>{item.summary}</p>
                    <p className="muted">{new Date(item.publishedAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="section-quiet">
            <h2>COT Positioning</h2>
            {workspace.cotReports.length === 0 ? (
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
                  {workspace.cotReports.map((report) => (
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
        </>
      )}
    </main>
  );
}
