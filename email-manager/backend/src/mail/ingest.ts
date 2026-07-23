import { db } from "../db";
import { categorize } from "./categorize";
import { scoreImportance, bandImportance } from "./importance";
import { applyRules } from "./rules";
import { isVip } from "./repository";
import { parseListUnsubscribe } from "../lib/listUnsubscribe";

const upsertStmt = db.prepare(`
  INSERT INTO messages (
    uid, folder, message_id, from_name, from_address, to_addresses, cc_addresses,
    subject, date, snippet, body_text, body_html, has_attachments, seen, flagged,
    list_unsubscribe_mailto, list_unsubscribe_http, list_unsubscribe_one_click,
    is_bulk, category, importance, importance_score
  ) VALUES (
    @uid, @folder, @message_id, @from_name, @from_address, @to_addresses, @cc_addresses,
    @subject, @date, @snippet, @body_text, @body_html, @has_attachments, @seen, @flagged,
    @list_unsubscribe_mailto, @list_unsubscribe_http, @list_unsubscribe_one_click,
    @is_bulk, @category, @importance, @importance_score
  )
  ON CONFLICT(message_id) DO UPDATE SET
    seen = excluded.seen,
    flagged = excluded.flagged,
    category = excluded.category,
    importance = excluded.importance,
    importance_score = excluded.importance_score
`);

export interface IngestInput {
  uid: number;
  folder: string;
  messageId: string;
  fromName: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  date: Date;
  bodyText: string;
  bodyHtml: string;
  hasAttachments: boolean;
  seen: boolean;
  flagged: boolean;
  listUnsubscribeHeader: string | null;
  listUnsubscribePostHeader: string | null;
  listId: string | null;
  precedenceBulk: boolean;
}

/** Normalizes a raw fetched message into our schema: parses List-Unsubscribe,
 * runs it through the categorizer + user rules + importance scorer, and
 * upserts it (idempotent on message_id, so re-syncing is safe). */
export function ingestMessage(input: IngestInput): void {
  if (
    db
      .prepare(`SELECT 1 FROM blocked_senders WHERE address = ?`)
      .get(input.fromAddress.toLowerCase())
  ) {
    return; // sender is blocked locally; don't re-import their mail
  }

  const parsedUnsub = parseListUnsubscribe(
    input.listUnsubscribeHeader,
    input.listUnsubscribePostHeader
  );
  const isBulk =
    input.precedenceBulk || Boolean(input.listId) || Boolean(input.listUnsubscribeHeader);

  let category = categorize({
    fromAddress: input.fromAddress,
    fromName: input.fromName,
    subject: input.subject,
    bodyText: input.bodyText,
    listId: input.listId,
    precedenceBulk: input.precedenceBulk,
    hasListUnsubscribe: Boolean(input.listUnsubscribeHeader),
  });

  const ruleEffect = applyRules(input.fromAddress, input.subject);
  if (ruleEffect.category) category = ruleEffect.category;

  const vip = isVip(input.fromAddress);
  const importanceScore =
    scoreImportance({
      category,
      isVip: vip || ruleEffect.markImportant,
      isBulk,
      toCount: input.toAddresses.length,
      subject: input.subject,
      hasAttachments: input.hasAttachments,
    }) + (ruleEffect.markImportant ? 50 : 0);
  const importance = bandImportance(importanceScore);

  upsertStmt.run({
    uid: input.uid,
    folder: input.folder,
    message_id: input.messageId,
    from_name: input.fromName,
    from_address: input.fromAddress,
    to_addresses: JSON.stringify(input.toAddresses),
    cc_addresses: JSON.stringify(input.ccAddresses),
    subject: input.subject,
    date: input.date.toISOString(),
    snippet: input.bodyText.slice(0, 200),
    body_text: input.bodyText,
    body_html: input.bodyHtml,
    has_attachments: input.hasAttachments ? 1 : 0,
    seen: input.seen ? 1 : 0,
    flagged: input.flagged ? 1 : 0,
    list_unsubscribe_mailto: parsedUnsub.mailto,
    list_unsubscribe_http: parsedUnsub.http,
    list_unsubscribe_one_click: parsedUnsub.oneClick ? 1 : 0,
    is_bulk: isBulk ? 1 : 0,
    category,
    importance,
    importance_score: importanceScore,
  });

  if (ruleEffect.archive) {
    db.prepare(`UPDATE messages SET archived = 1 WHERE message_id = ?`).run(input.messageId);
  }
}
