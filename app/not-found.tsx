import type { Metadata } from "next";
import Link from "next/link";
import "./marketing.css";

export const metadata: Metadata = {
  title: "Not found — TypeBeatOS",
};

export default function NotFound() {
  return (
    <div className="tb-page" data-testid="not-found-page">
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
        <div className="tb-eyebrow" style={{ marginBottom: "1.5rem" }}>
          <span className="tb-eyebrow-dot" aria-hidden="true" />
          Error 404
        </div>
        <h1 className="tb-final-h2">
          Track <br />
          <span className="tb-red">not found.</span>
        </h1>
        <p
          className="tb-hero-sub"
          style={{ marginTop: "2rem", marginBottom: "1.5rem", textAlign: "center", maxWidth: "32rem" }}
        >
          This page isn&apos;t in the catalog. Head back to the dashboard or open
          the waitlist — everything else is exactly where you left it.
        </p>
        <div className="tb-hero-actions" style={{ justifyContent: "center" }}>
          <Link href="/" className="tb-final-btn">Back home</Link>
          <Link href="/waitlist" className="tb-cta-ghost">Open waitlist</Link>
        </div>
      </section>
    </div>
  );
}
