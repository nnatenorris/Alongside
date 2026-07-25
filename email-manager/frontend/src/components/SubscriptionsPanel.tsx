import { useEffect, useState } from "react";
import * as api from "../api";
import { SubscriptionSummary } from "../types";

export function SubscriptionsPanel() {
  const [subs, setSubs] = useState<SubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .fetchSubscriptions()
      .then((r) => setSubs(r.subscriptions))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleUnsubscribe(address: string) {
    setBusy(address);
    setMessage(null);
    try {
      const { action } = await api.unsubscribeSender(address);
      setMessage(
        action.status === "confirmed" || action.status === "sent"
          ? `Unsubscribed from ${address}.`
          : action.status === "pending"
            ? `Open this link to finish: ${action.target}`
            : `Couldn't unsubscribe automatically from ${address}: ${action.detail}`
      );
      load();
    } finally {
      setBusy(null);
    }
  }

  async function handleBlock(address: string) {
    setBusy(address);
    try {
      await api.blockSender(address, "blocked from subscriptions view");
      load();
    } finally {
      setBusy(null);
    }
  }

  async function handleUnblock(address: string) {
    setBusy(address);
    try {
      await api.unblockSender(address);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel">
      <h2>Subscriptions</h2>
      <p style={{ color: "var(--text-muted)" }}>
        Senders detected as mailing lists, newsletters, or bulk mail — sorted by how much mail
        they've sent you. Unsubscribe or block directly from here.
      </p>
      {message && <div className="card">{message}</div>}
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="empty-state">No subscriptions detected yet. Try syncing your mail.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Sender</th>
              <th>Category</th>
              <th>Messages</th>
              <th>Last received</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.senderAddress}>
                <td>
                  <div>{s.senderName || s.senderAddress}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{s.senderAddress}</div>
                </td>
                <td>
                  <span className={`badge category-${s.category}`}>{s.category}</span>
                </td>
                <td>{s.messageCount}</td>
                <td>{new Date(s.lastReceived).toLocaleDateString()}</td>
                <td>
                  <span className={`status-tag ${s.isBlocked ? "confirmed" : s.unsubscribeStatus}`}>
                    {s.isBlocked ? "blocked" : s.unsubscribeStatus}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 6 }}>
                  {!s.isBlocked && s.hasUnsubscribeLink && (
                    <button
                      className="pill-btn"
                      disabled={busy === s.senderAddress}
                      onClick={() => handleUnsubscribe(s.senderAddress)}
                    >
                      Unsubscribe
                    </button>
                  )}
                  {s.isBlocked ? (
                    <button
                      className="pill-btn success"
                      disabled={busy === s.senderAddress}
                      onClick={() => handleUnblock(s.senderAddress)}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      className="pill-btn danger"
                      disabled={busy === s.senderAddress}
                      onClick={() => handleBlock(s.senderAddress)}
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
