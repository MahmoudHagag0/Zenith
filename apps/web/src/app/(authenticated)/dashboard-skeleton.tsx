import styles from './page.module.css';

/**
 * Shared by `loading.tsx` (Next.js route-level loading UI, M5-003 §12).
 * Reuses the approved Dashboard A page's own structural classes
 * (`.root`/`.content`/`.primary`/`.secondaryRow`/`.card`) as empty
 * placeholders -- no new visual language invented for this transient
 * state, just the same panel/card shapes the eventual content fills in.
 */
export function DashboardSkeleton() {
  return (
    <div className={styles.root}>
      <main className={styles.content}>
        <section className={styles.primary} aria-hidden="true" />
        <div className={styles.secondaryRow}>
          <div className={styles.card} />
          <div className={styles.card} />
          <div className={styles.card} />
        </div>
      </main>
    </div>
  );
}
