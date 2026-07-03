"use client";

import { useEffect } from "react";
import Link from "next/link";
import "./marketing.css";

/**
 * Top-level error boundary for the app. Catches runtime errors thrown
 * by any route segment that doesn't have its own error.tsx. The reset()
 * callback re-renders the segment that errored — useful for transient
 * failures (rate-limited fetch, network blip).
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the server-side correlation id (matches the request-id
    // breadcrumb in our structured logs); the message is suppressed in
    // production so we log it here to keep client-side debugging cheap.
    if (process.env.NODE_ENV !== "production") {
      console.error("[TypeBeatOS] route error", error);
    }
  }, [error]);

  return (
    <div className="tb-page" data-testid="error-page">
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <nav className="tb-nav">
        <Link href="/" className="tb-brand" aria-label="TypeBeatOS home">
          <span className="tb-badge" aria-hidden="true" />
          <span className="tb-wordmark">
            TYPEBEAT<span>OS</span>
          </span>
        </Link>
        <Link href="/" className="tb-nav-cta">Back home</Link>
      </nav>

      <section className="tb-final">
        <h1 className="tb-final-h2">
          The signal <br />
          <span className="tb-red">dropped.</span>
        </h1>
        <p
          className="tb-hero-sub"
          style={{ marginTop: "2rem", marginBottom: "1.5rem", textAlign: "center", maxWidth: "32rem" }}
        >
          A transient failure broke this page mid-render. Try again, and if it
          keeps happening, head home and reopen the route fresh.
        </p>
        {error.digest && (
          <p
            style={{
              marginBottom: "1.5rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: "0.78rem",
              color: "rgba(255, 255, 255, 0.4)",
            }}
          >
            ref · {error.digest}
          </p>
        )}
        <div className="tb-hero-actions" style={{ justifyContent: "center" }}>
          <button type="button" onClick={() => reset()} className="tb-final-btn">
            Try again
          </button>
          <Link href="/" className="tb-cta-ghost">Back home</Link>
        </div>
      </section>
    </div>
  );
}
