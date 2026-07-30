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
  // js.stripe.com: Stripe.js for embedded checkout.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // Stripe.js talks to api.stripe.com; embedded checkout to checkout.stripe.com.
  "connect-src 'self' https://api.anthropic.com https://oauth2.googleapis.com https://www.googleapis.com https://api.stripe.com https://checkout.stripe.com",
  // Embedded Stripe checkout + 3DS render inside Stripe-hosted iframes.
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
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

function withSecurityHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(HEADERS)) res.headers.set(k, v);
  if (IS_PROD) {
    for (const [k, v] of Object.entries(PROD_ONLY_HEADERS)) res.headers.set(k, v);
  }
  return res;
}

export function middleware(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostname = (forwardedHost || req.headers.get("host") || req.nextUrl.hostname)
    .split(":")[0]
    .toLowerCase();

  // Both domains terminate at the same Azure app. Permanently consolidate the
  // www host so crawlers and users see a single public URL for every page.
  if (hostname === "www.typebeatos.com") {
    const canonicalUrl = req.nextUrl.clone();
    canonicalUrl.protocol = "https:";
    canonicalUrl.hostname = "typebeatos.com";
    canonicalUrl.port = "";
    return withSecurityHeaders(NextResponse.redirect(canonicalUrl, 308));
  }

  // Honour an upstream request ID (load balancer, fetch caller) if present;
  // otherwise mint one. The downstream handler will see it via headers().
  const requestId = req.headers.get("x-request-id") || newRequestId();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("x-request-id", requestId);
  return withSecurityHeaders(res);
}

export const config = {
  // Skip Next internals + static assets. Apply to everything else, incl. API routes.
  //
  // Also skip the routes that receive multipart audio uploads via Server Actions
  // (beat create + edit). When middleware runs on a route, Next clones the request
  // body through PassThrough streams to hand it to the middleware; behind the
  // Cloudflare→Azure (HTTP/2) proxy that clone ends multi-MB multipart bodies
  // early, so React Flight reading the uploaded File throws "Connection closed"
  // and the action never runs. Bypassing middleware lets the body stream straight
  // to the handler. (Small/urlencoded actions survive the clone, which is why a
  // no-audio submit worked.)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|beats/new|beats/[^/]+/edit|api/beats|api/stripe).*)",
  ],
};
