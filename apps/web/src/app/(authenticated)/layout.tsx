import type { ReactNode } from 'react';
import { NavShell, type NavItemDef } from '@zenith/ui';
import { requireToken } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

/**
 * M5-003 §6/§7/§15: the single consolidated authenticated route-group
 * layout. Consolidates what was previously a `requireToken()` call
 * duplicated in every page into one place -- the fix M5-003's own
 * self-review (§24) identified. Currently wraps only the Dashboard
 * route (`page.tsx` below it); the nine other existing screens are
 * unmigrated and keep their own pre-M4 layout/nav (`components/app-nav.tsx`)
 * until their own implementation milestone, per this task's own
 * "Dashboard only" scope.
 *
 * Navigation order below is exactly M4-002 §2's Decision-Flow order
 * (Trading Journal deliberately last, D1-005 Rule 1.1) -- this is not a
 * navigation redesign, it is this order's first correct implementation;
 * the pre-M4 `app-nav.tsx` used by other screens never matched it.
 */
const NAV_ITEMS: readonly NavItemDef[] = [
  { href: '/', label: 'Dashboard' },
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

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  await requireToken();
  // `active="/"` is correct today because Dashboard is the only route
  // in this group. Once a second screen migrates here, this must
  // become per-route (e.g. a small Client Component reading
  // `usePathname()`) -- not solved now, since solving it before a
  // second route exists would be speculative, unverifiable architecture.
  return (
    <NavShell items={NAV_ITEMS} active="/" brand="Zenith" utility={<LogoutButton />}>
      {children}
    </NavShell>
  );
}
