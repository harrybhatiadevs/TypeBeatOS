import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Log in - TypeBeatOS",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <div className="tb-page" data-testid="login-page">
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
        <Link href="/signup" className="tb-nav-cta">Sign up</Link>
      </nav>

      <main className="tb-auth-wrap">
        <div className="tb-auth-card">
          <div className="tb-eyebrow">
            <span className="tb-eyebrow-dot" aria-hidden="true" />
            Producer log in
          </div>
          <h1 className="tb-auth-heading">
            Welcome <span className="tb-red">back.</span>
          </h1>
          <p className="tb-auth-sub">Log in to continue your upload queue.</p>

          {reset && (
            <div className="tb-auth-notice tb-auth-notice-success">
              Password updated. Log in with your new password.
            </div>
          )}
          {error && <div className="tb-auth-error">{error}</div>}

          <form action={login} className="tb-auth-form">
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
                autoComplete="current-password"
                className="tb-auth-input"
              />
            </div>
            <button type="submit" className="tb-auth-submit">Log in</button>
          </form>

          <div className="tb-auth-links">
            <p className="tb-auth-alt">
              Forgot your password? <Link href="/forgot">Reset it</Link>
            </p>
            <p className="tb-auth-alt">
              New here? <Link href="/signup">Create account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
