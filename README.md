# Alongside

Send a friend a clip. Instead of guessing what they thought, watch their
reaction — captured automatically while they watch, synced back to the
moment it happened.

Phase 0 scope: YouTube links only, async delivery only. See
[`docs/data-retention.md`](docs/data-retention.md) for the data handling
policy, and the project's design artifact for the full product sketch
(screens, platform feasibility, architecture, replay-sync mechanics).

## Structure

- `mobile/` — React Native app (sender + recipient-with-app experience)
- `backend/` — API: share creation, consent logging, reaction upload/delivery
- `docs/` — policy and reference docs

## Status

Core flow implemented end-to-end: share creation, consent, reaction capture,
and sender replay. All async, YouTube-only (Phase 0 scope).
