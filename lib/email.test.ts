import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { _resolveForTests } from "./email";

const originalKey = process.env.RESEND_API_KEY;

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  vi.restoreAllMocks();
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
});

describe("email service picker", () => {
  it("picks the console stub when RESEND_API_KEY is unset", () => {
    const svc = _resolveForTests();
    expect(svc.provider).toBe("console");
  });

  it("picks the resend provider when RESEND_API_KEY is set", () => {
    process.env.RESEND_API_KEY = "re_live_test_key";
    const svc = _resolveForTests();
    expect(svc.provider).toBe("resend");
  });

  it("treats whitespace-only keys as unset", () => {
    process.env.RESEND_API_KEY = "   ";
    const svc = _resolveForTests();
    expect(svc.provider).toBe("console");
  });
});

describe("ConsoleEmail.send", () => {
  it("returns a synthetic id and the console provider", async () => {
    const svc = _resolveForTests();
    const res = await svc.send({
      to: "producer@example.com",
      subject: "Reset your password",
      html: "<a href='https://example.com/reset?t=abc'>Reset</a>",
    });
    expect(res.provider).toBe("console");
    expect(res.id).toMatch(/^console-/);
  });
});

describe("ResendEmail.send", () => {
  it("POSTs the payload to the resend API and returns the message id", async () => {
    process.env.RESEND_API_KEY = "re_live_test_key";
    const svc = _resolveForTests();
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "msg_abc123" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await svc.send({
      to: "producer@example.com",
      subject: "Welcome",
      html: "<p>Welcome</p>",
    });

    expect(res.id).toBe("msg_abc123");
    expect(res.provider).toBe("resend");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer re_live_test_key");
    const body = JSON.parse(init.body as string);
    expect(body.to).toBe("producer@example.com");
    expect(body.subject).toBe("Welcome");
  });

  it("throws on non-2xx response", async () => {
    process.env.RESEND_API_KEY = "re_live_test_key";
    const svc = _resolveForTests();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("forbidden", { status: 403 }))
    );
    await expect(
      svc.send({ to: "x@y.z", subject: "s", html: "<p>h</p>" })
    ).rejects.toThrow(/403/);
  });
});
