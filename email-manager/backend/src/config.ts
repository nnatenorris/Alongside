import "dotenv/config";
import path from "node:path";

function bool(v: string | undefined): boolean {
  return Boolean(v && v.trim().length > 0);
}

export const config = {
  port: Number(process.env.PORT || 4100),

  imapHost: process.env.IMAP_HOST || "imap.aol.com",
  imapPort: Number(process.env.IMAP_PORT || 993),
  emailUser: process.env.EMAIL_USER || "",
  emailAppPassword: process.env.EMAIL_APP_PASSWORD || "",

  smtpHost: process.env.SMTP_HOST || "smtp.aol.com",
  smtpPort: Number(process.env.SMTP_PORT || 465),

  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || "./data/email-manager.sqlite"),

  syncCron: process.env.SYNC_CRON || "",
  syncFetchLimit: Number(process.env.SYNC_FETCH_LIMIT || 200),

  get hasImapCredentials(): boolean {
    return bool(process.env.EMAIL_USER) && bool(process.env.EMAIL_APP_PASSWORD);
  },
  get demoMode(): boolean {
    return !this.hasImapCredentials;
  },
};
