import { Router } from "express";

export const reactionsRouter = Router({ mergeParams: true });

reactionsRouter.post("/init", async (req, res) => {
  // TODO: issue a signed upload URL (S3/GCS) for this share's reaction clip
  res.status(501).json({ error: "not implemented" });
});

reactionsRouter.post("/complete", async (req, res) => {
  const { captured_from, captured_to, duration } = req.body;
  // TODO: mark reaction ready, push-notify the sender
  res.status(501).json({ error: "not implemented" });
});

reactionsRouter.get("/", async (req, res) => {
  // TODO: return a signed GET URL + sync offsets for the replay screen
  res.status(501).json({ error: "not implemented" });
});
