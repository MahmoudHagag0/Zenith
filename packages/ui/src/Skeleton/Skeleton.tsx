import styles from './Skeleton.module.css';

/** Skeleton (D2-005 §17, M5-002 §7). Server Component -- pure CSS animation, no client JS. */
export function Skeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <div className={styles.skeleton} style={{ width, height }} aria-hidden="true" />;
}
