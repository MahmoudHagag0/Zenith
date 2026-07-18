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
 * EXPERIMENTAL VISUAL IDENTITY -- Direction A, "Monolith".
 *
 * Isolated exploration route. Renders the exact same locked
 * information architecture as the production Dashboard (Decision
 * Readiness -> Morning Brief/Portfolio/Watchlist -> peripheral links,
 * M4-003 series) against the real backend -- only the visual shell
 * differs. Does not import `@zenith/ui` or `@zenith/design-tokens`;
 * fully self-contained so it cannot affect the shipped Dashboard and
 * can be deleted cleanly once the founders choose a direction.
 *
 * Philosophy: spatial, dark, confident -- a single floating glass
 * navigation bar (not a sidebar) hovering over a deep charcoal canvas,
 * oversized numerals, deep-radius glass cards, one warm copper glow as
 * the entire accent vocabulary.
 */

const NAV_ITEMS = [
  { href: '/dashboard-a', label: 'Dashboard', Icon: IconDashboard },
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

export default async function DashboardAPage() {
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
      <header className={styles.navBar}>
        <span className={styles.brand}>Zenith</span>
        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link key={href} href={href} className={styles.navLink} data-active={href === '/dashboard-a' ? '' : undefined} title={label}>
              <Icon className={styles.navIcon} strokeWidth={1.5} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          ))}
        </nav>
        <form action="/api/logout" method="post">
          <button type="submit" className={styles.signOut}>Sign out</button>
        </form>
      </header>

      <main className={styles.content}>
        <section className={styles.primary}>
          <div className={styles.primaryGlow} aria-hidden="true" />
          {!decisionCenter ? (
            <p className={styles.errorText}>The Confluence Engine did not respond. Decision readiness could not be computed this session.</p>
          ) : decisionCenter.readiness === 'DEGRADED' ? (
            <p className={styles.errorText}>Decision readiness is degraded -- one or more instruments could not be fully evaluated this session.</p>
          ) : decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry ? (
            <>
              <p className={styles.eyebrow}>Decision Readiness</p>
              <h1 className={styles.headline}>{topEntry.story}</h1>
              <p className={styles.reasoning}>{topEntry.why}</p>
              <details className={styles.disclosure}>
                <summary>Confidence</summary>
                <p>{topEntry.confidenceExplanation}</p>
              </details>
              <details className={styles.disclosure}>
                <summary>Uncertainty</summary>
                <p>{topEntry.uncertaintyExplanation}</p>
              </details>
            </>
          ) : (
            <p className={styles.emptyText}>{morningBrief?.noTradeNarrative ?? 'No clear opportunity.'}</p>
          )}
        </section>

        <div className={styles.secondaryRow}>
          <Link href="/morning-brief" className={styles.card}>
            <p className={styles.cardLabel}>Morning Brief</p>
            <p className={styles.cardBody}>
              {morningBriefResult.status === 'fulfilled' ? morningBriefResult.value.headline : 'Morning Brief could not be loaded.'}
            </p>
          </Link>
          <Link href="/portfolio" className={styles.card}>
            <p className={styles.cardLabel}>Portfolio</p>
            {portfolioResult.status === 'rejected' ? (
              <p className={styles.cardBody}>Portfolio could not be loaded.</p>
            ) : portfolioData === null ? (
              <p className={styles.cardBody}>No open positions.</p>
            ) : (
              <p className={styles.cardNumeral}>
                {portfolioData.positions.length} <span className={styles.cardUnit}>position{portfolioData.positions.length === 1 ? '' : 's'}</span>
                <br />
                {portfolioData.summary.combinedPnl} <span className={styles.cardUnit}>combined P/L</span>
              </p>
            )}
          </Link>
          <Link href="/watchlist" className={styles.card}>
            <p className={styles.cardLabel}>Watchlist</p>
            {watchlistResult.status === 'rejected' ? (
              <p className={styles.cardBody}>Watchlist could not be loaded.</p>
            ) : !watchlistData?.watchlist ? (
              <p className={styles.cardBody}>No tracked instruments yet.</p>
            ) : (
              <p className={styles.cardNumeral}>
                {watchlistData.items.length} <span className={styles.cardUnit}>tracked instrument{watchlistData.items.length === 1 ? '' : 's'}</span>
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
