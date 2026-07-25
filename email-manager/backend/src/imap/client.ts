import { ImapFlow } from "imapflow";
import { config } from "../config";

export function createImapClient(): ImapFlow {
  if (!config.hasImapCredentials) {
    throw new Error("IMAP credentials not configured (EMAIL_USER / EMAIL_APP_PASSWORD)");
  }
  return new ImapFlow({
    host: config.imapHost,
    port: config.imapPort,
    secure: true,
    auth: {
      user: config.emailUser,
      pass: config.emailAppPassword,
    },
    logger: false,
  });
}
