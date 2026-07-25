import { Category } from "../types";

export interface CategorizeInput {
  fromAddress: string;
  fromName: string;
  subject: string;
  bodyText: string;
  listId: string | null;
  precedenceBulk: boolean;
  hasListUnsubscribe: boolean;
}

// Matched as a substring of the sender's domain, so it still catches
// regional/localized sending domains (e.g. facebookmail.com,
// notifications.linkedin.com) without needing an exhaustive exact list.
const SOCIAL_DOMAIN_HINTS = [
  "facebookmail",
  "facebook.com",
  "twitter.com",
  "x.com",
  "linkedin",
  "instagram",
  "pinterest",
  "tiktok",
  "snapchat",
  "reddit.com",
  "nextdoor",
  "meetup.com",
];

const FORUM_HINTS = ["groups.google.com", "googlegroups.com", "discourse", "forum", "listserv", "mailman"];

const UPDATES_KEYWORDS = [
  "receipt",
  "invoice",
  "order confirmation",
  "order #",
  "your order",
  "shipped",
  "delivered",
  "tracking number",
  "statement",
  "your bill",
  "payment received",
  "payment due",
  "security alert",
  "verify your",
  "sign-in",
  "sign in attempt",
  "reset your password",
  "confirm your",
  "account update",
  "itinerary",
  "booking confirmation",
  "appointment",
];

const PROMOTIONS_KEYWORDS = [
  "% off",
  "sale",
  "deal",
  "coupon",
  "promo",
  "discount",
  "limited time",
  "buy now",
  "free shipping",
  "clearance",
  "newsletter",
  "exclusive offer",
  "shop now",
  "flash sale",
  "best price",
  "reward invite",
  "rewards program",
  "you could win",
  "don't miss your",
  "leave your feedback",
  "compare prices",
  "member exclusive",
  "special offer",
];

// Marketing-automation platforms wrap every link in a long, cryptic
// tracking URL (campaign/recipient IDs baked into the path). A real
// person's email essentially never contains more than one of these, so two
// or more is a strong "this is bulk mail" signal even when the sender
// skipped List-Unsubscribe/List-Id/Precedence entirely.
const TRACKING_LINK_PATTERN = /https?:\/\/\S{40,}/g;

function countTrackingLinks(text: string): number {
  return (text.match(TRACKING_LINK_PATTERN) || []).length;
}

const SPAM_KEYWORDS = [
  "viagra",
  "lottery",
  "you've won",
  "you have won",
  "congratulations you",
  "click here now",
  "work from home",
  "weight loss miracle",
  "wire transfer",
  "nigerian prince",
  "crypto giveaway",
  "act now",
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/** Whether a message counts as bulk/automated mail — shared with ingest.ts
 * so the stored `is_bulk` flag always matches what categorize() used. */
export function isBulkSignal(input: CategorizeInput): boolean {
  return (
    input.precedenceBulk ||
    Boolean(input.listId) ||
    input.hasListUnsubscribe ||
    countTrackingLinks(input.bodyText) >= 2
  );
}

export function categorize(input: CategorizeInput): Category {
  const domain = input.fromAddress.split("@")[1]?.toLowerCase() ?? "";
  const subjectLower = input.subject.toLowerCase();
  const bodyLower = input.bodyText.toLowerCase().slice(0, 4000);
  const combined = `${subjectLower} ${bodyLower}`;

  const isShouting =
    input.subject.length > 8 &&
    input.subject === input.subject.toUpperCase() &&
    /[A-Z]/.test(input.subject);
  const spamHits = SPAM_KEYWORDS.filter((k) => combined.includes(k)).length;
  if (spamHits >= 2 || (spamHits >= 1 && isShouting)) {
    return "junk";
  }

  if (SOCIAL_DOMAIN_HINTS.some((hint) => domain.includes(hint))) {
    return "social";
  }

  const looksLikeForum =
    (input.listId && FORUM_HINTS.some((h) => input.listId!.toLowerCase().includes(h))) ||
    FORUM_HINTS.some((h) => domain.includes(h));
  if (looksLikeForum) {
    return "forums";
  }

  const updatesHit = includesAny(combined, UPDATES_KEYWORDS);
  const promoHit = includesAny(combined, PROMOTIONS_KEYWORDS);
  const isBulkMail = isBulkSignal(input);

  if (promoHit || (isBulkMail && !updatesHit)) {
    return "promotions";
  }

  if (updatesHit) {
    return "updates";
  }

  return "primary";
}
