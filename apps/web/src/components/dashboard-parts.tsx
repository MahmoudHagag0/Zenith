/**
 * S1-022 Dashboard Production UI -- the two pieces reused more than once
 * on the Dashboard (and, per `26_DASHBOARD_HOME_SPECIFICATION.md`
 * Engineering Observation 3, anticipated to be reused again on future
 * Watchlist/Portfolio screens). Everything else on the Dashboard page is
 * kept local, per this Sprint's own "if used once, keep it local" rule.
 */

/**
 * DASH-003 equivalent -- Confidence and Uncertainty, always paired, always
 * equal in visual weight, collapsed by default (Constitution §12.1/§8.1:
 * the hero states its conclusion first; full explanation is one
 * deliberate action away, never omitted). The text rendered here is
 * never generated on the frontend -- it is quoted verbatim from the
 * Narrative Composer's own output (S1-020), which already names which
 * Confidence kind is reported and quotes its own real explanation.
 */
export function ConfidenceDisclosure({
  confidenceExplanation,
  uncertaintyExplanation,
}: {
  confidenceExplanation: string;
  uncertaintyExplanation: string;
}) {
  return (
    <div className="confidence-disclosure">
      <details className="disclosure">
        <summary>Confidence</summary>
        <p>{confidenceExplanation}</p>
      </details>
      <details className="disclosure">
        <summary>Uncertainty</summary>
        <p>{uncertaintyExplanation}</p>
      </details>
    </div>
  );
}

/**
 * A direction label, never color alone (Constitution §8.4 -- color is a
 * disciplined, small, consistent signal system, never the sole carrier
 * of meaning). Bullish/bearish get a muted, low-saturation tone; the
 * word itself is what actually communicates the reading.
 */
export function DirectionBadge({ direction }: { direction: 'BULLISH' | 'BEARISH' }) {
  return <span className={`direction-badge direction-${direction.toLowerCase()}`}>{direction}</span>;
}
