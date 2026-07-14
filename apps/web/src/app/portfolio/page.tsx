import { getDecisionCenter, getPortfolioAnalytics, getPortfolios } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';
import { DirectionBadge } from '@/components/dashboard-parts';
import { createPortfolioAction } from './actions';

/**
 * The Portfolio production screen (S1-024). Uses the existing Portfolio
 * backend (S1-004) for the position list and the existing, unmodified
 * Analytics endpoint (S1-006, `GET /portfolios/:id/analytics`) for every
 * number shown -- market value, unrealized P/L, Portfolio Health,
 * Decision Readiness, data quality. No calculation is duplicated here.
 * The direction badge per position reuses the same, already-fetched
 * `GET /dashboard/decision-center` (S1-019) response the Dashboard and
 * Watchlist screens already consume, matched by `assetId`.
 */

/** Formats an already-computed decimal string for display -- rounding only, never a derivation. */
function fmt(value: string | null, decimals = 2): string {
  if (value === null) return '—';
  return Number(value).toFixed(decimals);
}

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { portfolios, analyticsById, opportunityByAsset } = await withAuth(async (token) => {
    const [portfolios, decisionCenter] = await Promise.all([getPortfolios(token), getDecisionCenter(token)]);
    const analyticsById = new Map(await Promise.all(portfolios.map(async (p) => [p.id, await getPortfolioAnalytics(token, p.id)] as const)));
    const opportunityByAsset = new Map(decisionCenter.opportunities.map((o) => [o.assetId, o]));
    return { portfolios, analyticsById, opportunityByAsset };
  });

  const heroStatement =
    portfolios.length === 0
      ? 'No portfolios yet.'
      : portfolios.length === 1
        ? (analyticsById.get(portfolios[0].id)?.humanSummary ?? '')
        : `You have ${portfolios.length} portfolios.`;

  return (
    <main className="page">
      <AppHeader active="/portfolio" />

      <section className="hero">
        <p className="hero-caption">Portfolio</p>
        <p className="hero-statement">{heroStatement}</p>
      </section>

      {error && <p className="error">{error}</p>}

      {portfolios.length === 0 && (
        <section className="section-quiet">
          <h2>Create your first portfolio</h2>
          <form action={createPortfolioAction} className="inline-form">
            <input type="text" name="name" placeholder="Portfolio name" required />
            <button type="submit">Create</button>
          </form>
        </section>
      )}

      {portfolios.map((portfolio) => {
        const analytics = analyticsById.get(portfolio.id);
        if (!analytics) return null;
        return (
          <section key={portfolio.id} className="section-quiet">
            <h2>{portfolio.name}</h2>

            <p className="muted">
              Portfolio Health: {analytics.portfolioHealth.score}/100 -- {analytics.portfolioHealth.reasoning}
            </p>
            <p className="muted">{analytics.decisionReadiness.reasoning}</p>
            <p className="muted">{analytics.dataQuality.dataStatus}</p>

            {analytics.positions.length === 0 ? (
              <p className="muted">No positions held.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th className="num-col">Quantity</th>
                    <th className="num-col">Avg Cost</th>
                    <th className="num-col">Price</th>
                    <th className="num-col">Market Value</th>
                    <th className="num-col">Unrealized P/L %</th>
                    <th className="num-col">Weight</th>
                    <th>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.positions.map((position) => {
                    const opportunity = opportunityByAsset.get(position.assetId);
                    return (
                      <tr key={position.positionId}>
                        <td>{position.symbol}</td>
                        <td className="num-col">{fmt(position.quantity, 4)}</td>
                        <td className="num-col">{fmt(position.averageCost)}</td>
                        <td className="num-col">{fmt(position.currentPrice)}</td>
                        <td className="num-col">{fmt(position.marketValue)}</td>
                        <td className="num-col">{fmt(position.unrealizedPnlPercent, 1)}</td>
                        <td className="num-col">{fmt(position.portfolioWeight, 1)}</td>
                        <td>
                          {opportunity ? (
                            <>
                              <DirectionBadge direction={opportunity.netDirection} /> <span className="muted">{opportunity.agreeingDimensions} / 7</span>
                            </>
                          ) : (
                            <span className="muted">No bias</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </main>
  );
}
