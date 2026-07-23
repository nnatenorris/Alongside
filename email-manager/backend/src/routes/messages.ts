import { Router } from "express";
import { Category, Importance } from "../types";
import { getMessageRow, listMessages, rowToMessage, setMessageFlags, snoozeMessage } from "../mail/repository";

export const messagesRouter = Router();

messagesRouter.get("/", (req, res) => {
  const { category, importance, archived, seen, search, vipOnly, limit } = req.query;
  const messages = listMessages({
    category: category as Category | undefined,
    importance: importance as Importance | undefined,
    archived: archived === "true",
    seen: seen === "true" ? true : seen === "false" ? false : undefined,
    search: typeof search === "string" && search.length ? search : undefined,
    vipOnly: vipOnly === "true",
    limit: limit ? Number(limit) : undefined,
  });
  res.json({ messages });
});

messagesRouter.get("/:id", (req, res) => {
  const row = getMessageRow(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({ message: rowToMessage(row) });
});

messagesRouter.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { seen, flagged, archived } = req.body ?? {};
  setMessageFlags(id, { seen, flagged, archived });
  const row = getMessageRow(id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({ message: rowToMessage(row) });
});

messagesRouter.post("/:id/snooze", (req, res) => {
  const id = Number(req.params.id);
  const until = typeof req.body?.until === "string" ? req.body.until : null;
  snoozeMessage(id, until);
  const row = getMessageRow(id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json({ message: rowToMessage(row) });
});

messagesRouter.post("/bulk", (req, res) => {
  const { ids, action } = req.body ?? {};
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: "ids[] required" });
  }
  for (const id of ids) {
    if (action === "archive") setMessageFlags(Number(id), { archived: true });
    else if (action === "unarchive") setMessageFlags(Number(id), { archived: false });
    else if (action === "markRead") setMessageFlags(Number(id), { seen: true });
    else if (action === "markUnread") setMessageFlags(Number(id), { seen: false });
    else if (action === "flag") setMessageFlags(Number(id), { flagged: true });
    else if (action === "unflag") setMessageFlags(Number(id), { flagged: false });
  }
  res.json({ ok: true, count: ids.length });
});
