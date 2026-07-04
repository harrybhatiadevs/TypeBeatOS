import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import FormSubmitButton from "../FormSubmitButton";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Forgot your password — TypeBeatOS",
};

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="tb-page tb-page-auth" data-testid="forgot-page">
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
        <Link href="/login" className="tb-nav-cta">Back to log in</Link>
      </nav>

      <main className="tb-auth-wrap">
        <div className="tb-auth-card">
          <h1 className="tb-auth-heading">
            Forgot it? <br />
            <span className="tb-red">no stress.</span>
          </h1>

          {sent ? (
            <>
              <p className="tb-auth-sub">
                If an account exists for that email, we&apos;ve sent a reset
                link. It expires in one hour.
              </p>
              <p className="tb-auth-alt" style={{ textAlign: "left" }}>
                <Link href="/login">Back to log in</Link>
              </p>
            </>
          ) : (
            <>
              <p className="tb-auth-sub">
                Drop in the email you signed up with. We&apos;ll send you a link
                to set a new password.
              </p>

              {error && <div className="tb-auth-error">{error}</div>}

              <form action={requestPasswordReset} className="tb-auth-form">
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
                <FormSubmitButton className="tb-auth-submit" pendingLabel="Sending link...">
                  Email me a reset link
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
