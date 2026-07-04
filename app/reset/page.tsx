import type { Metadata } from "next";
import Link from "next/link";
import { completePasswordReset } from "@/lib/actions/password-reset";
import FormSubmitButton from "../FormSubmitButton";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Reset your password — TypeBeatOS",
};

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <div className="tb-page tb-page-auth" data-testid="reset-page">
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <nav className="tb-nav tb-nav-auth">
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
          <h1 className="tb-auth-heading">
            Set a new <br />
            <span className="tb-red">password.</span>
          </h1>

          {!token ? (
            <>
              <p className="tb-auth-sub">
                This link is missing its token. Request a fresh reset email and
                use the new link.
              </p>
              <p className="tb-auth-alt" style={{ textAlign: "left" }}>
                <Link href="/forgot">Send a new reset link</Link>
              </p>
            </>
          ) : (
            <>
              <p className="tb-auth-sub">
                Pick something you&apos;ll remember. Minimum 8 characters.
              </p>

              {error && <div className="tb-auth-error">{error}</div>}

              <form action={completePasswordReset} className="tb-auth-form">
                <input type="hidden" name="token" value={token} />
                <div className="tb-auth-field">
                  <label htmlFor="password">New password</label>
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
                <FormSubmitButton className="tb-auth-submit" pendingLabel="Resetting...">
                  Reset password
                </FormSubmitButton>
              </form>

              <p className="tb-auth-alt">
                Remembered it? <Link href="/login">Log in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
