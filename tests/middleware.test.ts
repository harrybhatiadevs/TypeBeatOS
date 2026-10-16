import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "../middleware";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

describe("multipart upload middleware bypass", () => {
  it.each(["/api/beats", "/api/beats/beat-1", "/api/batches/batch-1/items/item-1"])(
    "streams %s directly to the upload handler", (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
    },
  );

  it.each(["/api/batches", "/api/batches/batch-1", "/dashboard"])(
    "keeps middleware on %s", (url) => {
      expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
    },
  );
});

describe("canonical host middleware", () => {
  it("permanently redirects www URLs to the apex domain", () => {
    const response = middleware(
      new NextRequest("https://www.typebeatos.com/privacy?source=google"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://typebeatos.com/privacy?source=google",
    );
  });

  it("honours the forwarded host used by the production proxy", () => {
    const response = middleware(
      new NextRequest("https://internal.example/youtube", {
        headers: { "x-forwarded-host": "www.typebeatos.com" },
      }),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://typebeatos.com/youtube",
    );
  });

  it("does not redirect the canonical domain", () => {
    const response = middleware(
      new NextRequest("https://typebeatos.com/privacy"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });
});
