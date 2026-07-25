import { simpleParser } from "mailparser";
import { config } from "../config";
import { createImapClient } from "./client";
import { ingestMessage } from "../mail/ingest";
import { seedDemoData } from "../lib/seedData";

export interface SyncSummary {
  mode: "live" | "demo";
  folder: string;
  fetched: number;
}

async function syncLive(): Promise<SyncSummary[]> {
  const client = createImapClient();
  await client.connect();
  const summaries: SyncSummary[] = [];

  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const mailbox = client.mailbox;
      const total = typeof mailbox === "object" && mailbox ? mailbox.exists : 0;
      if (!total) {
        summaries.push({ mode: "live", folder: "INBOX", fetched: 0 });
      } else {
        const start = Math.max(1, total - config.syncFetchLimit + 1);
        let fetched = 0;
        for await (const msg of client.fetch(`${start}:*`, {
          uid: true,
          envelope: true,
          flags: true,
          source: true,
        })) {
          if (!msg.source) continue;
          const parsed = await simpleParser(msg.source);
          ingestMessage({
            uid: msg.uid,
            folder: "INBOX",
            messageId: parsed.messageId || `generated-${msg.uid}@inbox`,
            fromName: parsed.from?.value?.[0]?.name || "",
            fromAddress: (parsed.from?.value?.[0]?.address || "").toLowerCase(),
            toAddresses: (Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : [])
              .flatMap((t) => t.value.map((v) => v.address || "")),
            ccAddresses: (Array.isArray(parsed.cc) ? parsed.cc : parsed.cc ? [parsed.cc] : [])
              .flatMap((t) => t.value.map((v) => v.address || "")),
            subject: parsed.subject || "(no subject)",
            date: parsed.date || new Date(),
            bodyText: parsed.text || "",
            bodyHtml: typeof parsed.html === "string" ? parsed.html : "",
            hasAttachments: (parsed.attachments?.length ?? 0) > 0,
            seen: msg.flags?.has("\\Seen") ?? false,
            flagged: msg.flags?.has("\\Flagged") ?? false,
            listUnsubscribeHeader: (parsed.headers.get("list-unsubscribe") as string) || null,
            listUnsubscribePostHeader:
              (parsed.headers.get("list-unsubscribe-post") as string) || null,
            listId: (parsed.headers.get("list-id") as string) || null,
            precedenceBulk: /bulk|list/i.test((parsed.headers.get("precedence") as string) || ""),
          });
          fetched += 1;
        }
        summaries.push({ mode: "live", folder: "INBOX", fetched });
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return summaries;
}

export async function runSync(): Promise<SyncSummary[]> {
  if (config.demoMode) {
    const fetched = seedDemoData();
    return [{ mode: "demo", folder: "INBOX", fetched }];
  }
  return syncLive();
}
