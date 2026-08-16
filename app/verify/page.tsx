import type { Metadata } from "next";
import Link from "next/link";
import PublicNav from "../PublicNav";
import "../marketing.css";

export const metadata: Metadata = {
  title: "Email verified — TypeBeatOS",
  robots: { index: false, follow: true },
};

/**
 * Landing page after Better-Auth's /api/auth/verify-email redirect.
 * Better-Auth handles the actual verification + sets emailVerified=true;
 * this page is just the confirmation screen the user sees.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="tb-page tb-page-auth" data-testid="verify-page">
      <div className="tb-glow-layer" aria-hidden="true">
        <div className="tb-glow tb-glow-left" />
        <div className="tb-glow tb-glow-right" />
      </div>
      <div className="tb-grain" aria-hidden="true" />

      <PublicNav
        action={{ href: "/dashboard", label: "Open dashboard" }}
      />

      <main className="tb-auth-wrap">
        <div className="tb-auth-card">

          {error ? (
            <>
              <h1 className="tb-auth-heading">
                Link <br />
                <span className="tb-red">expired.</span>
              </h1>
              <p className="tb-auth-sub">
                That verification link is no longer valid — they expire after a
                few hours and after a single use. Sign in and request a fresh
                one from the dashboard banner.
              </p>
              <p className="tb-auth-alt" style={{ textAlign: "left" }}>
                <Link href="/login">Log in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="tb-auth-heading">
                You&apos;re <br />
                <span className="tb-red">verified.</span>
              </h1>
              <p className="tb-auth-sub">
                Your email is confirmed. Future password resets, weekly digests,
                and upload-failure alerts will land in your inbox.
              </p>
              <p className="tb-auth-alt" style={{ textAlign: "left" }}>
                <Link href="/dashboard">Open the dashboard</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
