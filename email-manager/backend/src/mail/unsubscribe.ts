import nodemailer from "nodemailer";
import { db } from "../db";
import { config } from "../config";
import { StoredMessage, UnsubscribeAction, UnsubscribeMethod, UnsubscribeStatus } from "../types";
import { findUnsubscribeLinkInHtml } from "../lib/listUnsubscribe";
import { getMessageRow, rowToMessage } from "./repository";

const REQUEST_TIMEOUT_MS = 10_000;

function recordAction(
  senderAddress: string,
  messageId: number,
  method: UnsubscribeMethod,
  status: UnsubscribeStatus,
  target: string,
  detail: string | null
): UnsubscribeAction {
  const stmt = db.prepare(
    `INSERT INTO unsubscribe_actions (sender_address, message_id, method, status, target, detail)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(senderAddress, messageId, method, status, target, detail);
  return {
    id: Number(info.lastInsertRowid),
    senderAddress,
    messageId,
    method,
    status,
    target,
    detail,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function postOneClick(url: string): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "List-Unsubscribe=One-Click",
      signal: controller.signal,
    });
    return { ok: res.ok, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

async function sendMailtoUnsubscribe(mailto: string): Promise<{ ok: boolean; detail: string }> {
  if (!config.hasImapCredentials) {
    return { ok: false, detail: "SMTP not configured (no EMAIL_USER/EMAIL_APP_PASSWORD)" };
  }
  const url = new URL(mailto);
  const to = url.pathname;
  const subject = url.searchParams.get("subject") || "unsubscribe";

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.emailUser, pass: config.emailAppPassword },
  });

  try {
    await transporter.sendMail({ from: config.emailUser, to, subject, text: "unsubscribe" });
    return { ok: true, detail: `Sent to ${to}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Attempts to unsubscribe the message's sender using the safest available
 * method, preferring the RFC 8058 one-click flow (a verified automated
 * POST) over anything that requires guessing at side effects:
 *   1. List-Unsubscribe-Post one-click HTTPS -> automatic POST
 *   2. List-Unsubscribe mailto -> send via SMTP if configured, else queue
 *   3. Plain (non-one-click) List-Unsubscribe HTTPS link -> queued for the
 *      user to open themselves, since an un-marked link isn't guaranteed
 *      safe to hit automatically
 *   4. Unsubscribe link scraped from the HTML body -> queued, same reason
 */
export async function attemptUnsubscribe(messageId: number): Promise<UnsubscribeAction> {
  const row = getMessageRow(messageId);
  if (!row) throw new Error(`Message ${messageId} not found`);
  const message: StoredMessage = rowToMessage(row);

  if (message.listUnsubscribeOneClick && message.listUnsubscribeHttp) {
    const { ok, detail } = await postOneClick(message.listUnsubscribeHttp);
    return recordAction(
      message.fromAddress,
      messageId,
      "one_click",
      ok ? "confirmed" : "failed",
      message.listUnsubscribeHttp,
      detail
    );
  }

  if (message.listUnsubscribeMailto) {
    const { ok, detail } = await sendMailtoUnsubscribe(message.listUnsubscribeMailto);
    return recordAction(
      message.fromAddress,
      messageId,
      "mailto",
      ok ? "sent" : "pending",
      message.listUnsubscribeMailto,
      detail
    );
  }

  if (message.listUnsubscribeHttp) {
    return recordAction(
      message.fromAddress,
      messageId,
      "manual_link",
      "pending",
      message.listUnsubscribeHttp,
      "Sender did not mark this link as one-click safe; open it yourself to confirm."
    );
  }

  const scraped = findUnsubscribeLinkInHtml(message.bodyHtml);
  if (scraped) {
    return recordAction(
      message.fromAddress,
      messageId,
      "manual_link",
      "pending",
      scraped,
      "No List-Unsubscribe header; link found in the message body."
    );
  }

  return recordAction(
    message.fromAddress,
    messageId,
    "manual_link",
    "failed",
    "",
    "No unsubscribe method found for this sender. Consider blocking them instead."
  );
}

export function blockSender(address: string, reason: string): void {
  db.prepare(
    `INSERT INTO blocked_senders (address, reason) VALUES (?, ?)
     ON CONFLICT(address) DO UPDATE SET reason = excluded.reason`
  ).run(address.toLowerCase(), reason);

  db.prepare(`UPDATE messages SET archived = 1 WHERE lower(from_address) = ?`).run(
    address.toLowerCase()
  );
}

export function unblockSender(address: string): void {
  db.prepare(`DELETE FROM blocked_senders WHERE address = ?`).run(address.toLowerCase());
}

export function isSenderBlocked(address: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM blocked_senders WHERE address = ?`)
    .get(address.toLowerCase());
  return Boolean(row);
}
