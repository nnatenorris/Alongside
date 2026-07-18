import { randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import { reactionsRouter } from "./reactions";
import { parseYouTubeUrl, resolveYouTubeVideo } from "../lib/youtube";
import { saveShare } from "../lib/store";
import { sendShareSms } from "../lib/sms";

export const sharesRouter = Router();

sharesRouter.post("/", async (req, res) => {
  const { source_url, start_offset, recipient_phone } = req.body;

  if (typeof source_url !== "string" || !source_url) {
    return res.status(400).json({ error: "source_url is required" });
  }

  let videoId: string, startSeconds: number;
  try {
    ({ videoId, startSeconds } = parseYouTubeUrl(source_url));
  } catch {
    return res.status(400).json({ error: "that doesn't look like a valid link" });
  }
  if (!videoId) {
    return res.status(400).json({ error: "couldn't find a YouTube video in that link" });
  }

  let video;
  try {
    video = await resolveYouTubeVideo(videoId);
  } catch {
    return res.status(422).json({ error: "couldn't look up that video" });
  }

  const id = randomUUID();
  const token = randomBytes(6).toString("base64url");
  const startOffset = typeof start_offset === "number" ? start_offset : startSeconds;

  saveShare({
    id,
    token,
    sourceUrl: source_url,
    videoId,
    startOffset,
    title: video.title,
    thumbnailUrl: video.thumbnailUrl,
    recipientPhone: recipient_phone ?? null,
    createdAt: new Date().toISOString(),
  });

  const shareLink = `${process.env.PUBLIC_BASE_URL ?? "https://alongside.app"}/s/${token}`;

  if (recipient_phone) {
    try {
      await sendShareSms(recipient_phone, shareLink);
    } catch (err) {
      console.error("SMS send failed:", err);
    }
  }

  res.status(201).json({
    share_id: id,
    share_link: shareLink,
    title: video.title,
    thumbnail_url: video.thumbnailUrl,
    start_offset: startOffset,
  });
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
