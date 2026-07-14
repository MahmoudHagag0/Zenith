import { getDecisionCenter, getWatchlistItems, getWatchlists } from '@/lib/api';
import type { RankedOpportunity } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';
import { ConfidenceDisclosure, DirectionBadge } from '@/components/dashboard-parts';
import { addItemAction, createWatchlistAction, removeItemAction } from './actions';

/**
 * The Watchlist production screen (S1-024). Uses the existing Watchlist
 * backend (S1-003) for the list itself, and the existing, unmodified
 * `GET /dashboard/decision-center` (S1-019) response for real Confluence
 * annotations -- no new backend endpoint was needed: every ranked
 * opportunity already carries its own full `InstrumentReading` (including
 * `topContributors`) over the wire today. Items with no qualifying
 * (non-NEUTRAL) reading are shown honestly as "no directional bias",
 * matching the same wording the Dashboard already uses -- never a fake
 * confidence figure.
 */

/** Formats already-disclosed fields into the two sentences `ConfidenceDisclosure` expects. Pure string interpolation -- no confidence/uncertainty value is computed here. */
function annotationText(opportunity: RankedOpportunity) {
  const lead = opportunity.reading.topContributors[0];
  if (!lead) {
    return {
      confidenceExplanation: 'No contributing Provider data is available for this instrument.',
      uncertaintyExplanation: 'No contributing Provider data is available for this instrument.',
    };
  }
  const notes = lead.uncertainty.notes.length > 0 ? ` ${lead.uncertainty.notes.join(' ')}` : '';
  return {
    confidenceExplanation: `${lead.interpretationConfidence.value} out of 100 -- ${lead.interpretationConfidence.explanation}`,
    uncertaintyExplanation: `Data quality: ${lead.uncertainty.dataQuality.toLowerCase().replace('_', ' ')}.${notes}`,
  };
}

export default async function WatchlistPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { watchlists, itemsByWatchlist, opportunityByAsset, failedByAsset } = await withAuth(async (token) => {
    const [watchlists, decisionCenter] = await Promise.all([getWatchlists(token), getDecisionCenter(token)]);
    const itemsByWatchlist = new Map(await Promise.all(watchlists.map(async (w) => [w.id, await getWatchlistItems(token, w.id)] as const)));
    const opportunityByAsset = new Map(decisionCenter.opportunities.map((o) => [o.assetId, o]));
    const failedByAsset = new Map(decisionCenter.instrumentsFailed.map((f) => [f.assetId, f.reason]));
    return { watchlists, itemsByWatchlist, opportunityByAsset, failedByAsset };
  });

  return (
    <main className="page">
      <AppHeader active="/watchlist" />

      <section className="hero">
        <p className="hero-caption">Watchlist</p>
        <p className="hero-statement">Real Confluence readings for every tracked instrument.</p>
      </section>

      {error && <p className="error">{error}</p>}

      {watchlists.length === 0 && (
        <section className="section-quiet">
          <h2>Create your first watchlist</h2>
          <form action={createWatchlistAction} className="inline-form">
            <input type="text" name="name" placeholder="Watchlist name" required />
            <button type="submit">Create</button>
          </form>
        </section>
      )}

      {watchlists.map((watchlist) => {
        const items = itemsByWatchlist.get(watchlist.id) ?? [];
        return (
          <section key={watchlist.id} className="section-quiet">
            <h2>{watchlist.name}</h2>

            {items.length === 0 ? (
              <p className="muted">No instruments tracked yet.</p>
            ) : (
              <ul className="watchlist-items">
                {items.map((item) => {
                  const opportunity = opportunityByAsset.get(item.assetId);
                  const failureReason = failedByAsset.get(item.assetId);
                  return (
                    <li key={item.assetId} className="watchlist-item">
                      <div className="row">
                        <span>
                          <strong>{item.asset.symbol}</strong> <span className="muted">{item.asset.name}</span>
                        </span>
                        <form action={removeItemAction}>
                          <input type="hidden" name="watchlistId" value={watchlist.id} />
                          <input type="hidden" name="assetId" value={item.assetId} />
                          <button type="submit" className="signout">
                            Remove
                          </button>
                        </form>
                      </div>
                      {opportunity ? (
                        <>
                          <p>
                            <DirectionBadge direction={opportunity.netDirection} /> agreeing across {opportunity.agreeingDimensions} / 7 dimensions
                            {opportunity.disagreementPresent ? <span className="muted"> (disagreement present)</span> : null}
                          </p>
                          <ConfidenceDisclosure {...annotationText(opportunity)} />
                        </>
                      ) : failureReason ? (
                        <p className="muted">Could not be evaluated this session: {failureReason}</p>
                      ) : (
                        <p className="muted">No directional bias currently.</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <form action={addItemAction} className="inline-form">
              <input type="hidden" name="watchlistId" value={watchlist.id} />
              <input type="text" name="symbol" placeholder="Add by symbol (e.g. AAPL)" required />
              <button type="submit">Add</button>
            </form>
          </section>
        );
      })}
    </main>
  );
}
