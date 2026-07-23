import { describe, expect, it } from "vitest";
import { bandImportance, scoreImportance } from "../src/mail/importance";

describe("importance", () => {
  it("bands VIP senders as high regardless of category", () => {
    const score = scoreImportance({
      category: "promotions",
      isVip: true,
      isBulk: true,
      toCount: 1,
      subject: "Newsletter",
      hasAttachments: false,
    });
    expect(bandImportance(score)).toBe("high");
  });

  it("bands a direct, non-bulk primary reply as high", () => {
    const score = scoreImportance({
      category: "primary",
      isVip: false,
      isBulk: false,
      toCount: 1,
      subject: "Re: Sunday dinner?",
      hasAttachments: false,
    });
    expect(bandImportance(score)).toBe("high");
  });

  it("bands bulk promotions as low", () => {
    const score = scoreImportance({
      category: "promotions",
      isVip: false,
      isBulk: true,
      toCount: 20,
      subject: "Flash sale!",
      hasAttachments: false,
    });
    expect(bandImportance(score)).toBe("low");
  });

  it("bands junk as low", () => {
    const score = scoreImportance({
      category: "junk",
      isVip: false,
      isBulk: false,
      toCount: 1,
      subject: "You won!!!",
      hasAttachments: false,
    });
    expect(bandImportance(score)).toBe("low");
  });
});
