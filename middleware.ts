import { NextRequest, NextResponse } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

// Lightweight, dependency-free request ID. We don't need cryptographic
// uniqueness — just enough to correlate logs across a request.
function newRequestId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${rand}`;
}

// Single source of truth for our security headers.
// CSP is intentionally lenient on script-src (Next.js needs inline + eval for hydration);
// tighten after we move to nonced server-rendered scripts post-launch.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://api.anthropic.com https://oauth2.googleapis.com https://www.googleapis.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "X-DNS-Prefetch-Control": "on",
};

const PROD_ONLY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function middleware(req: NextRequest) {
  // Honour an upstream request ID (load balancer, fetch caller) if present;
  // otherwise mint one. The downstream handler will see it via headers().
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-request-id", requestId);
  for (const [k, v] of Object.entries(HEADERS)) res.headers.set(k, v);
  if (IS_PROD) {
    for (const [k, v] of Object.entries(PROD_ONLY_HEADERS)) res.headers.set(k, v);
  }
  return res;
}

export const config = {
  // Skip Next internals + static assets. Apply to everything else, incl. API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
