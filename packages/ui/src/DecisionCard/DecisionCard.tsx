import styles from './DecisionCard.module.css';

interface DecisionCardProps {
  /** The single synthesized conclusion -- Primary Attention (D1-002 §1.1). */
  readonly conclusion: string;
  /** Optional supporting reasoning line(s), Secondary Attention. */
  readonly reasoning?: string;
  /** Nested Confidence disclosure (DASH-003) -- omitted only when no reading exists (Empty state handles that case instead). */
  readonly confidenceExplanation?: string;
  /** Nested Uncertainty disclosure (DASH-003) -- always paired with confidence, identical visual weight (Design Constitution rule 8). */
  readonly uncertaintyExplanation?: string;
}

/**
 * Decision Card (M5-002 §9). Server Component. Composes the Panel-level
 * synthesis statement with its nested, equally-weighted Confidence and
 * Uncertainty disclosure -- the DASH-002 + DASH-003 pattern, promoted to
 * a shared primitive per M4-003's own Engineering Observation 3.
 */
export function DecisionCard({ conclusion, reasoning, confidenceExplanation, uncertaintyExplanation }: DecisionCardProps) {
  return (
    <div>
      <p className={styles.conclusion}>{conclusion}</p>
      {reasoning && <p className={styles.reasoning}>{reasoning}</p>}
      {confidenceExplanation && uncertaintyExplanation && (
        <div className={styles.disclosure}>
          <details className={styles.disclosureItem}>
            <summary>Confidence</summary>
            <p>{confidenceExplanation}</p>
          </details>
          <details className={styles.disclosureItem}>
            <summary>Uncertainty</summary>
            <p>{uncertaintyExplanation}</p>
          </details>
        </div>
      )}
    </div>
  );
}
