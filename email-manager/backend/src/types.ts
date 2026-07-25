export type Category =
  | "primary"
  | "promotions"
  | "social"
  | "updates"
  | "forums"
  | "junk";

export type Importance = "high" | "normal" | "low";

export interface ParsedListUnsubscribe {
  mailto: string | null;
  http: string | null;
  oneClick: boolean; // RFC 8058 List-Unsubscribe-Post: One-Click
}

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
  date: string; // ISO
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
  isBulk: boolean; // Precedence: bulk / List-Id present
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

export type UnsubscribeMethod = "one_click" | "mailto" | "manual_link";
export type UnsubscribeStatus = "pending" | "sent" | "confirmed" | "failed";

export interface UnsubscribeAction {
  id: number;
  senderAddress: string;
  messageId: number;
  method: UnsubscribeMethod;
  status: UnsubscribeStatus;
  target: string;
  detail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionSummary {
  senderAddress: string;
  senderName: string;
  category: Category;
  messageCount: number;
  lastReceived: string;
  hasUnsubscribeLink: boolean;
  unsubscribeStatus: UnsubscribeStatus | "none";
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
