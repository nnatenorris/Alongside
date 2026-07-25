import { Router } from "express";
import { runSync } from "../imap/sync";
import { config } from "../config";

export const syncRouter = Router();

syncRouter.post("/", async (_req, res) => {
  try {
    const summaries = await runSync();
    res.json({ summaries, demoMode: config.demoMode });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

syncRouter.get("/status", (_req, res) => {
  res.json({
    demoMode: config.demoMode,
    imapHost: config.imapHost,
    emailUser: config.emailUser ? config.emailUser.replace(/^(.{2}).*(@.*)$/, "$1***$2") : null,
    syncCron: config.syncCron || null,
  });
});
