import { useState } from "react";
import { StoredMessage } from "../types";

interface Props {
  messages: StoredMessage[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onBulkAction: (
    ids: number[],
    action: "archive" | "unarchive" | "markRead" | "markUnread" | "flag" | "unflag"
  ) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function MessageList({ messages, loading, selectedId, onSelect, onBulkAction }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function runBulk(action: Parameters<Props["onBulkAction"]>[1]) {
    onBulkAction([...checked], action);
    setChecked(new Set());
  }

  return (
    <div className="message-list">
      <div className="list-toolbar">
        <input
          type="checkbox"
          checked={checked.size > 0 && checked.size === messages.length}
          onChange={(e) => setChecked(e.target.checked ? new Set(messages.map((m) => m.id)) : new Set())}
        />
        {checked.size > 0 ? (
          <>
            <span>{checked.size} selected</span>
            <button onClick={() => runBulk("markRead")}>Mark read</button>
            <button onClick={() => runBulk("markUnread")}>Mark unread</button>
            <button onClick={() => runBulk("archive")}>Archive</button>
          </>
        ) : (
          <span style={{ color: "var(--text-muted)" }}>{messages.length} messages</span>
        )}
        <span className="spacer" />
      </div>

      {loading && <div className="empty-state">Loading…</div>}
      {!loading && messages.length === 0 && <div className="empty-state">No messages here.</div>}

      {messages.map((m) => (
        <div
          key={m.id}
          className={`message-row ${m.seen ? "" : "unread"} ${selectedId === m.id ? "selected" : ""}`}
          onClick={() => onSelect(m.id)}
        >
          <input
            type="checkbox"
            checked={checked.has(m.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggle(m.id)}
          />
          <div className="content">
            <div className="row-top">
              <span className="sender">{m.fromName || m.fromAddress}</span>
              <span className="date">{formatDate(m.date)}</span>
            </div>
            <div className="subject">{m.subject}</div>
            <div className="snippet">{m.snippet}</div>
            <div className="badges">
              <span className={`badge category-${m.category}`}>{m.category}</span>
              {m.importance === "high" && <span className="badge importance-high">Important</span>}
              {m.isVip && <span className="badge vip">VIP</span>}
              {m.flagged && <span className="badge vip">★ Flagged</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
