/**
 * Better-Auth server config.
 *
 * Mounted at /api/auth/[...all] (see app/api/auth/[...all]/route.ts).
 * The schema in prisma/schema.prisma already has the four required
 * Better-Auth tables (User, Session, Account, Verification) with the
 * field names Better-Auth expects, so no extra adapter mapping is
 * needed beyond pointing the Prisma adapter at our client.
 *
 * Session cookies use the existing `tbos_session` cookie name so any
 * live sessions issued by the legacy code path keep working until they
 * naturally expire.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { email } from "./email";
import { resetPasswordEmail, verifyEmailEmail } from "./email-templates";

const IS_PROD = process.env.NODE_ENV === "production";
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const DATABASE_PROVIDER = process.env.DATABASE_URL?.startsWith("postgres")
  ? "postgresql"
  : "sqlite";

export const auth = betterAuth({
  baseURL: APP_URL,
  appName: "TypeBeatOS",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: DATABASE_PROVIDER }),

  // Email + password — the only flow we expose today. Magic links + OAuth
  // social login can be turned on later by adding to this config block.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    // Better-Auth issues the reset token + a URL containing it, then
    // invokes this callback to deliver it. We hand it to our email
    // service — which logs to console in dev / sends via Resend in
    // prod (see lib/email.ts).
    sendResetPassword: async ({ user, url }) => {
      const tmpl = resetPasswordEmail({ to: user.email, resetUrl: url });
      await email.send(tmpl);
    },
  },

  // Email verification — soft rollout. Send on signup but don't require
  // verification to use the app yet (no `requireEmailVerification`). A
  // banner in the app chrome reminds unverified producers to confirm;
  // verification flips `User.emailVerified` so the banner disappears.
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const tmpl = verifyEmailEmail({
        to: user.email,
        verifyUrl: url,
        producerName: user.name || undefined,
      });
      await email.send(tmpl);
    },
  },

  session: {
    expiresIn: 7 * 24 * 60 * 60,  // require a fresh sign-in every 7 days
    disableSessionRefresh: true,   // fixed lifetime; activity does not extend it
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,             // 5 minutes
    },
  },

  advanced: {
    cookies: {
      // Keep the existing cookie name so legacy sessions survive the swap.
      session_token: { name: "tbos_session" },
    },
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: IS_PROD,
    },
  },

  trustedOrigins: [APP_URL],

  // nextCookies plugin ensures Set-Cookie headers from server actions
  // get persisted to the response (Next 15 quirk).
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
