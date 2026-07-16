import Link from 'next/link';
import { LogoutButton } from './logout-button';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard' },
  { href: '/morning-brief', label: 'Morning Brief' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/journal', label: 'Journal' },
] as const;

/** Shared page header (S1-024) -- introduced once a fourth screen made the same header markup a real, repeated duplication across pages, not before. */
export function AppHeader({ active }: { active: (typeof NAV_ITEMS)[number]['href'] }) {
  return (
    <header className="row">
      <div className="app-brand">
        <h1>Zenith</h1>
        <nav className="app-nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={item.href === active ? 'nav-link nav-link-active' : 'nav-link'}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <LogoutButton />
    </header>
  );
}
