import Link from 'next/link';
import {
  getDecisionCenter,
  getMorningBrief,
  getWatchlists,
  getWatchlistItems,
  getPortfolios,
  getPortfolioAnalytics,
} from '@/lib/api';
import type { DimensionConfluenceView, NormalizedDimension } from '@/lib/api';
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
} from './icons';
import styles from './page.module.css';

const CONFLUENCE_DIMENSION_ORDER: readonly NormalizedDimension[] = [
  'TREND',
  'MOMENTUM',
  'LIQUIDITY',
  'STRUCTURE',
  'VOLATILITY',
  'VOLUME',
  'CONFIRMATION',
];

const CONFLUENCE_DIMENSION_LABEL: Record<NormalizedDimension, string> = {
  TREND: 'Trend',
  MOMENTUM: 'Momentum',
  LIQUIDITY: 'Liquidity',
  STRUCTURE: 'Structure',
  VOLATILITY: 'Volatility',
  VOLUME: 'Volume',
  CONFIRMATION: 'Confirmation',
};

function readingPosition(reading: DimensionConfluenceView['aggregateReading']): 'up' | 'down' | 'flat' {
  if (reading === 'BULLISH') return 'up';
  if (reading === 'BEARISH') return 'down';
  return 'flat';
}

function tickTitle(label: string, dim: DimensionConfluenceView | undefined, netDirection: 'BULLISH' | 'BEARISH'): string {
  if (!dim || dim.aggregateReading === 'NOT_APPLICABLE') return `${label}: no reading this session`;
  if (dim.aggregateReading === 'NEUTRAL') return `${label}: neutral`;
  const agrees = dim.aggregateReading === netDirection;
  return `${label}: ${dim.aggregateReading.toLowerCase()}, ${agrees ? 'agrees with' : 'differs from'} the ${netDirection.toLowerCase()} reading`;
}

/**
 * The Confluence Instrument -- Zenith's signature mark. Not a progress bar
 * standing in for a count: each of the seven slots is bound to one real,
 * named Confluence dimension's own `aggregateReading` (see api.ts
 * DimensionConfluenceView, already on the wire from S1-019 but previously
 * unmodeled by this app). Position (top/center/bottom) is that dimension's
 * own direction; color is whether it agrees with the instrument's resolved
 * `netDirection` -- the same job the accent already does everywhere else,
 * never a second meaning. The eighth mark, set apart by a divider, is the
 * resolved reading itself: the point every dimension's own vote converges
 * toward. This is the sextant made literal -- several independent
 * instruments, one measured position against a common baseline -- not a
 * metaphor in a document anymore. Delete this and Dashboard A is an AI
 * summary card; no other product has these seven named dimensions to draw
 * it from, so it cannot be copied without the engine behind it.
 */
function ConfluenceScale({ dimensions, netDirection }: { dimensions: readonly DimensionConfluenceView[]; netDirection: 'BULLISH' | 'BEARISH' }) {
  const byDimension = new Map(dimensions.map((d) => [d.dimension, d]));
  const summary = CONFLUENCE_DIMENSION_ORDER.map((dim) => {
    const view = byDimension.get(dim);
    const reading = view?.aggregateReading ?? 'NOT_APPLICABLE';
    const agrees = reading === netDirection;
    return `${CONFLUENCE_DIMENSION_LABEL[dim]} ${reading.toLowerCase()}${reading === 'BULLISH' || reading === 'BEARISH' ? (agrees ? ' (agrees)' : ' (differs)') : ''}`;
  }).join(', ');

  return (
    <div className={styles.confluenceScale} aria-label={`Confluence instrument: ${summary}. Resolved reading: ${netDirection.toLowerCase()}.`}>
      <div className={styles.confluenceTrack} aria-hidden="true">
        <span className={styles.confluenceBaseline} />
        {CONFLUENCE_DIMENSION_ORDER.map((dim) => {
          const view = byDimension.get(dim);
          const reading = view?.aggregateReading ?? 'NOT_APPLICABLE';
          const agrees = reading === netDirection;
          return (
            <span key={dim} className={styles.confluenceSlot} data-position={readingPosition(reading)} title={tickTitle(CONFLUENCE_DIMENSION_LABEL[dim], view, netDirection)}>
              <span className={styles.confluenceMark} data-reading={reading} data-agrees={agrees ? '' : undefined} />
            </span>
          );
        })}
      </div>
      <span className={styles.confluenceDivider} aria-hidden="true" />
      <div className={styles.confluenceTrack} aria-hidden="true">
        <span className={styles.confluenceSlot} data-position={readingPosition(netDirection)} title={`Resolved reading: ${netDirection.toLowerCase()}`}>
          <span className={styles.confluenceResolved} />
        </span>
      </div>
    </div>
  );
}

/**
 * ZENITH DASHBOARD -- Direction A, "Monolith".
 *
 * Approved visual identity, Design Freeze at commit 5b2f135. Renders the
 * locked information architecture (Decision Readiness -> Morning
 * Brief/Portfolio/Watchlist -> peripheral links, M4-003 series) against
 * the real backend. Fully self-contained: does not import `@zenith/ui`
 * or `@zenith/design-tokens`.
 *
 * Identity, built from ZENITH_VISUAL_DNA_v1.0 / ZENITH_VISUAL_LANGUAGE_v1.0:
 * the product is treated as an instrument (a sextant -- several
 * independent methodology readings resolved into one disclosed
 * position), not a dashboard. The governing law -- "a mark exists only
 * if it measures something" -- removed the repeated corner-cut motif,
 * the DividerMark glyph, and every use of the copper accent that did not
 * mean "this is the current live reading." What remains: the copper
 * spine (the reading's location), the Confluence Scale above (the
 * reading's actual measured agreement), and a single-source ambient
 * light anchored at the panel rather than a decorative gradient/texture
 * background. Workspace container widens in two tiers (1600px, 2200px)
 * into an asymmetric grid so wide/ultra-wide monitors get a real
 * multi-column workspace instead of one centered column stretching into
 * empty margin.
 */

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
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

  const decisionCenter = decisionCenterResult.status === 'fulfilled' ? decisionCenterResult.value : null;
  const morningBrief = morningBriefResult.status === 'fulfilled' ? morningBriefResult.value : null;
  const topOpportunity = decisionCenter?.opportunities[0];
  const topEntry = topOpportunity && morningBrief ? morningBrief.entries.find((e) => e.assetId === topOpportunity.assetId) : undefined;

  const watchlistData = watchlistResult.status === 'fulfilled' ? watchlistResult.value : null;
  const portfolioData = portfolioResult.status === 'fulfilled' ? portfolioResult.value : null;

  return (
    <div className={styles.root}>
      <header className={styles.navBar}>
        <span className={styles.brandGroup}>
          <svg className={styles.brandMark} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 4L11 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <path d="M3 19L11 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <path d="M21 11.5H11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <circle cx="11" cy="11.5" r="2.5" fill="currentColor" />
          </svg>
          <span className={styles.brand}>Zenith</span>
        </span>
        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = href === '/';
            return (
              <Link key={href} href={href} className={styles.navLink} data-active={isActive ? '' : undefined} title={label}>
                <Icon className={styles.navIcon} strokeWidth={1.5} active={isActive} />
                <span className={styles.navLabel}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <form action="/api/logout" method="post">
          <button type="submit" className={styles.signOut}>Sign out</button>
        </form>
      </header>

      <main className={styles.content}>
        <section className={styles.primary}>
          <div className={styles.primaryGlow} aria-hidden="true" />
          <div className={styles.entrance}>
            {!decisionCenter ? (
              <p className={styles.errorText}>The Confluence Engine did not respond. Decision readiness could not be computed this session.</p>
            ) : decisionCenter.readiness === 'DEGRADED' ? (
              <p className={styles.errorText}>Decision readiness is degraded -- one or more instruments could not be fully evaluated this session.</p>
            ) : decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' && topOpportunity && topEntry ? (
              <>
                <p className={styles.eyebrow}>Decision Readiness</p>
                <h1 className={styles.headline}>{topEntry.story}</h1>
                <ConfluenceScale dimensions={topOpportunity.reading.dimensions} netDirection={topOpportunity.netDirection} />
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
          </div>
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

        <div className={styles.peripheralGroup}>
          <p className={styles.peripheralLabel}>More Areas</p>
          <nav className={styles.peripheralRow} aria-label="More areas">
            {PERIPHERAL_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className={styles.peripheralLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}
