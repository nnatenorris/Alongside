import { DigestData } from "../types";

interface Props {
  digest: DigestData | null;
  onRefresh: () => void;
}

const LABELS: Record<string, string> = {
  primary: "Primary",
  promotions: "Promotions",
  social: "Social",
  updates: "Updates",
  forums: "Forums",
  junk: "Junk",
};

export function DigestPanel({ digest, onRefresh }: Props) {
  if (!digest) {
    return (
      <div className="panel">
        <div className="empty-state">Loading…</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Daily Digest</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Generated {new Date(digest.generatedAt).toLocaleString()} ·{" "}
        <button className="pill-btn" onClick={onRefresh}>
          Refresh
        </button>
      </p>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{digest.totalUnread}</div>
          <div className="label">Unread total</div>
        </div>
        <div className="stat-card">
          <div className="value">{digest.highImportanceUnread.length}</div>
          <div className="label">Important &amp; unread</div>
        </div>
        <div className="stat-card">
          <div className="value">{digest.newSubscriptionsDetected}</div>
          <div className="label">New subscriptions (24h)</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Unread by category</h3>
        <div className="stat-grid">
          {Object.entries(digest.byCategory).map(([cat, count]) => (
            <div key={cat} className="stat-card">
              <div className="value">{count}</div>
              <div className="label">{LABELS[cat] ?? cat}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Needs your attention</h3>
        {digest.highImportanceUnread.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nothing urgent right now.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {digest.highImportanceUnread.map((m) => (
                <tr key={m.id}>
                  <td>{m.fromName || m.fromAddress}</td>
                  <td>{m.subject}</td>
                  <td>{new Date(m.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Top senders</h3>
        <table>
          <thead>
            <tr>
              <th>Sender</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            {digest.topSenders.map((s) => (
              <tr key={s.address}>
                <td>{s.name || s.address}</td>
                <td>{s.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
