import { getJournalEntries, getPortfolioAnalytics, getPortfolios, getPositionTransactions } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';
import { createJournalEntryAction, deleteJournalEntryAction } from './actions';

/**
 * The Trading Journal production screen (S1-029, Phase 1 of the post-S1-024
 * roadmap). Uses the new Journal backend for entries themselves, and the
 * existing, unmodified Portfolio (S1-004) + Analytics (S1-006) endpoints
 * purely to build the "link to a trade" picker -- no new backend surface
 * was needed for that, since `GET /portfolios/:id/positions/:id/transactions`
 * already returns every transaction a journal entry can reference.
 */

interface TradeOption {
  readonly transactionId: string;
  readonly label: string;
}

async function loadTradeOptions(token: string): Promise<TradeOption[]> {
  const portfolios = await getPortfolios(token);
  const options: TradeOption[] = [];
  for (const portfolio of portfolios) {
    const analytics = await getPortfolioAnalytics(token, portfolio.id);
    for (const position of analytics.positions) {
      const transactions = await getPositionTransactions(token, portfolio.id, position.positionId);
      for (const transaction of transactions) {
        const date = new Date(transaction.executedAt).toISOString().slice(0, 10);
        options.push({
          transactionId: transaction.id,
          label: `${position.symbol} ${transaction.type} ${Number(transaction.quantity)} @ ${Number(transaction.price).toFixed(2)} (${date})`,
        });
      }
    }
  }
  return options;
}

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { entries, tradeOptions } = await withAuth(async (token) => {
    const [entries, tradeOptions] = await Promise.all([getJournalEntries(token), loadTradeOptions(token)]);
    return { entries, tradeOptions };
  });
  const tradeLabelById = new Map(tradeOptions.map((option) => [option.transactionId, option.label]));

  return (
    <main className="page">
      <AppHeader active="/journal" />

      <section className="hero">
        <p className="hero-caption">Trading Journal</p>
        <p className="hero-statement">Your own reflections, optionally linked to a real trade.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="section-quiet">
        <h2>New entry</h2>
        <form action={createJournalEntryAction} className="inline-form">
          <input type="text" name="title" placeholder="Title" required />
          <textarea name="content" placeholder="What happened, and why?" required rows={3} />
          <input type="text" name="tags" placeholder="Tags (comma separated)" />
          {tradeOptions.length > 0 && (
            <select name="transactionId" defaultValue="">
              <option value="">Not linked to a trade</option>
              {tradeOptions.map((option) => (
                <option key={option.transactionId} value={option.transactionId}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          <button type="submit">Save</button>
        </form>
      </section>

      <section className="section-quiet">
        <h2>Entries</h2>
        {entries.length === 0 ? (
          <p className="muted">No journal entries yet.</p>
        ) : (
          <ul className="watchlist-items">
            {entries.map((entry) => (
              <li key={entry.id} className="watchlist-item">
                <div className="row">
                  <strong>{entry.title}</strong>
                  <form action={deleteJournalEntryAction}>
                    <input type="hidden" name="id" value={entry.id} />
                    <button type="submit" className="signout">
                      Delete
                    </button>
                  </form>
                </div>
                <p>{entry.content}</p>
                {entry.tags.length > 0 && <p className="muted">Tags: {entry.tags.join(', ')}</p>}
                {entry.transactionId && (
                  <p className="muted">Linked trade: {tradeLabelById.get(entry.transactionId) ?? entry.transactionId}</p>
                )}
                <p className="muted">{new Date(entry.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
