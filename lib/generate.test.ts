import { describe, expect, it } from "vitest";
import { formatTitleRecommendation } from "./generate";

describe("formatTitleRecommendation", () => {
  it("title-cases recommendations and quotes the beat name", () => {
    expect(
      formatTitleRecommendation(
        "[FREE] Drake type beat - Free Throws",
        "Free Throws",
      ),
    ).toBe('[FREE] Drake Type Beat - "Free Throws"');
  });

  it("normalizes separators and preserves common music acronyms", () => {
    expect(
      formatTitleRecommendation(
        "free drake x future r&b type beat 2026 — late night",
        "Late Night",
      ),
    ).toBe('[FREE] Drake x Future R&B Type Beat 2026 - "Late Night"');
  });
});
