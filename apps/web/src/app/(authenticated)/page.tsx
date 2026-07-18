import Link from 'next/link';
import { Panel, Card, DecisionCard, EmptyState, ErrorState } from '@zenith/ui';
import {
  getDecisionCenter,
  getMorningBrief,
  getWatchlists,
  getWatchlistItems,
  getPortfolios,
  getPortfolioAnalytics,
  ApiError,
} from '@/lib/api';
import { requireToken } from '@/lib/auth';
import styles from './page.module.css';

const READINESS_LABEL: Record<string, string> = {
  OPPORTUNITIES_AVAILABLE: 'Opportunities available',
  NO_CLEAR_OPPORTUNITY: 'No clear opportunity',
  DEGRADED: 'Degraded -- unable to compute',
};

const PERIPHERAL_ITEMS = [
  { href: '/journal', label: 'Trading Journal' },
  { href: '/ai-workspace', label: 'AI Workspace' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/calendar-news', label: 'Calendar / News' },
  { href: '/cot', label: 'COT & Reports' },
] as const;

/**
 * Dashboard (M4-003 series, exact content -- no widget added or removed).
 * Server Component. Every visual element is a `@zenith/ui` primitive;
 * every value is a design token (via CSS custom properties inside those
 * primitives and this page's own CSS Module) -- no hardcoded design
 * value anywhere in this file.
 *
 * Secondary row (Morning Brief, Portfolio, Watchlist -- in that order,
 * per `M4-003.1` §3's Final Acceptance Review correction) is fetched
 * with `Promise.allSettled`, not `Promise.all`, so one block's own
 * failure never blocks another's render (`26` §4.2, `M5-003` §11).
 */
export default async function DashboardPage() {
  const token = await requireToken();

  const [decisionCenterResult, morningBriefResult, watchlistResult, portfolioResult] = await Promise.allSettled([
    getDecisionCenter(token),
    getMorningBrief(token),
    (async () => {
      const watchlists = await getWatchlists(token);
      if (watchlists.length === 0) return { watchlist: null, items: [] as Awaited<ReturnType<typeof getWatchlistItems>> };
      const items = await getWatchlistItems(token, watchlists[0].id);
      return { watchlist: watchlists[0], items };
    })(),
    (async () => {
      const portfolios = await getPortfolios(token);
      if (portfolios.length === 0) return null;
      return getPortfolioAnalytics(token, portfolios[0].id);
    })(),
  ]);

  return (
    <div className={styles.page}>
      {/* Primary region -- Decision Readiness Summary + nested Confidence/Uncertainty (DASH-002 + DASH-003). */}
      <Panel>
        {decisionCenterResult.status === 'rejected' ? (
          <ErrorState
            severity={decisionCenterResult.reason instanceof ApiError && decisionCenterResult.reason.status >= 500 ? 'critical' : 'warn'}
            label={decisionCenterResult.reason instanceof ApiError && decisionCenterResult.reason.status >= 500 ? 'Unavailable' : 'Degraded'}
            message="The Confluence Engine did not respond. Decision readiness could not be computed this session."
          />
        ) : (
          <DecisionReadinessContent decisionCenter={decisionCenterResult.value} morningBrief={morningBriefResult.status === 'fulfilled' ? morningBriefResult.value : undefined} />
        )}
      </Panel>

      {/* Secondary row -- Morning Brief Entry, Portfolio Snapshot, Watchlist Snapshot. */}
      <div className={styles.secondaryRow}>
        <MorningBriefEntryCard result={morningBriefResult} />
        <PortfolioSnapshotCard result={portfolioResult} />
        <WatchlistSnapshotCard result={watchlistResult} />
      </div>

      {/* Peripheral row -- consolidated, low-weight entries into areas not yet part of Dashboard's own content (M4-003.1 §2.6). */}
      <nav className={styles.peripheralRow} aria-label="More areas">
        {PERIPHERAL_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={styles.peripheralLink}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function DecisionReadinessContent({
  decisionCenter,
  morningBrief,
}: {
  decisionCenter: Awaited<ReturnType<typeof getDecisionCenter>>;
  morningBrief: Awaited<ReturnType<typeof getMorningBrief>> | undefined;
}) {
  const topOpportunity = decisionCenter.opportunities[0];
  const topEntry = topOpportunity && morningBrief ? morningBrief.entries.find((e) => e.assetId === topOpportunity.assetId) : undefined;

  if (decisionCenter.readiness === 'DEGRADED') {
    return <ErrorState severity="warn" label="Degraded" message="Decision readiness is degraded -- one or more instruments could not be fully evaluated this session." />;
  }

  if (decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry) {
    return (
      <DecisionCard
        conclusion={topEntry.story}
        reasoning={topEntry.why}
        confidenceExplanation={topEntry.confidenceExplanation}
        uncertaintyExplanation={topEntry.uncertaintyExplanation}
      />
    );
  }

  return <EmptyState message={morningBrief?.noTradeNarrative ?? READINESS_LABEL.NO_CLEAR_OPPORTUNITY} />;
}

function MorningBriefEntryCard({ result }: { result: PromiseSettledResult<Awaited<ReturnType<typeof getMorningBrief>>> }) {
  if (result.status === 'rejected') {
    return (
      <Card>
        <ErrorState severity="warn" label="Degraded" message="Morning Brief could not be loaded." />
      </Card>
    );
  }
  return (
    <Card href="/morning-brief">
      <p className={styles.cardTitle}>Morning Brief</p>
      <p className={styles.cardBody}>{result.value.headline}</p>
    </Card>
  );
}

function PortfolioSnapshotCard({ result }: { result: PromiseSettledResult<Awaited<ReturnType<typeof getPortfolioAnalytics>> | null> }) {
  if (result.status === 'rejected') {
    return (
      <Card>
        <ErrorState severity="warn" label="Degraded" message="Portfolio could not be loaded." />
      </Card>
    );
  }
  if (result.value === null) {
    return (
      <Card href="/portfolio">
        <p className={styles.cardTitle}>Portfolio</p>
        <EmptyState message="No open positions." />
      </Card>
    );
  }
  const { summary, positions } = result.value;
  return (
    <Card href="/portfolio">
      <p className={styles.cardTitle}>Portfolio</p>
      <p className={styles.cardBody}>
        {positions.length} position{positions.length === 1 ? '' : 's'} -- combined P/L {summary.combinedPnl}
      </p>
    </Card>
  );
}

function WatchlistSnapshotCard({
  result,
}: {
  result: PromiseSettledResult<{ watchlist: Awaited<ReturnType<typeof getWatchlists>>[number] | null; items: Awaited<ReturnType<typeof getWatchlistItems>> }>;
}) {
  if (result.status === 'rejected') {
    return (
      <Card>
        <ErrorState severity="warn" label="Degraded" message="Watchlist could not be loaded." />
      </Card>
    );
  }
  const { watchlist, items } = result.value;
  if (!watchlist) {
    return (
      <Card href="/watchlist">
        <p className={styles.cardTitle}>Watchlist</p>
        <EmptyState message="No tracked instruments yet." />
      </Card>
    );
  }
  return (
    <Card href="/watchlist">
      <p className={styles.cardTitle}>Watchlist</p>
      <p className={styles.cardBody}>
        {items.length} tracked instrument{items.length === 1 ? '' : 's'}
      </p>
    </Card>
  );
}
