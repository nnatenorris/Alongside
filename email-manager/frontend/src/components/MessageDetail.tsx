import { useState } from "react";
import { StoredMessage } from "../types";
import * as api from "../api";

interface Props {
  message: StoredMessage | null;
  onPatched: (m: StoredMessage) => void;
}

export function MessageDetail({ message, onPatched }: Props) {
  const [showHtml, setShowHtml] = useState(false);
  const [unsubBusy, setUnsubBusy] = useState(false);
  const [unsubResult, setUnsubResult] = useState<string | null>(null);

  if (!message) {
    return (
      <div className="detail-pane">
        <div className="detail-empty">Select a message to read it.</div>
      </div>
    );
  }

  const hasUnsubscribe = Boolean(message.listUnsubscribeHttp || message.listUnsubscribeMailto);

  async function patch(p: Partial<{ seen: boolean; flagged: boolean; archived: boolean }>) {
    const { message: updated } = await api.updateMessage(message!.id, p);
    onPatched(updated);
  }

  async function handleUnsubscribe() {
    setUnsubBusy(true);
    setUnsubResult(null);
    try {
      const { action } = await api.unsubscribeMessage(message!.id);
      setUnsubResult(
        action.status === "confirmed"
          ? "Unsubscribed successfully."
          : action.status === "sent"
            ? "Unsubscribe request sent."
            : action.status === "pending"
              ? `Open this link to finish unsubscribing: ${action.target}`
              : `Couldn't unsubscribe automatically: ${action.detail}`
      );
    } catch (err) {
      setUnsubResult(err instanceof Error ? err.message : String(err));
    } finally {
      setUnsubBusy(false);
    }
  }

  async function handleBlock() {
    await api.blockSender(message!.fromAddress, "blocked from message view");
    await patch({ archived: true });
  }

  return (
    <div className="detail-pane">
      <div className="detail-header">
        <h2>{message.subject}</h2>
        <div className="detail-meta">
          <strong>{message.fromName || message.fromAddress}</strong> &lt;{message.fromAddress}&gt;
          <br />
          to {message.toAddresses.join(", ")} · {new Date(message.date).toLocaleString()}
        </div>
      </div>

      {hasUnsubscribe && (
        <div className="unsub-banner">
          <span>
            {unsubResult ??
              "This looks like a subscription or mailing list. You can unsubscribe from here."}
          </span>
          <button onClick={handleUnsubscribe} disabled={unsubBusy}>
            {unsubBusy ? "Working…" : "Unsubscribe"}
          </button>
        </div>
      )}

      <div className="detail-actions">
        <button onClick={() => patch({ seen: !message.seen })}>
          {message.seen ? "Mark unread" : "Mark read"}
        </button>
        <button onClick={() => patch({ flagged: !message.flagged })}>
          {message.flagged ? "Unflag" : "Flag"}
        </button>
        <button className={message.archived ? "primary" : ""} onClick={() => patch({ archived: !message.archived })}>
          {message.archived ? "Move to inbox" : "Archive"}
        </button>
        {message.bodyHtml && (
          <button onClick={() => setShowHtml((v) => !v)}>
            {showHtml ? "Show plain text" : "Show formatted email"}
          </button>
        )}
        <button className="danger" onClick={handleBlock}>
          Block sender
        </button>
      </div>

      <div className="detail-body">
        {showHtml && message.bodyHtml ? (
          <iframe
            title="email-html"
            sandbox=""
            srcDoc={message.bodyHtml}
            style={{ width: "100%", minHeight: 400, border: "none", background: "white" }}
          />
        ) : (
          message.bodyText || message.snippet || "(no content)"
        )}
      </div>
    </div>
  );
}
