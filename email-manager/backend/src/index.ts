import express from "express";
import cors from "cors";
import cron from "node-cron";
import fs from "node:fs";
import path from "node:path";
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

// Serve the built frontend from the same server/port for day-to-day use,
// so there's only one process to run instead of separate frontend/backend
// dev servers. Falls back to index.html for any non-API route (the app is
// a single-page app with no server-side routes of its own).
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexHtml = path.join(frontendDist, "index.html");
if (fs.existsSync(frontendIndexHtml)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(frontendIndexHtml);
  });
} else {
  app.get("/", (_req, res) => {
    res
      .status(503)
      .send(
        "Frontend isn't built yet. Run: cd ../frontend && npm install && npm run build — then restart this server."
      );
  });
}

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
