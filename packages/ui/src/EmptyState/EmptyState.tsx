import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  /** Why this is empty -- D1-002 §14.1: an empty state always answers two questions. */
  readonly message: string;
  /** A legitimate next action, if any (D1-002 §14.1) -- omitted entirely when none exists (e.g. "no clear opportunity" is complete on its own, Constitution §12.4). */
  readonly action?: ReactNode;
}

/**
 * Empty State (D1-002 §14.1-14.3, M5-002 §7). Server Component. Renders
 * with identical tone/weight to a populated state -- callers must not
 * wrap this in extra emphasis styling; a genuine absence of evidence
 * (e.g. "no clear opportunity") is a calm, first-class reading, never a
 * degraded one (Constitution §12.4).
 */
export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
