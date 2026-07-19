import Link from 'next/link';
import { LogoutButton } from './logout-button';
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
} from './nav-icons';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
  { href: '/morning-brief', label: 'Morning Brief', Icon: IconBrief },
  { href: '/watchlist', label: 'Watchlist', Icon: IconWatchlist },
  { href: '/portfolio', label: 'Portfolio', Icon: IconPortfolio },
  { href: '/journal', label: 'Journal', Icon: IconJournal },
  { href: '/alerts', label: 'Alerts', Icon: IconAlerts },
  { href: '/calendar-news', label: 'Calendar / News', Icon: IconCalendar },
  { href: '/cot', label: 'COT', Icon: IconCot },
  { href: '/ai-workspace', label: 'AI Workspace', Icon: IconAiWorkspace },
  { href: '/reports', label: 'Reports', Icon: IconReports },
] as const;

/**
 * Shared page header (S1-024). Visual Propagation phase: restyled to the
 * approved Dashboard nav bar's exact visual language (glass pill, brand
 * mark, icon-based links with an active chip), reusing the same shared
 * icon set -- not a second nav design. Item order and hrefs unchanged;
 * only the visual treatment moved.
 */
export function AppHeader({ active }: { active: (typeof NAV_ITEMS)[number]['href'] }) {
  return (
    <header className="row">
      <div className="app-brand">
        <span className="brand-group">
          <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 4L11 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <path d="M3 19L11 11.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <path d="M21 11.5H11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.55" />
            <circle cx="11" cy="11.5" r="2.5" fill="currentColor" />
          </svg>
          <h1>Zenith</h1>
        </span>
        <nav className="app-nav">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = href === active;
            return (
              <Link key={href} href={href} className={isActive ? 'nav-link nav-link-active' : 'nav-link'} title={label}>
                <Icon className="nav-icon" strokeWidth={1.5} active={isActive} />
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <LogoutButton />
    </header>
  );
}
