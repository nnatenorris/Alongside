# Setup: connecting your AOL account

## 1. Generate an AOL app password

AOL (like most providers) blocks IMAP/SMTP logins that use your normal
account password once 2-step verification is on, and recommends app
passwords even without it. You need one for this tool:

1. Go to https://login.aol.com/myaccount/security and sign in.
2. Under **App passwords** (sometimes labeled "Generate app password"),
   create a new one — name it something like `inbox-manager`.
3. AOL shows you a 16-character password once. Copy it now; you can't view
   it again later (you'd generate a new one instead).

Never use your real AOL account password for this tool — always use an
app password. That way, if it's ever exposed, you can revoke just that
one credential from your AOL security page without changing your main
password.

## 2. Configure the backend

```bash
cd email-manager/backend
cp .env.example .env
```

Edit `.env`:

```
EMAIL_USER=yourname@aol.com
EMAIL_APP_PASSWORD=the16charapppassword
```

`IMAP_HOST` / `IMAP_PORT` / `SMTP_HOST` / `SMTP_PORT` already default to
AOL's servers (`imap.aol.com:993`, `smtp.aol.com:465`) and normally don't
need to change.

Leaving `EMAIL_USER`/`EMAIL_APP_PASSWORD` blank keeps the server in demo
mode (seeded sample data, no network calls to AOL) — useful for trying the
app or for development.

## 3. Start it

For this first run, build the frontend once so the single-server launcher
has something to serve:

```bash
cd ../frontend
npm install
npm run build
```

Then, from the `email-manager` folder (one level up from `backend`),
double-click **`Start Inbox Manager.bat`**. It installs anything still
missing, starts the server, and opens your browser to
http://localhost:4100 automatically — you should see your real inbox,
sorted and categorized. On startup the server connects to `imap.aol.com`
over TLS and does an initial sync of your most recent messages
(`SYNC_FETCH_LIMIT`, default 200) from the Inbox.

From now on, that `.bat` file is the only thing you need to run this tool
— no terminal required. (If you're not on Windows, or you're actively
changing the code, run `npm run dev` in `backend/` directly instead; see
the main [README](../README.md) for the live-reload developer workflow.)

## 4. (Optional) background sync

By default you sync manually with the "Sync now" button. To sync on a
schedule instead, set `SYNC_CRON` in `.env`, e.g.:

```
SYNC_CRON=*/15 * * * *
```

## 5. (Optional) sending mailto: unsubscribe requests

Some senders only support unsubscribing by sending an email (a `mailto:`
link in `List-Unsubscribe`) rather than a link. The app can send that
email for you automatically using the same AOL credentials over SMTP —
no extra configuration needed once `EMAIL_USER`/`EMAIL_APP_PASSWORD` are
set. If you'd rather review before anything is sent, don't click
"Unsubscribe" on those senders — the app never sends mail without you
initiating it.

## Data & privacy notes

- Your AOL password is never stored — only the app password you put in
  `.env`, which stays on your machine and is never sent anywhere except to
  AOL's IMAP/SMTP servers over TLS.
- Message content is cached locally in a SQLite file
  (`backend/data/email-manager.sqlite` by default) so the dashboard is
  fast and can categorize/search offline. Delete that file any time to
  wipe the local cache — it will be rebuilt on the next sync.
- The only outbound requests this tool makes beyond AOL itself are: (a) an
  HTTP request to a sender's unsubscribe link, and only when you click
  "Unsubscribe" and the sender explicitly marked that link as safe for
  automated one-click unsubscribe (RFC 8058); other unsubscribe links are
  shown to you to open yourself rather than being requested automatically.
