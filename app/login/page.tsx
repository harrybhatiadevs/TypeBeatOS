import type { Metadata } from "next";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import FormSubmitButton from "../FormSubmitButton";
import PublicNav from "../PublicNav";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Log in — TypeBeatOS",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <div className="tb-page tb-page-auth" data-testid="login-page">
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <PublicNav action={{ href: "/signup", label: "Sign up" }} />

      <main className="tb-auth-wrap">
        <div className="tb-auth-card">
          <h1 className="tb-auth-heading">
            Welcome <span className="tb-red">back.</span>
          </h1>
          <p className="tb-auth-sub">Pick up where you left off.</p>

          {reset && (
            <div
              className="tb-auth-error"
              style={{
                borderColor: "rgba(110, 231, 161, 0.4)",
                background: "rgba(110, 231, 161, 0.08)",
                color: "#6ee7a1",
              }}
            >
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
            <FormSubmitButton className="tb-auth-submit" pendingLabel="Logging in...">
              Log in
            </FormSubmitButton>
          </form>

          <div className="tb-auth-links">
            <p className="tb-auth-alt">
              Forgot your password? <Link href="/forgot">Reset it</Link>
            </p>
            <p className="tb-auth-alt">
              New here? <Link href="/signup">Create a free account</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
