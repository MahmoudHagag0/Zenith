import { StatusIndicator, type StatusSeverity } from '../StatusIndicator/StatusIndicator';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
  /** `warn` for degraded-but-usable, `critical` only for a genuinely blocking condition (D1-002 §14.4). */
  readonly severity: Extract<StatusSeverity, 'warn' | 'critical'>;
  readonly label: string;
  /** Factual disclosure, e.g. "a provider is temporarily unavailable; showing last-known data" -- never dramatized (D1-002 §14.5). */
  readonly message: string;
  /** Last-known-data timestamp, when applicable (D1-002 §14.6) -- never hidden, never presented as current. */
  readonly lastKnownAt?: string;
}

/** Error State (D1-002 §14.4-14.6, M5-002 §7). Server Component -- composes Status Indicator, never a bespoke "alarm" treatment. */
export function ErrorState({ severity, label, message, lastKnownAt }: ErrorStateProps) {
  return (
    <div className={styles.wrapper}>
      <StatusIndicator severity={severity} label={label} />
      <p className={styles.message}>{message}</p>
      {lastKnownAt && <p className={styles.timestamp}>Last known data: {lastKnownAt}</p>}
    </div>
  );
}
