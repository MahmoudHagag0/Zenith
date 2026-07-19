'use client';

import { useState } from 'react';
import { ConfidenceDisclosure } from '@/components/dashboard-parts';
import type { ReasoningResponseView } from '@/lib/api';

/**
 * The Reasoning Layer's own frontend entry point (Blueprint Step 8) --
 * connects the existing AI Workspace screen to `POST /reasoning/ask` via
 * the `/api/reasoning` proxy. Renders only the structured Zenith response
 * (reasoning, confidence, evidence, uncertainty, behavior notes); raw
 * model text never reaches this component. Reuses the existing
 * `ConfidenceDisclosure` component and `.section-quiet`/`.inline-form`/
 * `.disclosure`/`.watchlist-items`/`.error` styling verbatim -- no new
 * visual language introduced.
 */
export function ReasoningAsk({ assetId }: { assetId: string }) {
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ReasoningResponseView | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, assetId }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.message ?? 'Something went wrong.');
        return;
      }
      const reasoningResponse = body.response as ReasoningResponseView;
      if (reasoningResponse.failureReason) {
        setError(reasoningResponse.failureReason);
        return;
      }
      setResponse(reasoningResponse);
    } catch {
      setError('Could not reach the Reasoning Layer.');
    } finally {
      setSubmitting(false);
    }
  }

  const confidenceExplanation = response?.confidence.length
    ? response.confidence.map((c) => `${c.kind}: ${c.explanation}`).join(' ')
    : 'No Confidence taxonomy was available for this response.';
  const uncertaintyExplanation = response?.uncertainty.notes.length ? response.uncertainty.notes.join(' ') : 'No uncertainty notes were disclosed.';

  return (
    <section className="section-quiet">
      <h2>Ask</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What does the current reading say?"
          required
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Thinking...' : 'Ask'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {response && (
        <div className="watchlist-items">
          <p>{response.reasoning}</p>

          <ConfidenceDisclosure confidenceExplanation={confidenceExplanation} uncertaintyExplanation={uncertaintyExplanation} />

          {response.contradictions.length > 0 && (
            <details className="disclosure">
              <summary>Contradictions</summary>
              <ul className="watchlist-items">
                {response.contradictions.map((contradiction) => (
                  <li key={contradiction} className="watchlist-item">
                    {contradiction}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {response.evidence.length > 0 && (
            <details className="disclosure">
              <summary>Evidence</summary>
              <ul className="watchlist-items">
                {response.evidence.flatMap((entry) =>
                  entry.rawDataReferences.map((reference) => (
                    <li key={reference} className="watchlist-item">
                      {reference}
                    </li>
                  )),
                )}
              </ul>
            </details>
          )}

          {response.suggestedNextSteps.length > 0 && (
            <details className="disclosure">
              <summary>Suggested next steps</summary>
              <ul className="watchlist-items">
                {response.suggestedNextSteps.map((step) => (
                  <li key={step} className="watchlist-item">
                    {step}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {response.behaviorNotes.length > 0 && <p className="muted">{response.behaviorNotes.join(' ')}</p>}
        </div>
      )}
    </section>
  );
}
