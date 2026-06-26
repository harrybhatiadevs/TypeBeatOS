import { resendVerificationEmail } from "@/lib/actions/email-verification";

/**
 * Persistent banner in the authenticated app chrome, shown until the
 * producer verifies their email. Soft-gate - does not block any flow,
 * just nudges. The banner disappears the moment `User.emailVerified`
 * flips to true (Better-Auth does that on verification link click).
 */
export default function VerifyEmailBanner({ email }: { email: string }) {
  return (
    <div className="tb-verify-banner" role="status">
      <span className="tb-verify-dot" aria-hidden="true" />
      <div className="tb-verify-copy">
        <strong>Verify your email.</strong> Check <code>{email}</code> to keep
        account email available.
      </div>
      <form action={resendVerificationEmail} className="tb-verify-action">
        <button type="submit" className="copy-btn">Resend</button>
      </form>
    </div>
  );
}
