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

const IS_PROD = process.env.NODE_ENV === "production";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL: APP_URL,
  appName: "TypeBeatOS",
  database: prismaAdapter(db, { provider: "sqlite" }),

  // Email + password — the only flow we expose today. Magic links + OAuth
  // social login can be turned on later by adding to this config block.
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  session: {
    expiresIn: 30 * 24 * 60 * 60, // 30 days, same as the legacy session
    updateAge: 24 * 60 * 60,      // refresh every 24h
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
