import { getMorningBrief } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { ConfidenceDisclosure, DirectionBadge } from '@/components/dashboard-parts';
import { AppHeader } from '@/components/app-nav';

/**
 * The Morning Brief production screen (S1-024) -- the complete narrative
 * the Dashboard's own Morning Brief section only ever previews (one
 * headline). A Server Component rendering the real, unmodified
 * `GET /morning-brief` (S1-020) output only; no independent aggregation,
 * no recomputation, no mocked data. Reached from the Dashboard, which
 * remains the product's entry point.
 */
export default async function MorningBriefPage() {
  const morningBrief = await withAuth((token) => getMorningBrief(token));

  return (
    <main className="page">
      <AppHeader active="/morning-brief" />

      <section className="hero">
        <p className="hero-caption">Morning Brief</p>
        <p className="hero-statement">{morningBrief.headline}</p>
      </section>

      {morningBrief.entries.length === 0 ? (
        <section className="section-quiet">
          <p className="muted-statement">{morningBrief.noTradeNarrative}</p>
        </section>
      ) : (
        morningBrief.entries.map((entry) => (
          <section key={entry.assetId} className="section-quiet">
            <h2>
              {entry.symbol} <DirectionBadge direction={entry.netDirection} />
              {entry.disagreementPresent ? <span className="muted"> (disagreement present)</span> : null}
            </h2>
            <p>{entry.story}</p>
            <p className="muted">{entry.why}</p>
            <ConfidenceDisclosure confidenceExplanation={entry.confidenceExplanation} uncertaintyExplanation={entry.uncertaintyExplanation} />
          </section>
        ))
      )}

      <footer className="supporting">
        {morningBrief.instrumentsFailed.length > 0 && (
          <p>
            {morningBrief.instrumentsFailed.length} instrument(s) could not be evaluated this session: {morningBrief.instrumentsFailed.map((f) => f.reason).join('; ')}
          </p>
        )}
        <p>
          Generated {morningBrief.generatedAt} -- {morningBrief.instrumentsConsidered} instrument(s) considered.
        </p>
      </footer>
    </main>
  );
}
