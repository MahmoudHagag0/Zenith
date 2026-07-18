import { Panel, Skeleton } from '@zenith/ui';
import styles from './page.module.css';

/** Shared by `page.tsx` (not needed there directly) and `loading.tsx` -- kept out of `page.tsx` itself since Next.js's App Router only permits specific named exports from a page module. */
export function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <Panel>
        <Skeleton height="1.75rem" width="60%" />
        <Skeleton height="1rem" width="90%" />
      </Panel>
      <div className={styles.secondaryRow}>
        <Skeleton height="6rem" />
        <Skeleton height="6rem" />
        <Skeleton height="6rem" />
      </div>
    </div>
  );
}
