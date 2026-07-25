# Features & how they work

## Categorization

Every synced message is assigned one category, checked in this order
(`backend/src/mail/categorize.ts`):

1. **Junk** — two or more classic spam phrases (lottery/prize/wire
   transfer/etc.), or one phrase plus a shouty all-caps subject.
2. **Social** — sender domain matches a known social network
   (Facebook, LinkedIn, Instagram, X/Twitter, Reddit, TikTok, Nextdoor,
   Pinterest, Snapchat, Meetup...).
3. **Forums** — `List-Id` header or domain looks like a mailing
   list/discussion group (Google Groups, Discourse, Mailman, listserv).
4. **Promotions** — marketing language ("% off", "sale", "limited time",
   "shop now"...) in the subject/body, or the message is bulk mail
   (`Precedence: bulk`, has a `List-Id`, or has `List-Unsubscribe`) without
   transactional language.
5. **Updates** — transactional language: receipts, shipping/tracking,
   statements, security alerts, booking confirmations.
6. **Primary** — everything else (personal mail, work mail, anything not
   caught above).

Custom rules (see below) can override the computed category for a
specific sender, domain, or subject match.

## Importance scoring

A numeric score is computed per message (`backend/src/mail/importance.ts`)
and banded into High / Normal / Low:

| Signal                                      | Points |
|----------------------------------------------|-------:|
| Sender is a VIP                               |  +100  |
| Category: Primary                             |   +10  |
| Category: Updates                             |     0  |
| Category: Forums                              |    −5  |
| Category: Social                              |   −10  |
| Category: Promotions                          |   −25  |
| Category: Junk                                |   −60  |
| Addressed only to you (not a mass "To" list)  |   +10  |
| Addressed to 6+ people                        |    −5  |
| Not bulk mail                                 |    +5  |
| Subject starts with "Re:"/"Fwd:"              |    +8  |
| Has an attachment                             |    +4  |
| Matches a "mark important" custom rule        |   +50  |

`score >= 30` → **High**, `score <= -20` → **Low**, otherwise **Normal**.
A VIP sender's mail is essentially always High regardless of category.

## Unsubscribing

When you click **Unsubscribe** (`backend/src/mail/unsubscribe.ts`), the
app picks the safest method available, in this order:

1. **One-click** (RFC 8058): if the message has both a `List-Unsubscribe`
   HTTPS link *and* `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
   the app POSTs to it automatically — this is the mechanism senders use
   specifically to say "this is safe to hit automatically, no confirmation
   needed."
2. **Mailto** (RFC 2369): if there's a `mailto:` unsubscribe address, the
   app sends the unsubscribe email via SMTP (if credentials are
   configured) or queues it for you.
3. **Plain link, not marked one-click**: shown to you to open yourself —
   the app deliberately does *not* auto-hit links the sender hasn't marked
   as safe for automated requests, since a bare GET/click could have other
   side effects on some sites.
4. **No header at all**: the app scans the message's HTML body for a link
   whose text or URL suggests "unsubscribe" / "opt out" / "manage
   subscription", and surfaces that for you to open.
5. **Nothing found**: you're offered "Block sender" instead, which stops
   future mail from that address from being imported and archives what's
   already there — a local, unconditional fallback that doesn't depend on
   the sender cooperating.

Every attempt is recorded (sender, method, status, target) so the
Subscriptions view shows history instead of re-asking.

## Subscriptions view

Aggregates every sender whose mail was flagged as bulk (`Precedence:
bulk`, has `List-Id`, or has `List-Unsubscribe`), sorted by message
volume, with one-click unsubscribe/block per sender.

## VIP senders & custom rules

- **VIP senders**: an address list; any mail from a VIP is always scored
  as important, independent of category.
- **Custom rules**: match by exact sender address, domain, or a substring
  in the subject; actions are re-categorize, always archive, always mark
  important, or block. Rules are applied on every sync, so they affect
  mail you haven't seen yet as well as future mail.

## Daily digest

Unread counts per category, the list of unread High-importance messages,
newly-detected subscriptions in the last 24 hours, and your top senders by
volume — everything you'd want to skim before diving into the inbox.

## Standard inbox actions

Read/unread, flag, archive (soft — moves out of the inbox view, doesn't
delete from AOL), snooze (hide until a later time), search across
subject/sender/snippet, and multi-select bulk actions (mark
read/unread, archive) from the message list toolbar.

## API

The frontend talks to a REST API under `/api` — see the route files in
`backend/src/routes/` for the exact shapes:

- `GET/PATCH /api/messages`, `POST /api/messages/bulk`,
  `POST /api/messages/:id/snooze`
- `GET /api/subscriptions`, `POST /api/messages/:id/unsubscribe`,
  `POST /api/senders/:address/unsubscribe`,
  `POST/DELETE /api/senders/:address/block`
- `GET/POST/DELETE /api/vip`
- `GET/POST/DELETE /api/rules`
- `GET /api/digest`
- `POST /api/sync`, `GET /api/sync/status`
