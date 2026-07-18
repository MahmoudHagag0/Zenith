import type { ReactNode } from 'react';
import styles from './Panel.module.css';

/**
 * Panel (D2-005 §3, M5-002 §3). Server Component -- purely presentational.
 * Composition rule: holds exactly one screen's own Primary Attention
 * region; may nest a `DecisionCard` directly (M5-002 §3); never nests
 * another Panel.
 */
export function Panel({ children }: { children: ReactNode }) {
  return <section className={styles.panel}>{children}</section>;
}
