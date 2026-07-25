import { useEffect, useState, useCallback } from "react";
import { Category, DigestData, StoredMessage } from "./types";
import * as api from "./api";
import { Sidebar } from "./components/Sidebar";
import { MessageList } from "./components/MessageList";
import { MessageDetail } from "./components/MessageDetail";
import { SubscriptionsPanel } from "./components/SubscriptionsPanel";
import { DigestPanel } from "./components/DigestPanel";
import { SettingsPanel } from "./components/SettingsPanel";

export type View = "inbox" | "subscriptions" | "digest" | "settings";
export type CategoryFilter = Category | "all";

export default function App() {
  const [view, setView] = useState<View>("inbox");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [vipOnly, setVipOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [digest, setDigest] = useState<DigestData | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadMessages = useCallback(() => {
    setLoading(true);
    api
      .fetchMessages({ category, archived: showArchived, vipOnly, search })
      .then((r) => setMessages(r.messages))
      .finally(() => setLoading(false));
  }, [category, showArchived, vipOnly, search]);

  const loadDigest = useCallback(() => {
    api.fetchDigest().then((r) => setDigest(r.digest));
  }, []);

  useEffect(() => {
    api.fetchSyncStatus().then((r) => setDemoMode(r.demoMode));
    loadDigest();
  }, [loadDigest]);

  useEffect(() => {
    if (view === "inbox") loadMessages();
  }, [view, loadMessages]);

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  async function handleSync() {
    setSyncing(true);
    try {
      await api.triggerSync();
      loadMessages();
      loadDigest();
    } finally {
      setSyncing(false);
    }
  }

  function handleMessagePatched(updated: StoredMessage) {
    setMessages((prev) =>
      updated.archived && !showArchived
        ? prev.filter((m) => m.id !== updated.id)
        : prev.map((m) => (m.id === updated.id ? updated : m))
    );
    loadDigest();
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Inbox Manager</h1>
        <nav className="topbar-tabs">
          <button className={view === "inbox" ? "active" : ""} onClick={() => setView("inbox")}>
            Inbox
          </button>
          <button
            className={view === "subscriptions" ? "active" : ""}
            onClick={() => setView("subscriptions")}
          >
            Subscriptions
          </button>
          <button className={view === "digest" ? "active" : ""} onClick={() => setView("digest")}>
            Digest
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
            VIP &amp; Rules
          </button>
        </nav>
        {view === "inbox" && (
          <div className="topbar-search">
            <input
              placeholder="Search mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
        <div style={{ flex: view === "inbox" ? undefined : 1 }} />
        {demoMode && <span className="demo-badge">Demo data</span>}
        <button className="sync-btn" onClick={handleSync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      </header>

      {view === "inbox" && (
        <div className="body-grid">
          <Sidebar
            category={category}
            onCategory={setCategory}
            showArchived={showArchived}
            onShowArchived={setShowArchived}
            vipOnly={vipOnly}
            onVipOnly={setVipOnly}
            byCategory={digest?.byCategory ?? null}
          />
          <div className="inbox-layout">
            <MessageList
              messages={messages}
              loading={loading}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                const msg = messages.find((m) => m.id === id);
                if (msg && !msg.seen) {
                  api.updateMessage(id, { seen: true }).then((r) => handleMessagePatched(r.message));
                }
              }}
              onBulkAction={async (ids, action) => {
                await api.bulkAction(ids, action);
                loadMessages();
                loadDigest();
              }}
            />
            <MessageDetail message={selected} onPatched={handleMessagePatched} />
          </div>
        </div>
      )}

      {view === "subscriptions" && <SubscriptionsPanel />}
      {view === "digest" && <DigestPanel digest={digest} onRefresh={loadDigest} />}
      {view === "settings" && <SettingsPanel />}
    </div>
  );
}
