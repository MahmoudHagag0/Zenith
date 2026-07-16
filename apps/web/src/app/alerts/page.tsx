import { getAlerts, getAssetById } from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { AppHeader } from '@/components/app-nav';
import { createAlertAction, deleteAlertAction } from './actions';

/**
 * The Alerts production screen (S1-030, Phase 2 of the post-S1-024 roadmap).
 * Direction conditions are evaluated server-side against the existing
 * Confluence Engine reading (Dashboard's InstrumentReadingService, S1-019);
 * price conditions against the existing cached MarketQuote (MarketDataService,
 * S1-005). This screen only lists/creates/deletes alerts and reads their
 * status -- no signal is computed in the frontend.
 */

const CONDITION_LABEL: Record<string, string> = {
  DIRECTION_BULLISH: 'Turns Bullish',
  DIRECTION_BEARISH: 'Turns Bearish',
  PRICE_ABOVE: 'Price rises above',
  PRICE_BELOW: 'Price falls below',
};

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { alerts, symbolByAsset } = await withAuth(async (token) => {
    const alerts = await getAlerts(token);
    const uniqueAssetIds = [...new Set(alerts.map((a) => a.assetId))];
    const assets = await Promise.all(uniqueAssetIds.map((assetId) => getAssetById(token, assetId)));
    const symbolByAsset = new Map(assets.map((asset) => [asset.id, asset.symbol]));
    return { alerts, symbolByAsset };
  });

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const triggeredAlerts = alerts.filter((a) => a.status === 'TRIGGERED');

  return (
    <main className="page">
      <AppHeader active="/alerts" />

      <section className="hero">
        <p className="hero-caption">Alerts</p>
        <p className="hero-statement">Notify me when the Confluence reading or price changes.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="section-quiet">
        <h2>New alert</h2>
        <form action={createAlertAction} className="inline-form">
          <input type="text" name="symbol" placeholder="Symbol (e.g. AAPL)" required />
          <select name="conditionType" defaultValue="DIRECTION_BULLISH">
            <option value="DIRECTION_BULLISH">Turns Bullish</option>
            <option value="DIRECTION_BEARISH">Turns Bearish</option>
            <option value="PRICE_ABOVE">Price rises above</option>
            <option value="PRICE_BELOW">Price falls below</option>
          </select>
          <input type="number" step="0.01" name="targetPrice" placeholder="Target price (if applicable)" />
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="section-quiet">
        <h2>Active ({activeAlerts.length})</h2>
        {activeAlerts.length === 0 ? (
          <p className="muted">No active alerts.</p>
        ) : (
          <ul className="watchlist-items">
            {activeAlerts.map((alert) => (
              <li key={alert.id} className="watchlist-item">
                <div className="row">
                  <span>
                    <strong>{symbolByAsset.get(alert.assetId) ?? alert.assetId}</strong>{' '}
                    <span className="muted">
                      {CONDITION_LABEL[alert.conditionType]}
                      {alert.targetPrice ? ` ${Number(alert.targetPrice).toFixed(2)}` : ''}
                    </span>
                  </span>
                  <form action={deleteAlertAction}>
                    <input type="hidden" name="id" value={alert.id} />
                    <button type="submit" className="signout">
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section-quiet">
        <h2>Triggered ({triggeredAlerts.length})</h2>
        {triggeredAlerts.length === 0 ? (
          <p className="muted">No triggered alerts yet.</p>
        ) : (
          <ul className="watchlist-items">
            {triggeredAlerts.map((alert) => (
              <li key={alert.id} className="watchlist-item">
                <div className="row">
                  <span>
                    <strong>{symbolByAsset.get(alert.assetId) ?? alert.assetId}</strong>{' '}
                    <span className="muted">{CONDITION_LABEL[alert.conditionType]}</span>
                  </span>
                  <form action={deleteAlertAction}>
                    <input type="hidden" name="id" value={alert.id} />
                    <button type="submit" className="signout">
                      Dismiss
                    </button>
                  </form>
                </div>
                <p className="muted">{alert.triggeredNote}</p>
                <p className="muted">{alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
