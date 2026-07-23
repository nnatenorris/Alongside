import {
  Category,
  DigestData,
  Importance,
  Rule,
  RuleAction,
  RuleMatchType,
  StoredMessage,
  SubscriptionSummary,
  Vip,
} from "./types";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface MessageFilter {
  category?: Category | "all";
  importance?: Importance;
  archived?: boolean;
  vipOnly?: boolean;
  search?: string;
}

export function fetchMessages(filter: MessageFilter): Promise<{ messages: StoredMessage[] }> {
  const params = new URLSearchParams();
  if (filter.category && filter.category !== "all") params.set("category", filter.category);
  if (filter.importance) params.set("importance", filter.importance);
  if (filter.archived) params.set("archived", "true");
  if (filter.vipOnly) params.set("vipOnly", "true");
  if (filter.search) params.set("search", filter.search);
  return request(`/messages?${params.toString()}`);
}

export function updateMessage(
  id: number,
  patch: Partial<{ seen: boolean; flagged: boolean; archived: boolean }>
): Promise<{ message: StoredMessage }> {
  return request(`/messages/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function bulkAction(
  ids: number[],
  action: "archive" | "unarchive" | "markRead" | "markUnread" | "flag" | "unflag"
): Promise<{ ok: boolean }> {
  return request(`/messages/bulk`, { method: "POST", body: JSON.stringify({ ids, action }) });
}

export function fetchDigest(): Promise<{ digest: DigestData }> {
  return request(`/digest`);
}

export function fetchSubscriptions(): Promise<{ subscriptions: SubscriptionSummary[] }> {
  return request(`/subscriptions`);
}

export function unsubscribeMessage(id: number) {
  return request<{ action: { status: string; method: string; target: string; detail: string | null } }>(
    `/messages/${id}/unsubscribe`,
    { method: "POST" }
  );
}

export function unsubscribeSender(address: string) {
  return request<{ action: { status: string; method: string; target: string; detail: string | null } }>(
    `/senders/${encodeURIComponent(address)}/unsubscribe`,
    { method: "POST" }
  );
}

export function blockSender(address: string, reason?: string) {
  return request(`/senders/${encodeURIComponent(address)}/block`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function unblockSender(address: string) {
  return request(`/senders/${encodeURIComponent(address)}/block`, { method: "DELETE" });
}

export function fetchVips(): Promise<{ vips: Vip[] }> {
  return request(`/vip`);
}

export function addVip(address: string, label?: string): Promise<{ vips: Vip[] }> {
  return request(`/vip`, { method: "POST", body: JSON.stringify({ address, label }) });
}

export function removeVip(address: string): Promise<{ vips: Vip[] }> {
  return request(`/vip/${encodeURIComponent(address)}`, { method: "DELETE" });
}

export function fetchRules(): Promise<{ rules: Rule[] }> {
  return request(`/rules`);
}

export function addRule(
  matchType: RuleMatchType,
  matchValue: string,
  action: RuleAction,
  actionValue: string | null
): Promise<{ rule: Rule }> {
  return request(`/rules`, {
    method: "POST",
    body: JSON.stringify({ matchType, matchValue, action, actionValue }),
  });
}

export function deleteRule(id: number): Promise<{ ok: boolean }> {
  return request(`/rules/${id}`, { method: "DELETE" });
}

export function triggerSync(): Promise<{ summaries: { folder: string; fetched: number }[]; demoMode: boolean }> {
  return request(`/sync`, { method: "POST" });
}

export function fetchSyncStatus(): Promise<{
  demoMode: boolean;
  imapHost: string;
  emailUser: string | null;
  syncCron: string | null;
}> {
  return request(`/sync/status`);
}
