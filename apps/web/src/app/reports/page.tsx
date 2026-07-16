import { getPortfolios, getWeeklyReport } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';

/**
 * The Reports production screen (S1-034, Phase 6 -- final phase -- of the
 * post-S1-024 roadmap). A weekly summary composed entirely from
 * already-built services (Portfolio Analytics, Journal, Alerts,
 * Calendar/News) via GET /reports/weekly -- no calculation happens here
 * or in ReportsService itself.
 */

function fmt(value: string, decimals = 2): string {
  return Number(value).toFixed(decimals);
}

export default async function ReportsPage() {
  const { report, portfolioNameById } = await withAuth(async (token) => {
    const [report, portfolios] = await Promise.all([getWeeklyReport(token), getPortfolios(token)]);
    return { report, portfolioNameById: new Map(portfolios.map((p) => [p.id, p.name])) };
  });

  const periodLabel = `${new Date(report.periodStart).toLocaleDateString()} - ${new Date(report.periodEnd).toLocaleDateString()}`;

  return (
    <main className="page">
      <AppHeader active="/reports" />

      <section className="hero">
        <p className="hero-caption">Weekly Report</p>
        <p className="hero-statement">{periodLabel}</p>
      </section>

      <section className="section-quiet">
        <h2>Portfolios</h2>
        {report.portfolios.length === 0 ? (
          <p className="muted">No portfolios yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Portfolio</th>
                <th className="num-col">Market Value</th>
                <th className="num-col">Unrealized P/L</th>
                <th className="num-col">Realized P/L</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {report.portfolios.map((portfolio) => (
                <tr key={portfolio.portfolioId}>
                  <td>{portfolioNameById.get(portfolio.portfolioId) ?? portfolio.portfolioId}</td>
                  <td className="num-col">{fmt(portfolio.summary.totalMarketValue)}</td>
                  <td className="num-col">{fmt(portfolio.summary.totalUnrealizedPnl)}</td>
                  <td className="num-col">{fmt(portfolio.summary.totalRealizedPnl)}</td>
                  <td>{portfolio.portfolioHealth.score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section-quiet">
        <h2>Journal Entries This Week ({report.journalEntries.length})</h2>
        {report.journalEntries.length === 0 ? (
          <p className="muted">No journal entries written this week.</p>
        ) : (
          <ul className="watchlist-items">
            {report.journalEntries.map((entry) => (
              <li key={entry.id} className="watchlist-item">
                <strong>{entry.title}</strong>
                <p className="muted">{new Date(entry.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-quiet">
        <h2>Alerts Triggered This Week ({report.triggeredAlerts.length})</h2>
        {report.triggeredAlerts.length === 0 ? (
          <p className="muted">No alerts triggered this week.</p>
        ) : (
          <ul className="watchlist-items">
            {report.triggeredAlerts.map((alert) => (
              <li key={alert.id} className="watchlist-item">
                <span>{alert.conditionType.replace('_', ' ')}</span>
                <p className="muted">{alert.triggeredNote}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-quiet">
        <h2>Notable News This Week ({report.notableNews.length})</h2>
        {report.notableNews.length === 0 ? (
          <p className="muted">No notable news this week.</p>
        ) : (
          <ul className="watchlist-items">
            {report.notableNews.map((item) => (
              <li key={item.id} className="watchlist-item">
                <strong>{item.headline}</strong>
                <p className="muted">{new Date(item.publishedAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
