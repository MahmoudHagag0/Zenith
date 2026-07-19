import type { ReactNode } from 'react';
import { requireToken } from '@/lib/auth';

/**
 * The single consolidated authenticated route-group layout. Consolidates
 * what was previously a `requireToken()` call duplicated in every page
 * into one place (M5-003 §6/§7/§15's original fix). Wraps only the
 * Dashboard route (`page.tsx` below it); the nine other existing screens
 * are unmigrated and keep their own pre-M4 layout/nav
 * (`components/app-nav.tsx`).
 *
 * No shell/chrome is rendered here: the Dashboard A visual identity
 * (approved, Design Freeze at commit 5b2f135) supplies its own complete
 * header and navigation inline, exactly as approved -- wrapping it in a
 * second nav shell here would duplicate the header. This mirrors how the
 * design's own isolated exploration route worked before being applied to
 * this URL: a top-level page owning its full chrome, no shared layout
 * chrome above it.
 */
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  await requireToken();
  return <>{children}</>;
}
