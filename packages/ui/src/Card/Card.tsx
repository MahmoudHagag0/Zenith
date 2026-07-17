import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from './Card.module.css';

interface CardProps {
  readonly children: ReactNode;
  /** Presence makes the Card a navigation target (D2-005 §2 -- select -> navigation/drill-in only, never a state mutation). */
  readonly href?: string;
}

/** Card (D2-005 §2, M5-002 §3). Server Component -- navigation is the only interaction, handled by `next/link`, no client JS required. */
export function Card({ children, href }: CardProps) {
  if (href) {
    return (
      <Link href={href} className={`${styles.card} ${styles.selectable}`}>
        {children}
      </Link>
    );
  }
  return <div className={styles.card}>{children}</div>;
}
