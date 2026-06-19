import { headers } from "next/headers";
import type { Logger } from "pino";
import { loggerFor } from "./logger";

const REQUEST_ID_HEADER = "x-request-id";

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
