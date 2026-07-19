import { randomBytes, randomUUID } from "crypto";
import { Router } from "express";
import { reactionsRouter } from "./reactions";
import { parseYouTubeUrl, resolveYouTubeVideo } from "../lib/youtube";
import {
  getConsentByShareId,
  getReactionByShareId,
  getShareById,
  getShareByToken,
  recordConsent,
  saveShare,
} from "../lib/store";
import { sendShareSms } from "../lib/sms";

export const sharesRouter = Router();

sharesRouter.post("/", async (req, res) => {
  const { source_url, start_offset, recipient_phone, sender_name } = req.body;

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
    senderName: sender_name ?? null,
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
    video_id: videoId,
    title: video.title,
    thumbnail_url: video.thumbnailUrl,
    start_offset: startOffset,
  });
});

sharesRouter.get("/:token", async (req, res) => {
  const share = getShareByToken(req.params.token);
  if (!share) {
    return res.status(404).json({ error: "this link isn't valid" });
  }
  res.json({
    share_id: share.id,
    video_id: share.videoId,
    title: share.title,
    thumbnail_url: share.thumbnailUrl,
    sender_name: share.senderName ?? "Someone",
    start_offset: share.startOffset,
  });
});

sharesRouter.get("/:id/status", async (req, res) => {
  const share = getShareById(req.params.id);
  if (!share) {
    return res.status(404).json({ error: "share not found" });
  }
  const consent = getConsentByShareId(share.id);
  let status: "pending" | "watch_only" | "awaiting_reaction" | "reacted";
  if (!consent) {
    status = "pending";
  } else if (consent.decision === "watch_only") {
    status = "watch_only";
  } else {
    status = getReactionByShareId(share.id) ? "reacted" : "awaiting_reaction";
  }
  res.json({ status });
});

sharesRouter.post("/:id/consent", async (req, res) => {
  const share = getShareById(req.params.id);
  if (!share) {
    return res.status(404).json({ error: "share not found" });
  }
  const { decision } = req.body;
  if (decision !== "allow" && decision !== "watch_only") {
    return res.status(400).json({ error: "decision must be 'allow' or 'watch_only'" });
  }
  const consent = recordConsent(share.id, decision);
  res.status(201).json({ recorded: true, decided_at: consent.decidedAt });
});

sharesRouter.use("/:id/reaction", reactionsRouter);
