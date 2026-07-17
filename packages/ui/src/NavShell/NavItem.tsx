import Link from 'next/link';
import styles from './NavShell.module.css';

export interface NavItemDef {
  readonly href: string;
  readonly label: string;
}

/** One Primary Navigation entry (D1-005 §1, M4-002 §3.1) -- identical item used by both the Sidebar and the compact Top Bar menu. */
export function NavItem({ item, active }: { item: NavItemDef; active: boolean }) {
  return (
    <Link href={item.href} className={styles.navItem} aria-current={active ? 'page' : undefined} data-active={active || undefined}>
      {item.label}
    </Link>
  );
}
