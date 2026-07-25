import { describe, expect, it } from "vitest";
import { categorize } from "../src/mail/categorize";

describe("categorize", () => {
  it("flags obvious spam", () => {
    const category = categorize({
      fromAddress: "claims@intl-prize-notice.example",
      fromName: "Prize Committee",
      subject: "CONGRATULATIONS YOU HAVE WON $2,500,000!!!",
      bodyText: "CONGRATULATIONS YOU HAVE WON! Click here now for a wire transfer.",
      listId: null,
      precedenceBulk: false,
      hasListUnsubscribe: false,
    });
    expect(category).toBe("junk");
  });

  it("routes known social domains to social", () => {
    const category = categorize({
      fromAddress: "notification@facebookmail.com",
      fromName: "Facebook",
      subject: "You have 3 new notifications",
      bodyText: "See what you missed.",
      listId: null,
      precedenceBulk: true,
      hasListUnsubscribe: true,
    });
    expect(category).toBe("social");
  });

  it("routes mailing-list digests to forums", () => {
    const category = categorize({
      fromAddress: "digest@groups.google.com",
      fromName: "Neighbors Digest",
      subject: "[Neighbors] Daily Digest",
      bodyText: "12 new messages today.",
      listId: "<neighbors.groups.google.com>",
      precedenceBulk: true,
      hasListUnsubscribe: true,
    });
    expect(category).toBe("forums");
  });

  it("routes marketing keywords + unsubscribe header to promotions", () => {
    const category = categorize({
      fromAddress: "deals@email.retailer.example",
      fromName: "Retailer Deals",
      subject: "Flash Sale: 60% OFF this weekend only!",
      bodyText: "Shop now and save. Limited time offer, free shipping.",
      listId: null,
      precedenceBulk: true,
      hasListUnsubscribe: true,
    });
    expect(category).toBe("promotions");
  });

  it("routes transactional keywords to updates", () => {
    const category = categorize({
      fromAddress: "alerts@bankofexample.com",
      fromName: "Bank of Example",
      subject: "Your statement is ready to view",
      bodyText: "Your July statement is now available.",
      listId: null,
      precedenceBulk: false,
      hasListUnsubscribe: false,
    });
    expect(category).toBe("updates");
  });

  it("routes marketing mail with no bulk headers but tracking-link-heavy body to promotions", () => {
    // Real-world case: sender impersonates a brand ("Customer Experience
    // Team") from an unrelated ESP domain, sets no List-Unsubscribe/List-Id/
    // Precedence, and the body is just several long tracking-redirect URLs.
    const trackingLink =
      "http://vibesnew.com/zvlbqpron!66812121541/61736497:zgzkjfss/7167303.yzokcjg/85lowctrlpimg1.jpeg";
    const category = categorize({
      fromAddress: "ivortionloustran@quartz.vibesnew.com",
      fromName: "Customer Experience Team",
      subject: "Don't miss your Lowe's reward invite",
      bodyText: `${trackingLink} ${trackingLink} ${trackingLink}`,
      listId: null,
      precedenceBulk: false,
      hasListUnsubscribe: false,
    });
    expect(category).toBe("promotions");
  });

  it("defaults personal mail to primary", () => {
    const category = categorize({
      fromAddress: "mom@example.com",
      fromName: "Mom",
      subject: "Re: Sunday dinner?",
      bodyText: "Are you still coming Sunday?",
      listId: null,
      precedenceBulk: false,
      hasListUnsubscribe: false,
    });
    expect(category).toBe("primary");
  });
});
