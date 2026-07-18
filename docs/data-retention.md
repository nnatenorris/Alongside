# Data retention & deletion policy

This governs the one thing this app stores that matters: a recipient's recorded
reaction. Source videos (YouTube/TikTok/Reels) are never downloaded or
re-hosted — only embedded via each platform's official player.

## Two clocks

- **Unviewed reactions** are kept up to **30 days** from capture. A reminder
  notification goes out around day 25 if the sender still hasn't opened it.
- **Once the sender has opened the replay at least once**, a **7-day** window
  starts. After that, the reaction is deleted regardless of unviewed status.
- **The recipient can delete their reaction at any time, for any reason,
  unconditionally.** This overrides both clocks above. It's their likeness;
  that right is not negotiable.

## Saving is a separate permission from sending

Consenting to record and send a reaction is not consent to let the sender
keep it indefinitely. A "Save" action is only available if the recipient
granted a distinct, explicit permission at capture time (off by default).
Without it, "Save" is visibly present but disabled, with a one-line reason —
never silently missing.

## Screenshots — handled per platform, not pretended away

- **Android:** the replay screen sets `FLAG_SECURE`, which blocks screenshots
  and screen recording outright while it's on screen.
- **iOS:** there is no equivalent block. Instead, the app listens for
  `UIApplication.userDidTakeScreenshotNotification` and notifies the
  recipient after the fact ("Jordan took a screenshot of your reaction").

Don't claim iOS prevents screenshots — it doesn't, and design/copy should
reflect that honestly.

## Deletion is real deletion

A scheduled job hard-deletes the object from storage (S3/GCS) — never a
soft-delete flag left in the database. Every signed URL used to fetch a
reaction is short-lived (~1 hour) independent of the retention window above,
so a leaked link can't be replayed indefinitely.

## What outlives the video

Only the consent record — the `allow` / `watch_only` decision and its
timestamp — kept for dispute resolution. It's a boolean and a date, not
biometric data, so ordinary log-retention rules apply.

Explicitly out of scope, permanently: no emotion detection, no face
embeddings, no derived biometric data of any kind. That line stays fixed
even if it looks like a "fun feature" later — it would move this from video
storage into BIPA/GDPR biometric-data territory for no real product gain.

## Account deletion cascades

Deleting an account removes every reaction that person ever recorded,
everywhere it was sent — not just their own account data. Built in from the
first migration, since retrofitting a right-to-erasure flow after data
exists is much harder than including it from day one.
