/**
 * Branded transactional-email templates. Each template returns an
 * `EmailPayload` ready to feed into `email.send()`. HTML is intentionally
 * inline-styled because most clients (Gmail mobile, Outlook) strip head
 * styles. Plain-text fallback is generated automatically.
 */
import type { EmailPayload } from "./email";

const ACCENT = "#ed072c";
const BG = "#000";
const PANEL = "#0d0d10";
const TEXT = "#faf7f7";
const TEXT_DIM = "rgba(255, 255, 255, 0.62)";

function shell(body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:${TEXT};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG};padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:${PANEL};border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <tr><td>
        <div style="font-size:14px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${TEXT};">
          TYPEBEAT<span style="color:${ACCENT};">OS</span>
        </div>
        <div style="margin-top:24px;">${body}</div>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:36px 0 20px;" />
        <div style="font-size:12px;color:${TEXT_DIM};line-height:1.6;">
          You're getting this because someone — probably you — used this email at typebeatos.com. If it wasn't you, you can ignore this message and nothing will change.
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;padding:14px 28px;border-radius:9999px;font-weight:700;letter-spacing:0.02em;">${label}</a>`;
}

export function resetPasswordEmail({
  to,
  resetUrl,
}: {
  to: string;
  resetUrl: string;
}): EmailPayload {
  const html = shell(`
    <h1 style="margin:0;font-size:24px;font-weight:800;line-height:1.2;color:${TEXT};">Reset your password</h1>
    <p style="margin:14px 0 0;color:${TEXT_DIM};line-height:1.55;font-size:15px;">
      Click the button to set a new password. The link is valid for one hour. If you didn't ask to reset your password, ignore this message.
    </p>
    <div style="margin:28px 0 6px;">${button("Set a new password", resetUrl)}</div>
    <p style="margin:18px 0 0;color:${TEXT_DIM};font-size:13px;word-break:break-all;">
      Or paste this link into your browser:<br/>
      <a href="${resetUrl}" style="color:${ACCENT};">${resetUrl}</a>
    </p>
  `);
  const text = [
    "Reset your TypeBeatOS password",
    "",
    "Click the link to set a new password. Valid for one hour.",
    "",
    resetUrl,
    "",
    "If you didn't ask to reset your password, ignore this message.",
  ].join("\n");
  return {
    to,
    subject: "Reset your TypeBeatOS password",
    html,
    text,
  };
}
