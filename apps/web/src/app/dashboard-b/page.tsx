import Link from 'next/link';
import {
  getDecisionCenter,
  getMorningBrief,
  getWatchlists,
  getWatchlistItems,
  getPortfolios,
  getPortfolioAnalytics,
} from '@/lib/api';
import { requireToken } from '@/lib/auth';
import styles from './page.module.css';

/**
 * EXPERIMENTAL VISUAL IDENTITY -- Direction B, "The Journal".
 *
 * Isolated exploration route. Renders the exact same locked
 * information architecture as the production Dashboard (Decision
 * Readiness -> Morning Brief/Portfolio/Watchlist -> peripheral links,
 * M4-003 series) against the real backend -- only the visual shell
 * differs. Fully self-contained (no `@zenith/ui`/`@zenith/design-tokens`
 * dependency) so it can be deleted cleanly once the founders choose.
 *
 * Philosophy: a masthead, not a sidebar -- a newspaper/luxury-editorial
 * reading experience. Warm cream canvas, a large serif nameplate with a
 * thin double rule, section-tag labels before each block, hairline
 * column rules separating the three secondary cards like a broadsheet's
 * multi-column page.
 */

const NAV_ITEMS = [
  { href: '/dashboard-b', label: 'Dashboard' },
  { href: '/morning-brief', label: 'Morning Brief' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/calendar-news', label: 'Calendar / News' },
  { href: '/cot', label: 'COT' },
  { href: '/reports', label: 'Reports' },
  { href: '/ai-workspace', label: 'AI Workspace' },
  { href: '/journal', label: 'Journal' },
] as const;

const PERIPHERAL_ITEMS = [
  { href: '/journal', label: 'Trading Journal' },
  { href: '/ai-workspace', label: 'AI Workspace' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/calendar-news', label: 'Calendar / News' },
  { href: '/cot', label: 'COT & Reports' },
] as const;

function todayDateline(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function DashboardBPage() {
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

  const decisionCenter = decisionCenterResult.status === 'fulfilled' ? decisionCenterResult.value : null;
  const morningBrief = morningBriefResult.status === 'fulfilled' ? morningBriefResult.value : null;
  const topOpportunity = decisionCenter?.opportunities[0];
  const topEntry = topOpportunity && morningBrief ? morningBrief.entries.find((e) => e.assetId === topOpportunity.assetId) : undefined;

  const watchlistData = watchlistResult.status === 'fulfilled' ? watchlistResult.value : null;
  const portfolioData = portfolioResult.status === 'fulfilled' ? portfolioResult.value : null;

  return (
    <div className={styles.root}>
      <header className={styles.masthead}>
        <div className={styles.mastheadTop}>
          <span className={styles.dateline}>{todayDateline()}</span>
          <form action="/api/logout" method="post">
            <button type="submit" className={styles.signOut}>Sign out</button>
          </form>
        </div>
        <h1 className={styles.nameplate}>Zenith</h1>
        <p className={styles.tagline}>The Trader&rsquo;s Daily Record of Evidence and Reasoning</p>
        <nav className={styles.navRule} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink} data-active={item.href === '/dashboard-b' ? '' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className={styles.content}>
        <section className={styles.primary}>
          <span className={styles.sectionTag}>Decision Center</span>
          {!decisionCenter ? (
            <p className={styles.errorText}>The Confluence Engine did not respond. Decision readiness could not be computed this session.</p>
          ) : decisionCenter.readiness === 'DEGRADED' ? (
            <p className={styles.errorText}>Decision readiness is degraded -- one or more instruments could not be fully evaluated this session.</p>
          ) : decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry ? (
            <>
              <h2 className={styles.headline}>{topEntry.story}</h2>
              <p className={styles.reasoning}>{topEntry.why}</p>
              <div className={styles.disclosureRow}>
                <details className={styles.disclosure}>
                  <summary>Confidence</summary>
                  <p>{topEntry.confidenceExplanation}</p>
                </details>
                <details className={styles.disclosure}>
                  <summary>Uncertainty</summary>
                  <p>{topEntry.uncertaintyExplanation}</p>
                </details>
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>{morningBrief?.noTradeNarrative ?? 'No clear opportunity.'}</p>
          )}
        </section>

        <div className={styles.secondaryRow}>
          <Link href="/morning-brief" className={styles.column}>
            <span className={styles.sectionTag}>Briefing</span>
            <p className={styles.columnTitle}>Morning Brief</p>
            <p className={styles.columnBody}>
              {morningBriefResult.status === 'fulfilled' ? morningBriefResult.value.headline : 'Morning Brief could not be loaded.'}
            </p>
          </Link>
          <Link href="/portfolio" className={styles.column}>
            <span className={styles.sectionTag}>Holdings</span>
            <p className={styles.columnTitle}>Portfolio</p>
            {portfolioResult.status === 'rejected' ? (
              <p className={styles.columnBody}>Portfolio could not be loaded.</p>
            ) : portfolioData === null ? (
              <p className={styles.columnBody}>No open positions.</p>
            ) : (
              <p className={styles.columnBody}>
                {portfolioData.positions.length} position{portfolioData.positions.length === 1 ? '' : 's'} &mdash; combined P/L {portfolioData.summary.combinedPnl}
              </p>
            )}
          </Link>
          <Link href="/watchlist" className={styles.column}>
            <span className={styles.sectionTag}>Tracking</span>
            <p className={styles.columnTitle}>Watchlist</p>
            {watchlistResult.status === 'rejected' ? (
              <p className={styles.columnBody}>Watchlist could not be loaded.</p>
            ) : !watchlistData?.watchlist ? (
              <p className={styles.columnBody}>No tracked instruments yet.</p>
            ) : (
              <p className={styles.columnBody}>
                {watchlistData.items.length} tracked instrument{watchlistData.items.length === 1 ? '' : 's'}
              </p>
            )}
          </Link>
        </div>

        <nav className={styles.peripheralRow} aria-label="More areas">
          {PERIPHERAL_ITEMS.map((item, i) => (
            <span key={item.href} className={styles.peripheralGroup}>
              <Link href={item.href} className={styles.peripheralLink}>
                {item.label}
              </Link>
              {i < PERIPHERAL_ITEMS.length - 1 && <span className={styles.peripheralDot} aria-hidden="true">&middot;</span>}
            </span>
          ))}
        </nav>
      </main>
    </div>
  );
}
