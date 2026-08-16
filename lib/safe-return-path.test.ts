import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safe-return-path";

describe("safeReturnPath", () => {
  const fallback = "/settings?tab=profile";

  it("keeps a normal in-app path and query", () => {
    expect(safeReturnPath("/onboarding?step=3", fallback)).toBe(
      "/onboarding?step=3",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "///evil.example",
    "/\\evil.example",
    "settings",
    "",
  ])("rejects an unsafe return value: %s", (value) => {
    expect(safeReturnPath(value, fallback)).toBe(fallback);
  });
});
