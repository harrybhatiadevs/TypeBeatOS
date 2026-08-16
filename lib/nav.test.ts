import { describe, expect, it } from "vitest";
import { pathMatches } from "./nav";

describe("pathMatches", () => {
  it("matches a route and its descendants", () => {
    expect(pathMatches("/settings", "/settings")).toBe(true);
    expect(pathMatches("/settings/security", "/settings")).toBe(true);
  });

  it("does not match a route that only shares a prefix", () => {
    expect(pathMatches("/dashboard-old", "/dashboard")).toBe(false);
  });

  it("supports related route aliases", () => {
    expect(pathMatches("/packages/pkg_123", "/beats", ["/packages"])).toBe(true);
  });
});
