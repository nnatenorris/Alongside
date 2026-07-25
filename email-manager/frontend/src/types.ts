export type Category = "primary" | "promotions" | "social" | "updates" | "forums" | "junk";
export type Importance = "high" | "normal" | "low";
export type UnsubscribeStatus = "pending" | "sent" | "confirmed" | "failed" | "none";

export interface StoredMessage {
  id: number;
  uid: number;
  folder: string;
  messageId: string;
  fromName: string;
  fromAddress: string;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  hasAttachments: boolean;
  seen: boolean;
  flagged: boolean;
  archived: boolean;
  listUnsubscribeMailto: string | null;
  listUnsubscribeHttp: string | null;
  listUnsubscribeOneClick: boolean;
  isBulk: boolean;
  category: Category;
  importance: Importance;
  importanceScore: number;
  isVip: boolean;
  snoozedUntil: string | null;
  createdAt: string;
}

export type RuleMatchType = "sender" | "domain" | "subject_contains";
export type RuleAction = "category" | "archive" | "block" | "mark_important";

export interface Rule {
  id: number;
  matchType: RuleMatchType;
  matchValue: string;
  action: RuleAction;
  actionValue: string | null;
  createdAt: string;
}

export interface Vip {
  address: string;
  label: string;
  addedAt: string;
}

export interface SubscriptionSummary {
  senderAddress: string;
  senderName: string;
  category: Category;
  messageCount: number;
  lastReceived: string;
  hasUnsubscribeLink: boolean;
  unsubscribeStatus: UnsubscribeStatus;
  isBlocked: boolean;
}

export interface DigestData {
  generatedAt: string;
  totalUnread: number;
  byCategory: Record<Category, number>;
  highImportanceUnread: StoredMessage[];
  newSubscriptionsDetected: number;
  topSenders: { address: string; name: string; count: number }[];
}
