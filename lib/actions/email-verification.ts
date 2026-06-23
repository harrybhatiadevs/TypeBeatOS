"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth-server";
import { authLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";
import { getUser } from "@/lib/auth";

/**
 * Re-send the email verification link to the currently signed-in user.
 * Rate-limited by IP. Always redirects with a generic confirmation so
 * timing doesn't leak whether email send succeeded vs. failed silently.
 */
export async function resendVerificationEmail() {
  const user = await getUser();
  if (!user) redirect("/login");

  const ip = await getClientIp();
  const gate = await authLimiter.consume(ip);
  if (!gate.allowed) {
    // Silently no-op on rate limit — the user can try again in a minute
    // and the banner stays put either way.
    redirect("/dashboard");
  }

  try {
    await auth.api.sendVerificationEmail({
      body: { email: user.email, callbackURL: "/verify" },
      headers: await headers(),
    });
  } catch (err) {
    if (!(err instanceof APIError)) throw err;
    // Already verified, or another expected condition — let the banner
    // stick around until the user actually clicks the email link.
  }

  redirect("/dashboard");
}
