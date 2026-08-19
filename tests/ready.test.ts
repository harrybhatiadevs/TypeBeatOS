import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/ready/route";

describe("readiness probe", () => {
  it("reports ok without any database access", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({ status: "ok" });
  });

  // Regression guard for the Neon bill: the Container Apps readiness probe hits
  // this route every 15s. A `db` import here — even an unused one — re-opens the
  // path that kept Neon's compute awake 24/7. Database health belongs in
  // /api/health, which nothing polls on a timer.
  it("does not import the database client", () => {
    const source = readFileSync(
      path.join(__dirname, "..", "app", "api", "ready", "route.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/from\s+["']@\/lib\/db["']/);
  });
});
