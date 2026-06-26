import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Sign up - TypeBeatOS",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="tb-page" data-testid="signup-page">
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
        <Link href="/login" className="tb-nav-cta">Log in</Link>
      </nav>

      <main className="tb-auth-wrap">
        <div className="tb-auth-card">
          <div className="tb-eyebrow">
            <span className="tb-eyebrow-dot" aria-hidden="true" />
            Free account
          </div>
          <h1 className="tb-auth-heading">
            Create your <span className="tb-red">workspace.</span>
          </h1>
          <p className="tb-auth-sub">Start free. No card required.</p>

          {error && <div className="tb-auth-error">{error}</div>}

          <form action={signup} className="tb-auth-form">
            <div className="tb-auth-field">
              <label htmlFor="producerName">Producer name</label>
              <input
                id="producerName"
                name="producerName"
                type="text"
                autoComplete="nickname"
                placeholder="prod. yourname"
                className="tb-auth-input"
              />
            </div>
            <div className="tb-auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@studio.com"
                className="tb-auth-input"
              />
            </div>
            <div className="tb-auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="8+ characters"
                className="tb-auth-input"
              />
            </div>
            <button type="submit" className="tb-auth-submit">Create account</button>
          </form>

          <p className="tb-auth-alt">
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
