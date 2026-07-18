import styles from './StatusIndicator.module.css';

export type StatusSeverity = 'critical' | 'warn' | 'info';

/**
 * Status Indicator (= Status Chip, D2-005 §14, M5-002 §4). Severity is
 * always paired with a text label -- there is no icon-only or color-only
 * variant (D1-002 §9.3).
 */
export function StatusIndicator({ severity, label }: { severity: StatusSeverity; label: string }) {
  return <span className={`${styles.chip} ${styles[severity]}`}>{label}</span>;
}
