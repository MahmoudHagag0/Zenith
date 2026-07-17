import { DashboardSkeleton } from './dashboard-skeleton';

/** Next.js route-level loading UI (M5-003 §12) -- reuses the exact Secondary-row Skeleton shape as the eventual Success state. */
export default function Loading() {
  return <DashboardSkeleton />;
}
