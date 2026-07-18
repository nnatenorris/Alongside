import { Router } from "express";
import { reactionsRouter } from "./reactions";

export const sharesRouter = Router();

sharesRouter.post("/", async (req, res) => {
  const { source_url, start_offset, recipient_phone } = req.body;
  // TODO: resolve via YouTube oEmbed, persist the share, send SMS if recipient_phone is set
  res.status(501).json({ error: "not implemented" });
});

sharesRouter.get("/:token", async (req, res) => {
  // TODO: return title/thumbnail/sender name for the open screen
  res.status(501).json({ error: "not implemented" });
});

sharesRouter.post("/:id/consent", async (req, res) => {
  const { decision } = req.body; // "allow" | "watch_only"
  // TODO: log the consent decision with a timestamp
  res.status(501).json({ error: "not implemented" });
});

sharesRouter.use("/:id/reaction", reactionsRouter);
