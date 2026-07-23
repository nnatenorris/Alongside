import { db } from "../db";
import { Category, Importance, StoredMessage, UnsubscribeStatus } from "../types";

export interface MessageRow {
  id: number;
  uid: number;
  folder: string;
  message_id: string;
  from_name: string;
  from_address: string;
  to_addresses: string;
  cc_addresses: string;
  subject: string;
  date: string;
  snippet: string;
  body_text: string;
  body_html: string;
  has_attachments: number;
  seen: number;
  flagged: number;
  archived: number;
  list_unsubscribe_mailto: string | null;
  list_unsubscribe_http: string | null;
  list_unsubscribe_one_click: number;
  is_bulk: number;
  category: string;
  importance: string;
  importance_score: number;
  snoozed_until: string | null;
  created_at: string;
}

export function rowToMessage(row: MessageRow): StoredMessage {
  return {
    id: row.id,
    uid: row.uid,
    folder: row.folder,
    messageId: row.message_id,
    fromName: row.from_name,
    fromAddress: row.from_address,
    toAddresses: JSON.parse(row.to_addresses),
    ccAddresses: JSON.parse(row.cc_addresses),
    subject: row.subject,
    date: row.date,
    snippet: row.snippet,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    hasAttachments: Boolean(row.has_attachments),
    seen: Boolean(row.seen),
    flagged: Boolean(row.flagged),
    archived: Boolean(row.archived),
    listUnsubscribeMailto: row.list_unsubscribe_mailto,
    listUnsubscribeHttp: row.list_unsubscribe_http,
    listUnsubscribeOneClick: Boolean(row.list_unsubscribe_one_click),
    isBulk: Boolean(row.is_bulk),
    category: row.category as Category,
    importance: row.importance as Importance,
    importanceScore: row.importance_score,
    isVip: isVip(row.from_address),
    snoozedUntil: row.snoozed_until,
    createdAt: row.created_at,
  };
}

export function getMessageRow(id: number): MessageRow | undefined {
  return db.prepare(`SELECT * FROM messages WHERE id = ?`).get(id) as MessageRow | undefined;
}

export interface ListFilter {
  category?: Category;
  importance?: Importance;
  archived?: boolean;
  seen?: boolean;
  vipOnly?: boolean;
  search?: string;
  limit?: number;
}

export function listMessages(filter: ListFilter = {}): StoredMessage[] {
  const clauses: string[] = [];
  const params: unknown[] = [];

  clauses.push("archived = ?");
  params.push(filter.archived ? 1 : 0);

  if (filter.category) {
    clauses.push("category = ?");
    params.push(filter.category);
  }
  if (filter.importance) {
    clauses.push("importance = ?");
    params.push(filter.importance);
  }
  if (typeof filter.seen === "boolean") {
    clauses.push("seen = ?");
    params.push(filter.seen ? 1 : 0);
  }
  if (filter.search) {
    clauses.push("(subject LIKE ? OR from_name LIKE ? OR from_address LIKE ? OR snippet LIKE ?)");
    const like = `%${filter.search}%`;
    params.push(like, like, like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = filter.limit ?? 200;

  const rows = db
    .prepare(`SELECT * FROM messages ${where} ORDER BY date DESC LIMIT ?`)
    .all(...params, limit) as MessageRow[];

  let messages = rows.map(rowToMessage);
  if (filter.vipOnly) {
    messages = messages.filter((m) => m.isVip);
  }
  return messages;
}

export function setMessageFlags(
  id: number,
  flags: Partial<{ seen: boolean; flagged: boolean; archived: boolean }>
): void {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (typeof flags.seen === "boolean") {
    sets.push("seen = ?");
    params.push(flags.seen ? 1 : 0);
  }
  if (typeof flags.flagged === "boolean") {
    sets.push("flagged = ?");
    params.push(flags.flagged ? 1 : 0);
  }
  if (typeof flags.archived === "boolean") {
    sets.push("archived = ?");
    params.push(flags.archived ? 1 : 0);
  }
  if (!sets.length) return;
  params.push(id);
  db.prepare(`UPDATE messages SET ${sets.join(", ")} WHERE id = ?`).run(...params);
}

export function snoozeMessage(id: number, until: string | null): void {
  db.prepare(`UPDATE messages SET snoozed_until = ? WHERE id = ?`).run(until, id);
}

export function isVip(address: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM vip_senders WHERE address = ?`)
    .get(address.toLowerCase());
  return Boolean(row);
}

export function listVips(): { address: string; label: string; addedAt: string }[] {
  const rows = db
    .prepare(`SELECT address, label, added_at as addedAt FROM vip_senders ORDER BY added_at DESC`)
    .all() as { address: string; label: string; addedAt: string }[];
  return rows;
}

export function addVip(address: string, label = ""): void {
  db.prepare(
    `INSERT INTO vip_senders (address, label) VALUES (?, ?)
     ON CONFLICT(address) DO UPDATE SET label = excluded.label`
  ).run(address.toLowerCase(), label);
}

export function removeVip(address: string): void {
  db.prepare(`DELETE FROM vip_senders WHERE address = ?`).run(address.toLowerCase());
}

export interface SubscriptionRow {
  senderAddress: string;
  senderName: string;
  category: Category;
  messageCount: number;
  lastReceived: string;
  hasUnsubscribeLink: number;
}

export function listSubscriptions(): SubscriptionRow[] {
  return db
    .prepare(
      `SELECT
         from_address as senderAddress,
         from_name as senderName,
         category,
         COUNT(*) as messageCount,
         MAX(date) as lastReceived,
         MAX(CASE WHEN list_unsubscribe_mailto IS NOT NULL OR list_unsubscribe_http IS NOT NULL THEN 1 ELSE 0 END) as hasUnsubscribeLink
       FROM messages
       WHERE is_bulk = 1
       GROUP BY from_address
       ORDER BY messageCount DESC`
    )
    .all() as SubscriptionRow[];
}

export function latestMessageIdForSender(address: string): number | null {
  const row = db
    .prepare(
      `SELECT id FROM messages
       WHERE from_address = ? AND (list_unsubscribe_mailto IS NOT NULL OR list_unsubscribe_http IS NOT NULL)
       ORDER BY date DESC LIMIT 1`
    )
    .get(address.toLowerCase()) as { id: number } | undefined;
  return row?.id ?? null;
}

export function latestUnsubscribeStatus(address: string): UnsubscribeStatus | "none" {
  const row = db
    .prepare(
      `SELECT status FROM unsubscribe_actions WHERE sender_address = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(address) as { status: UnsubscribeStatus } | undefined;
  return row?.status ?? "none";
}
