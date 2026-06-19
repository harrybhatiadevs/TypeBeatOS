import { beforeEach, describe, expect, it } from "vitest";
import { _resetForTests, createLimiter } from "./rate-limit";

beforeEach(() => {
  _resetForTests();
});

describe("createLimiter", () => {
  it("allows requests under the cap", async () => {
    const lim = createLimiter({ name: "t1", limit: 3, windowMs: 1000 });
    for (let i = 0; i < 3; i++) {
      const r = await lim.consume("ip-a");
      expect(r.allowed).toBe(true);
    }
  });

  it("denies the request that crosses the cap", async () => {
    const lim = createLimiter({ name: "t2", limit: 2, windowMs: 1000 });
    expect((await lim.consume("ip-a")).allowed).toBe(true);
    expect((await lim.consume("ip-a")).allowed).toBe(true);
    const denied = await lim.consume("ip-a");
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetMs).toBeGreaterThan(0);
  });

  it("keys buckets independently", async () => {
    const lim = createLimiter({ name: "t3", limit: 1, windowMs: 1000 });
    expect((await lim.consume("ip-a")).allowed).toBe(true);
    expect((await lim.consume("ip-b")).allowed).toBe(true);
    expect((await lim.consume("ip-a")).allowed).toBe(false);
  });

  it("namespaces buckets independently", async () => {
    const a = createLimiter({ name: "auth", limit: 1, windowMs: 1000 });
    const b = createLimiter({ name: "waitlist", limit: 1, windowMs: 1000 });
    expect((await a.consume("ip")).allowed).toBe(true);
    // Same key but different namespace — must not collide.
    expect((await b.consume("ip")).allowed).toBe(true);
    expect((await a.consume("ip")).allowed).toBe(false);
  });

  it("resets after the window elapses", async () => {
    const lim = createLimiter({ name: "t4", limit: 1, windowMs: 20 });
    expect((await lim.consume("ip-a")).allowed).toBe(true);
    expect((await lim.consume("ip-a")).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect((await lim.consume("ip-a")).allowed).toBe(true);
  });

  it("decreases remaining count as hits accumulate", async () => {
    const lim = createLimiter({ name: "t5", limit: 3, windowMs: 1000 });
    const a = await lim.consume("ip-a");
    const b = await lim.consume("ip-a");
    const c = await lim.consume("ip-a");
    expect(a.remaining).toBe(2);
    expect(b.remaining).toBe(1);
    expect(c.remaining).toBe(0);
  });
});
