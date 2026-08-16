import { resendVerificationEmail } from "@/lib/actions/email-verification";
import FormSubmitButton from "@/app/FormSubmitButton";

/**
 * Persistent banner in the authenticated app chrome, shown until the
 * producer verifies their email. Soft-gate — does not block any flow,
 * just nudges. The banner disappears the moment `User.emailVerified`
 * flips to true (Better-Auth does that on verification link click).
 */
export default function VerifyEmailBanner({ email }: { email: string }) {
  return (
    <div className="tb-verify-banner" role="status">
      <span className="tb-verify-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="14" x="3" y="5" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
      <div className="tb-verify-copy">
        <strong>Verify your email</strong>
        <span>
          Check <code>{email}</code> for your verification link. This secures
          password recovery and email updates.
        </span>
      </div>
      <form action={resendVerificationEmail} className="tb-verify-action">
        <FormSubmitButton className="copy-btn" pendingLabel="Sending...">
          Resend
        </FormSubmitButton>
      </form>
    </div>
  );
}
