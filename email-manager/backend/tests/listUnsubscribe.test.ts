import { describe, expect, it } from "vitest";
import { findUnsubscribeLinkInHtml, parseListUnsubscribe } from "../src/lib/listUnsubscribe";

describe("parseListUnsubscribe", () => {
  it("parses both mailto and http targets", () => {
    const result = parseListUnsubscribe(
      "<mailto:unsub@list.example?subject=unsubscribe>, <https://list.example/u/123>",
      null
    );
    expect(result.mailto).toBe("mailto:unsub@list.example?subject=unsubscribe");
    expect(result.http).toBe("https://list.example/u/123");
  });

  it("marks one-click only when both the http link and the post header are present", () => {
    const withPost = parseListUnsubscribe(
      "<https://list.example/u/123>",
      "List-Unsubscribe=One-Click"
    );
    expect(withPost.oneClick).toBe(true);

    const withoutPost = parseListUnsubscribe("<https://list.example/u/123>", null);
    expect(withoutPost.oneClick).toBe(false);
  });

  it("returns nulls for a missing header", () => {
    const result = parseListUnsubscribe(null, null);
    expect(result.mailto).toBeNull();
    expect(result.http).toBeNull();
    expect(result.oneClick).toBe(false);
  });
});

describe("findUnsubscribeLinkInHtml", () => {
  it("finds a link by visible text", () => {
    const html = '<p>Thanks!</p><a href="https://list.example/opt-out">Unsubscribe</a>';
    expect(findUnsubscribeLinkInHtml(html)).toBe("https://list.example/opt-out");
  });

  it("finds a link by href hint when text is generic", () => {
    const html = '<a href="https://list.example/manage-subscription">click here</a>';
    expect(findUnsubscribeLinkInHtml(html)).toBe("https://list.example/manage-subscription");
  });

  it("returns null when nothing matches", () => {
    const html = '<a href="https://example.com/about">About us</a>';
    expect(findUnsubscribeLinkInHtml(html)).toBeNull();
  });
});
