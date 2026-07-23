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
];

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

  const isBulkMail = input.precedenceBulk || Boolean(input.listId) || input.hasListUnsubscribe;

  if (promoHit || (isBulkMail && !updatesHit)) {
    return "promotions";
  }

  if (updatesHit) {
    return "updates";
  }

  return "primary";
}
