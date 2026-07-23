import { Router } from "express";
import { db } from "../db";
import { latestMessageIdForSender, latestUnsubscribeStatus, listSubscriptions } from "../mail/repository";
import { attemptUnsubscribe, blockSender, isSenderBlocked, unblockSender } from "../mail/unsubscribe";
import { SubscriptionSummary } from "../types";

export const unsubscribeRouter = Router();

unsubscribeRouter.get("/subscriptions", (_req, res) => {
  const rows = listSubscriptions();
  const summaries: SubscriptionSummary[] = rows.map((r) => ({
    senderAddress: r.senderAddress,
    senderName: r.senderName,
    category: r.category,
    messageCount: r.messageCount,
    lastReceived: r.lastReceived,
    hasUnsubscribeLink: Boolean(r.hasUnsubscribeLink),
    unsubscribeStatus: latestUnsubscribeStatus(r.senderAddress),
    isBlocked: isSenderBlocked(r.senderAddress),
  }));
  res.json({ subscriptions: summaries });
});

unsubscribeRouter.post("/messages/:id/unsubscribe", async (req, res) => {
  try {
    const action = await attemptUnsubscribe(Number(req.params.id));
    res.json({ action });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

unsubscribeRouter.post("/senders/:address/unsubscribe", async (req, res) => {
  const messageId = latestMessageIdForSender(req.params.address);
  if (!messageId) {
    return res.status(404).json({ error: "No unsubscribable message found for this sender" });
  }
  try {
    const action = await attemptUnsubscribe(messageId);
    res.json({ action });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

unsubscribeRouter.post("/senders/:address/block", (req, res) => {
  blockSender(req.params.address, req.body?.reason ?? "manual block");
  res.json({ ok: true });
});

unsubscribeRouter.delete("/senders/:address/block", (req, res) => {
  unblockSender(req.params.address);
  res.json({ ok: true });
});

unsubscribeRouter.get("/actions", (_req, res) => {
  const rows = db
    .prepare(`SELECT * FROM unsubscribe_actions ORDER BY created_at DESC LIMIT 100`)
    .all();
  res.json({ actions: rows });
});
