/**
 * @zenith/ui -- M5-002. Consumed as source by `apps/web` (Next.js
 * `transpilePackages`). Dashboard-scoped subset only: Panel, Card,
 * DecisionCard, StatusIndicator, Skeleton, EmptyState, ErrorState,
 * NavShell. The remaining M5-002 components (Table, Tabs, Modal,
 * Dropdown, Search, Input/Textarea, Checkbox/Radio/Switch, Toast,
 * Notification, Chart Wrapper, Insight/Timeline Card, AI Response
 * Block, Button, Badge, Progress Indicator, Tooltip) are architecture
 * only until their own screen's implementation milestone.
 */
export { Panel } from './Panel/Panel';
export { Card } from './Card/Card';
export { DecisionCard } from './DecisionCard/DecisionCard';
export { StatusIndicator } from './StatusIndicator/StatusIndicator';
export type { StatusSeverity } from './StatusIndicator/StatusIndicator';
export { Skeleton } from './Skeleton/Skeleton';
export { EmptyState } from './EmptyState/EmptyState';
export { ErrorState } from './ErrorState/ErrorState';
export { NavShell } from './NavShell/NavShell';
export { NavItem } from './NavShell/NavItem';
export type { NavItemDef } from './NavShell/NavItem';
