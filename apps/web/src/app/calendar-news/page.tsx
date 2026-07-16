import { getAssetById, getTrackedCalendarEvents, getTrackedNews } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';

/**
 * The Calendar/News production screen (S1-031, Phase 3 of the post-S1-024
 * roadmap). Read-only: news/events are a shared cache (mirroring
 * MarketQuote/Candle, S1-005), not user-owned, so this screen only reads
 * the union already scoped server-side to the requesting user's tracked
 * assets (GET /calendar-news/news and /calendar-news/events with no
 * assetId) -- no client-side filtering duplicates that logic.
 */

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export default async function CalendarNewsPage() {
  const { news, events, symbolByAsset } = await withAuth(async (token) => {
    const [news, events] = await Promise.all([getTrackedNews(token), getTrackedCalendarEvents(token)]);
    const assetIds = [...new Set([...news.map((n) => n.assetId), ...events.map((e) => e.assetId)].filter((id): id is string => id !== null))];
    const assets = await Promise.all(assetIds.map((assetId) => getAssetById(token, assetId)));
    const symbolByAsset = new Map(assets.map((asset) => [asset.id, asset.symbol]));
    return { news, events, symbolByAsset };
  });

  return (
    <main className="page">
      <AppHeader active="/calendar-news" />

      <section className="hero">
        <p className="hero-caption">Calendar / News</p>
        <p className="hero-statement">Upcoming events and recent headlines for what you track.</p>
      </section>

      <section className="section-quiet">
        <h2>Upcoming Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="muted">No upcoming events for your tracked instruments.</p>
        ) : (
          <ul className="watchlist-items">
            {events.map((event) => (
              <li key={event.id} className="watchlist-item">
                <div className="row">
                  <span>
                    <strong>{event.title}</strong>{' '}
                    {event.assetId && <span className="muted">{symbolByAsset.get(event.assetId) ?? event.assetId}</span>}
                  </span>
                  <span className="muted">{event.importance}</span>
                </div>
                <p>{event.description}</p>
                <p className="muted">{formatDateTime(event.scheduledAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-quiet">
        <h2>Recent News ({news.length})</h2>
        {news.length === 0 ? (
          <p className="muted">No recent news for your tracked instruments.</p>
        ) : (
          <ul className="watchlist-items">
            {news.map((item) => (
              <li key={item.id} className="watchlist-item">
                <div className="row">
                  <span>
                    <strong>{item.headline}</strong>{' '}
                    {item.assetId && <span className="muted">{symbolByAsset.get(item.assetId) ?? item.assetId}</span>}
                  </span>
                  <span className="muted">{item.source}</span>
                </div>
                <p>{item.summary}</p>
                <p className="muted">{formatDateTime(item.publishedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
