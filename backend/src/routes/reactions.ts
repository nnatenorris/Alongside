import express, { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { getShareById, saveReaction } from "../lib/store";

export const reactionsRouter = Router({ mergeParams: true });

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Dev-mode stand-in for a real signed S3/GCS URL: the client PUTs the raw
// file straight to this server instead. Swapping in real object storage
// later only changes what /init returns and where /upload writes to.
reactionsRouter.post("/init", async (req, res) => {
  const { id } = req.params as { id: string };
  const share = getShareById(id);
  if (!share) {
    return res.status(404).json({ error: "share not found" });
  }
  const base = process.env.PUBLIC_BASE_URL ?? "http://localhost:4000";
  res.json({
    upload_url: `${base}/shares/${id}/reaction/upload`,
    method: "PUT",
  });
});

reactionsRouter.put(
  "/upload",
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const share = getShareById(id);
    if (!share) {
      return res.status(404).json({ error: "share not found" });
    }
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "no file body received" });
    }
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, `${id}.mp4`), req.body);
    res.status(204).end();
  },
);

reactionsRouter.post("/complete", async (req, res) => {
  const { id } = req.params as { id: string };
  const share = getShareById(id);
  if (!share) {
    return res.status(404).json({ error: "share not found" });
  }
  const { captured_from, duration } = req.body;
  if (typeof captured_from !== "number" || typeof duration !== "number") {
    return res.status(400).json({ error: "captured_from and duration must be numbers" });
  }
  saveReaction({
    shareId: id,
    filePath: path.join(UPLOADS_DIR, `${id}.mp4`),
    capturedFrom: captured_from,
    duration,
    completedAt: new Date().toISOString(),
  });
  res.status(201).json({ recorded: true });
});

reactionsRouter.get("/", async (req, res) => {
  // TODO: return a signed GET URL + sync offsets for the replay screen
  res.status(501).json({ error: "not implemented" });
});
