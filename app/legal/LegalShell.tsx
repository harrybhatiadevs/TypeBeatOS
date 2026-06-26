import Link from "next/link";
import "../marketing.css";
import "./legal.css";

/**
 * Shared chrome for privacy / terms / future legal pages. The same
 * .tb-page surface as the marketing pages but with a narrower prose
 * column and a small "DRAFT" callout the operator can flip once a
 * lawyer has signed off.
 */
export default function LegalShell({
  eyebrow,
  title,
  updated,
  isDraft,
  children,
}: {
  eyebrow: string;
  title: string;
  /** ISO date string, e.g. "2026-06-20" */
  updated: string;
  isDraft: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="tb-page" data-testid="legal-page">
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

      <main className="tb-legal">
        <header className="tb-legal-header">
          <div className="tb-eyebrow">
            <span className="tb-eyebrow-dot" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="tb-auth-heading tb-legal-title">{title}</h1>
          <p className="tb-legal-meta">Last updated · {updated}</p>
        </header>

        {isDraft && (
          <div className="tb-legal-callout" role="note">
            <strong>Draft.</strong> This document is a scaffold pending
            legal review. Placeholders like{" "}
            <span className="tb-legal-placeholder">[jurisdiction]</span>{" "}
            mark sections that need jurisdiction-specific text before launch.
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
