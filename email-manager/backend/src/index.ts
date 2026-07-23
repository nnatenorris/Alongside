import express from "express";
import cors from "cors";
import cron from "node-cron";
import { config } from "./config";
import "./db"; // ensures schema is created before routes touch it
import { messagesRouter } from "./routes/messages";
import { vipRouter } from "./routes/vip";
import { rulesRouter } from "./routes/rules";
import { unsubscribeRouter } from "./routes/unsubscribe";
import { digestRouter } from "./routes/digest";
import { syncRouter } from "./routes/sync";
import { runSync } from "./imap/sync";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, demoMode: config.demoMode }));

app.use("/api/messages", messagesRouter);
app.use("/api/vip", vipRouter);
app.use("/api/rules", rulesRouter);
app.use("/api", unsubscribeRouter);
app.use("/api/digest", digestRouter);
app.use("/api/sync", syncRouter);

app.listen(config.port, () => {
  console.log(`Email manager API listening on :${config.port} (demo mode: ${config.demoMode})`);
});

runSync().catch((err) => console.error("Initial sync failed:", err));

if (config.syncCron) {
  cron.schedule(config.syncCron, () => {
    runSync().catch((err) => console.error("Scheduled sync failed:", err));
  });
  console.log(`Background sync scheduled: ${config.syncCron}`);
}
