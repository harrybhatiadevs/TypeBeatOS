/**
 * Transactional email service.
 *
 * Two implementations: a console stub (dev / when RESEND_API_KEY isn't
 * set) and a real Resend provider. The active implementation is picked
 * at module load based on env vars so callers always import the same
 * symbol.
 *
 * The console stub is more than a debug log — when password-reset and
 * email-verify flows ship, the operator can actually copy the URL out
 * of `npm run dev` output and complete the flow without a working
 * email account. That keeps the entire auth surface testable end-to-end
 * before the Resend signup happens.
 */
import { loggerFor } from "./logger";

const log = loggerFor("email");

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  /** Optional plain-text fallback. Most clients use this when html doesn't render. */
  text?: string;
  /** From address override. Defaults to env EMAIL_FROM, then a noreply default. */
  from?: string;
};

export type SendResult = {
  /** Provider message id, or a synthetic id for the console stub. */
  id: string;
  /** "console" | "resend" — handy for logs + tests. */
  provider: string;
};

export interface EmailService {
  send(payload: EmailPayload): Promise<SendResult>;
  /** Public name of the active provider, e.g. for status pages. */
  readonly provider: string;
}

const DEFAULT_FROM =
  process.env.EMAIL_FROM || "TypeBeatOS <no-reply@typebeatos.local>";

/**
 * Console stub. Prints the email payload (subject + a snippet of the
 * body — which usually contains a one-time URL like the password-reset
 * link) and returns a synthetic id. Used in dev and as a safe default
 * until Resend is wired.
 *
 * Uses `console.log` directly rather than the structured logger so it
 * still works when pino's worker transport has crashed — the password
 * reset flow must not be silently broken by an unrelated logger bug.
 */
class ConsoleEmail implements EmailService {
  readonly provider = "console";
  async send(payload: EmailPayload): Promise<SendResult> {
    const id = `console-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const preview = stripTags(payload.text || payload.html).slice(0, 320);
    // eslint-disable-next-line no-console
    console.log(
      "\n[email · console stub]\n" +
        `  id:      ${id}\n` +
        `  to:      ${payload.to}\n` +
        `  from:    ${payload.from || DEFAULT_FROM}\n` +
        `  subject: ${payload.subject}\n` +
        `  preview: ${preview}\n`
    );
    return { id, provider: this.provider };
  }
}

/**
 * Real Resend provider. Built lazily so the dynamic import only happens
 * when RESEND_API_KEY is set — `resend` isn't pulled into the bundle of
 * a server that's running in console-stub mode.
 */
class ResendEmail implements EmailService {
  readonly provider = "resend";
  private apiKey: string;
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  async send(payload: EmailPayload): Promise<SendResult> {
    // POST to the Resend HTTP API. Going via fetch (not the SDK) keeps
    // the bundle small + avoids adding a runtime dep for a 6-line call.
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        from: payload.from || DEFAULT_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      try {
        log.error(
          { provider: this.provider, status: res.status, body: body.slice(0, 300) },
          "resend send failed"
        );
      } catch {
        // eslint-disable-next-line no-console
        console.error("[email · resend] send failed", res.status, body.slice(0, 300));
      }
      throw new Error(`Email send failed (${res.status})`);
    }
    const data = (await res.json()) as { id: string };
    try {
      log.info(
        { provider: this.provider, id: data.id, to: payload.to, subject: payload.subject },
        "email sent"
      );
    } catch {
      // Logger transport may have died — the send itself succeeded.
    }
    return { id: data.id, provider: this.provider };
  }
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pickService(): EmailService {
  const key = process.env.RESEND_API_KEY;
  if (key && key.trim()) return new ResendEmail(key.trim());
  return new ConsoleEmail();
}

export const email: EmailService = pickService();

/**
 * Re-resolve the active service. Tests use this after swapping
 * process.env.RESEND_API_KEY to verify the picker logic. Production
 * code should keep using the cached `email` export.
 */
export function _resolveForTests(): EmailService {
  return pickService();
}
