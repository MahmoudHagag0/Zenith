import type { ReactNode } from 'react';
import { NavItem, type NavItemDef } from './NavItem';
import styles from './NavShell.module.css';

interface NavShellProps {
  readonly items: readonly NavItemDef[];
  readonly active: string;
  readonly brand: string;
  /** e.g. a logout action -- rendered Tertiary-tier, app-supplied so this package never depends on app-specific auth logic. */
  readonly utility?: ReactNode;
  readonly children: ReactNode;
}

/**
 * Navigation Shell (M5-002 §1, M5-003 §7). Server Component -- the
 * compact menu uses native `<details>` (no client JS), consistent with
 * `DecisionCard`'s own zero-JS disclosure pattern. Sidebar at
 * `breakpoint.regular`/`wide`, Top Bar at `breakpoint.compact`
 * (D1-005 §5.1 -- Primary Navigation position is consistent, only its
 * shape responds to viewport).
 */
export function NavShell({ items, active, brand, utility, children }: NavShellProps) {
  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <p className={styles.brand}>{brand}</p>
        <details className={styles.topbarMenu}>
          <summary>Menu</summary>
          <nav className={styles.topbarMenuList} aria-label="Primary">
            {items.map((item) => (
              <NavItem key={item.href} item={item} active={item.href === active} />
            ))}
          </nav>
        </details>
        {utility}
      </header>
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Primary">
          <p className={styles.brand}>{brand}</p>
          {items.map((item) => (
            <NavItem key={item.href} item={item} active={item.href === active} />
          ))}
          {utility}
        </nav>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
