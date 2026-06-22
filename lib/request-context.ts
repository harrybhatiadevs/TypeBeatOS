import { headers } from "next/headers";
import type { Logger } from "pino";
import { loggerFor } from "./logger";

const REQUEST_ID_HEADER = "x-request-id";

/**
 * Best-effort client IP. Checks the usual proxy headers in priority order;
 * falls back to "unknown" so callers can still use it as a rate-limit key
 * (the rate limit just becomes shared across unknown clients, which is
 * the conservative outcome).
 */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) {
      // XFF is a comma-separated list; the first entry is the original client.
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
    return "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Return the request ID injected by middleware. Returns `null` outside
 * of a request scope (background workers, scripts, tests).
 */
export async function getRequestId(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get(REQUEST_ID_HEADER);
  } catch {
    return null;
  }
}

/**
 * Get a logger child bound to the current request ID + the supplied module
 * name. Falls back to a module-only logger if there's no request context.
 */
export async function reqLogger(module: string, extra?: Record<string, unknown>): Promise<Logger> {
  const requestId = await getRequestId();
  return loggerFor(module, { requestId: requestId ?? undefined, ...(extra ?? {}) });
}
