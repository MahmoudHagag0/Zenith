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
import {
  IconDashboard,
  IconBrief,
  IconWatchlist,
  IconPortfolio,
  IconAlerts,
  IconCalendar,
  IconCot,
  IconReports,
  IconAiWorkspace,
  IconJournal,
} from '@/components/experimental-icons';
import styles from './page.module.css';

/**
 * EXPERIMENTAL VISUAL IDENTITY -- Direction C, "Instrument".
 *
 * Isolated exploration route. Renders the exact same locked
 * information architecture as the production Dashboard (Decision
 * Readiness -> Morning Brief/Portfolio/Watchlist -> peripheral links,
 * M4-003 series) against the real backend -- only the visual shell
 * differs. Fully self-contained (no `@zenith/ui`/`@zenith/design-tokens`
 * dependency) so it can be deleted cleanly once the founders choose.
 *
 * Philosophy: a precision instrument panel, not a webpage -- a slim
 * icon-only left rail (no text labels, title-attribute tooltips), a
 * faint exposed grid behind the content evoking graph paper/engineering
 * drafting, monospace reserved strictly for numerals and data points
 * (prose stays a legible sans), thin glowing 1px steel-cyan accent
 * lines marking the active rail icon and every real figure on screen.
 */

const NAV_ITEMS = [
  { href: '/dashboard-c', label: 'Dashboard', Icon: IconDashboard },
  { href: '/morning-brief', label: 'Morning Brief', Icon: IconBrief },
  { href: '/watchlist', label: 'Watchlist', Icon: IconWatchlist },
  { href: '/portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { href: '/alerts', label: 'Alerts', Icon: IconAlerts },
  { href: '/calendar-news', label: 'Calendar / News', Icon: IconCalendar },
  { href: '/cot', label: 'COT', Icon: IconCot },
  { href: '/reports', label: 'Reports', Icon: IconReports },
  { href: '/ai-workspace', label: 'AI Workspace', Icon: IconAiWorkspace },
  { href: '/journal', label: 'Journal', Icon: IconJournal },
] as const;

const PERIPHERAL_ITEMS = [
  { href: '/journal', label: 'Trading Journal' },
  { href: '/ai-workspace', label: 'AI Workspace' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/calendar-news', label: 'Calendar / News' },
  { href: '/cot', label: 'COT & Reports' },
] as const;

export default async function DashboardCPage() {
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
      <nav className={styles.rail} aria-label="Primary">
        <span className={styles.railMark}>Z</span>
        {NAV_ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={styles.railLink} data-active={href === '/dashboard-c' ? '' : undefined} title={label}>
            <Icon className={styles.railIcon} strokeWidth={1.5} />
          </Link>
        ))}
        <form action="/api/logout" method="post" className={styles.railFoot}>
          <button type="submit" className={styles.railSignOut} title="Sign out">&#8674;</button>
        </form>
      </nav>

      <main className={styles.content}>
        <section className={styles.primary}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" /> Decision Readiness
          </p>
          {!decisionCenter ? (
            <p className={styles.errorText}>The Confluence Engine did not respond. Decision readiness could not be computed this session.</p>
          ) : decisionCenter.readiness === 'DEGRADED' ? (
            <p className={styles.errorText}>Decision readiness is degraded -- one or more instruments could not be fully evaluated this session.</p>
          ) : decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry ? (
            <>
              <h1 className={styles.headline}>{topEntry.story}</h1>
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
          <Link href="/morning-brief" className={styles.card}>
            <p className={styles.cardLabel}>01 &mdash; Morning Brief</p>
            <p className={styles.cardBody}>
              {morningBriefResult.status === 'fulfilled' ? morningBriefResult.value.headline : 'Morning Brief could not be loaded.'}
            </p>
          </Link>
          <Link href="/portfolio" className={styles.card}>
            <p className={styles.cardLabel}>02 &mdash; Portfolio</p>
            {portfolioResult.status === 'rejected' ? (
              <p className={styles.cardBody}>Portfolio could not be loaded.</p>
            ) : portfolioData === null ? (
              <p className={styles.cardBody}>No open positions.</p>
            ) : (
              <p className={styles.cardNumeral}>
                {portfolioData.positions.length}<span className={styles.cardUnit}> POS</span>
                {'  /  '}
                {portfolioData.summary.combinedPnl}<span className={styles.cardUnit}> P/L</span>
              </p>
            )}
          </Link>
          <Link href="/watchlist" className={styles.card}>
            <p className={styles.cardLabel}>03 &mdash; Watchlist</p>
            {watchlistResult.status === 'rejected' ? (
              <p className={styles.cardBody}>Watchlist could not be loaded.</p>
            ) : !watchlistData?.watchlist ? (
              <p className={styles.cardBody}>No tracked instruments yet.</p>
            ) : (
              <p className={styles.cardNumeral}>
                {watchlistData.items.length}<span className={styles.cardUnit}> TRACKED</span>
              </p>
            )}
          </Link>
        </div>

        <nav className={styles.peripheralRow} aria-label="More areas">
          {PERIPHERAL_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.peripheralLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
