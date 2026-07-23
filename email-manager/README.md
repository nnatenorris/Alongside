# Inbox Manager (AOL email assistant)

A self-hosted tool for day-to-day AOL inbox management: mail sorted by
importance, organized into categories, with one-click unsubscribe from
newsletters and junk mail.

It's a local web app — a small API server that talks to your AOL account
over IMAP, plus a dashboard you open in your browser. Nothing leaves your
machine except the connections to AOL itself (and, when you unsubscribe,
to the sender's unsubscribe link).

## What it does

- **Categorizes mail** into Primary / Updates / Promotions / Social /
  Forums / Junk, similar to Gmail's tabs, using sender/domain/content
  heuristics — no data leaves your machine to do this.
- **Scores importance** (High / Normal / Low) based on VIP senders, whether
  a message was sent directly to you vs. as bulk mail, and conversation
  signals — so the stuff that matters floats to the top.
- **Unsubscribes for you**: parses the `List-Unsubscribe` header (RFC 2369)
  and, when the sender supports it, performs a true one-click unsubscribe
  per RFC 8058. Falls back to emailing a `mailto:` unsubscribe address, or
  surfacing the link for you to confirm when it's not marked safe to
  automate.
- **Subscription cleanup view**: every mailing list/newsletter sender
  you've received mail from, sorted by volume, with unsubscribe/block in
  one click.
- **VIP senders & custom rules**: always flag mail from specific people as
  important; auto-archive, auto-categorize, or block by sender/domain/
  subject.
- **Daily digest**: unread counts by category, what needs your attention,
  and newly-detected subscriptions.
- Standard inbox actions: read/unread, flag, archive, snooze, search, and
  bulk actions on multiple messages at once.

See [`docs/FEATURES.md`](docs/FEATURES.md) for the full list and the
reasoning behind the categorization/importance/unsubscribe logic.

## Structure

- `backend/` — Node/TypeScript API: IMAP sync, local SQLite cache,
  categorization + importance scoring, unsubscribe engine, REST API.
- `frontend/` — React/Vite dashboard that talks to the API.

## Quick start (try it without an AOL account)

The backend runs in **demo mode** automatically when no AOL credentials
are configured — it seeds realistic sample mail so you can try every
feature before connecting your real inbox.

```bash
cd email-manager/backend
npm install
npm run dev          # http://localhost:4100, demo mode

# in another terminal
cd email-manager/frontend
npm install
npm run dev           # http://localhost:5173
```

Open http://localhost:5173.

## Connect your real AOL account

See [`docs/SETUP.md`](docs/SETUP.md) — you'll need to generate an AOL
**app password** (your regular password won't work over IMAP) and drop it
into `backend/.env`. Full setup takes about five minutes.

## Tests

```bash
cd email-manager/backend
npm test
```
