import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, getDecisionCenter, getMorningBrief } from '@/lib/api';
import { LogoutButton } from './logout-button';

const TOKEN_COOKIE = 'zenith_token';

const READINESS_LABEL: Record<string, string> = {
  OPPORTUNITIES_AVAILABLE: 'Opportunities available',
  NO_CLEAR_OPPORTUNITY: 'No clear opportunity',
  DEGRADED: 'Degraded -- unable to compute',
};

/**
 * S1-021 Developer Preview -- the Dashboard screen. A Server Component
 * that fetches the real, unmodified `GET /dashboard/decision-center`
 * (S1-019) and `GET /morning-brief` (S1-020) directly from `apps/api`
 * (server-to-server, no CORS involved) and renders their output as-is.
 * No mocked data, no duplicated orchestration, no new business logic --
 * every value below is exactly what the backend returned.
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/login');
  }

  let decisionCenter;
  let morningBrief;
  try {
    [decisionCenter, morningBrief] = await Promise.all([getDecisionCenter(token), getMorningBrief(token)]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    throw error;
  }

  return (
    <main className="preview-page">
      <header className="row">
        <h1>Zenith -- Developer Preview</h1>
        <LogoutButton />
      </header>

      <section className="section">
        <h2>Decision Readiness</h2>
        <p className="readiness">{READINESS_LABEL[decisionCenter.readiness]}</p>
        <p>{morningBrief.headline}</p>
        {decisionCenter.instrumentsFailed.length > 0 && (
          <p className="notice">
            {decisionCenter.instrumentsFailed.length} instrument(s) could not be evaluated this session:{' '}
            {decisionCenter.instrumentsFailed.map((f) => f.reason).join('; ')}
          </p>
        )}
      </section>

      <section className="section">
        <h2>Top Instruments</h2>
        {decisionCenter.opportunities.length === 0 ? (
          <p className="muted">No instrument currently shows a directional bias.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Market</th>
                <th>Direction</th>
                <th>Agreeing dimensions</th>
              </tr>
            </thead>
            <tbody>
              {decisionCenter.opportunities.map((o) => (
                <tr key={o.assetId}>
                  <td>{o.symbol}</td>
                  <td>{o.marketName}</td>
                  <td>
                    {o.netDirection}
                    {o.disagreementPresent ? ' (disagreement present)' : ''}
                  </td>
                  <td>{o.agreeingDimensions} of 7</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="section">
        <h2>Morning Brief</h2>
        {morningBrief.noTradeNarrative && <p className="no-trade">{morningBrief.noTradeNarrative}</p>}
        {morningBrief.entries.map((entry) => (
          <article key={entry.assetId} className="entry">
            <h3>
              {entry.symbol} -- {entry.marketName}
            </h3>
            <p>{entry.story}</p>
            <p>
              <strong>Evidence:</strong> {entry.why}
            </p>
            <p>
              <strong>Confidence:</strong> {entry.confidenceExplanation}
            </p>
            <p>
              <strong>Uncertainty:</strong> {entry.uncertaintyExplanation}
            </p>
          </article>
        ))}
      </section>

      <footer className="muted">
        Generated {morningBrief.generatedAt} -- {decisionCenter.instrumentsConsidered} instrument(s) considered.
      </footer>
    </main>
  );
}
