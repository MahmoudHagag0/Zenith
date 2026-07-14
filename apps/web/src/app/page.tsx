import Link from 'next/link';
import { getDecisionCenter, getMorningBrief } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { ConfidenceDisclosure, DirectionBadge } from '@/components/dashboard-parts';
import { AppHeader } from '@/components/app-nav';

const READINESS_LABEL: Record<string, string> = {
  OPPORTUNITIES_AVAILABLE: 'Opportunities available',
  NO_CLEAR_OPPORTUNITY: 'No clear opportunity',
  DEGRADED: 'Degraded -- unable to compute',
};

/**
 * S1-022 Dashboard Production UI V1. Fixed reading order (Sprint Brief):
 * Decision Readiness (hero) -> Morning Brief preview -> Top Instruments ->
 * Supporting Information. A Server Component -- fetches the real,
 * unmodified `GET /dashboard/decision-center` (S1-019) and
 * `GET /morning-brief` (S1-020) server-to-server; every word rendered is
 * exactly what those endpoints returned. No mocked data, no duplicated
 * business logic: the hero's own confidence/uncertainty text is quoted
 * from the Narrative Composer's own output, never recomputed here.
 */
export default async function DashboardPage() {
  const { decisionCenter, morningBrief } = await withAuth(async (token) => {
    const [decisionCenter, morningBrief] = await Promise.all([getDecisionCenter(token), getMorningBrief(token)]);
    return { decisionCenter, morningBrief };
  });

  const topOpportunity = decisionCenter.opportunities[0];
  const topEntry = topOpportunity ? morningBrief.entries.find((e) => e.assetId === topOpportunity.assetId) : undefined;

  return (
    <main className="page">
      <AppHeader active="/" />

      {/* 1. Decision Readiness -- the hero. Strongest visual weight; nothing below competes with it. */}
      <section className="hero">
        <p className="hero-caption">{READINESS_LABEL[decisionCenter.readiness]}</p>
        {decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry ? (
          <>
            <p className="hero-statement">{topEntry.story}</p>
            <ConfidenceDisclosure confidenceExplanation={topEntry.confidenceExplanation} uncertaintyExplanation={topEntry.uncertaintyExplanation} />
          </>
        ) : (
          <p className="hero-statement muted-statement">{morningBrief.noTradeNarrative}</p>
        )}
      </section>

      {/* 2. Morning Brief preview -- answers "should I keep reading?", never the full narrative. */}
      <section className="section-quiet">
        <h2>Morning Brief</h2>
        <p>{morningBrief.headline}</p>
        <Link href="/morning-brief" className="nav-link">
          Read full Morning Brief
        </Link>
      </section>

      {/* 3. Top Instruments -- comparison only; direction/confidence detail already lives in the hero above. */}
      <section className="section-quiet">
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
                <th className="num-col">Agreeing dimensions</th>
              </tr>
            </thead>
            <tbody>
              {decisionCenter.opportunities.map((o) => (
                <tr key={o.assetId}>
                  <td>{o.symbol}</td>
                  <td>{o.marketName}</td>
                  <td>
                    <DirectionBadge direction={o.netDirection} />
                    {o.disagreementPresent ? <span className="muted"> (disagreement)</span> : null}
                  </td>
                  <td className="num-col">{o.agreeingDimensions} / 7</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 4. Supporting information -- present, never competing for attention. */}
      <footer className="supporting">
        {decisionCenter.instrumentsFailed.length > 0 && (
          <p>
            {decisionCenter.instrumentsFailed.length} instrument(s) could not be evaluated this session: {decisionCenter.instrumentsFailed.map((f) => f.reason).join('; ')}
          </p>
        )}
        <p>
          Generated {morningBrief.generatedAt} -- {decisionCenter.instrumentsConsidered} instrument(s) considered.
        </p>
      </footer>
    </main>
  );
}
