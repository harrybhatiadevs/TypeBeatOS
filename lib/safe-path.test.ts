import { describe, expect, it } from "vitest";
import path from "path";
import { safeResolveUnder } from "./safe-path";

const ROOT = path.resolve("/tmp/tbos-uploads");

describe("safeResolveUnder", () => {
  it("resolves a clean nested path under the root", () => {
    const out = safeResolveUnder(ROOT, ["audio", "abc123.mp3"]);
    expect(out).toBe(path.join(ROOT, "audio", "abc123.mp3"));
  });

  it("rejects empty segment lists", () => {
    expect(safeResolveUnder(ROOT, [])).toBeNull();
  });

  it("rejects '..' segments (the classic traversal attempt)", () => {
    expect(safeResolveUnder(ROOT, ["..", "etc", "passwd"])).toBeNull();
    expect(safeResolveUnder(ROOT, ["audio", "..", "..", "etc", "passwd"])).toBeNull();
  });

  it("rejects '.' segments", () => {
    expect(safeResolveUnder(ROOT, [".", "audio", "abc.mp3"])).toBeNull();
  });

  it("rejects segments containing a forward slash", () => {
    expect(safeResolveUnder(ROOT, ["audio/abc.mp3"])).toBeNull();
    expect(safeResolveUnder(ROOT, ["../etc"])).toBeNull();
  });

  it("rejects segments containing a backslash", () => {
    expect(safeResolveUnder(ROOT, ["audio\\abc.mp3"])).toBeNull();
  });

  it("rejects segments containing a null byte", () => {
    expect(safeResolveUnder(ROOT, ["audio", "abc.mp3\0.exe"])).toBeNull();
  });

  it("rejects empty string segments", () => {
    expect(safeResolveUnder(ROOT, ["audio", "", "abc.mp3"])).toBeNull();
  });

  it("non-string segments are rejected", () => {
    // Defensive: TypeScript prevents this at the type level, but a runtime
    // value could still slip through in a misuse.
    expect(safeResolveUnder(ROOT, [undefined as unknown as string])).toBeNull();
    expect(safeResolveUnder(ROOT, [null as unknown as string])).toBeNull();
  });

  it("normalises through path.resolve so a relative root is handled", () => {
    const out = safeResolveUnder("uploads", ["thumbs", "x.png"]);
    expect(out).toBe(path.resolve("uploads", "thumbs", "x.png"));
  });
});
