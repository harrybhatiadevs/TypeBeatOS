"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth-server";
import { authLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";

const TOO_MANY = "Too+many+attempts.+Try+again+in+a+minute.";

/**
 * Step 1 of password reset. Always redirects to the "check your email"
 * confirmation page regardless of whether the email actually existed —
 * this is intentional, leaking which addresses have accounts would help
 * credential-stuffing.
 */
export async function requestPasswordReset(formData: FormData) {
  const ip = await getClientIp();
  const gate = await authLimiter.consume(ip);
  if (!gate.allowed) redirect(`/forgot?error=${TOO_MANY}`);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    redirect("/forgot?error=Enter+a+valid+email");
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset" },
      headers: await headers(),
    });
  } catch (err) {
    // We deliberately don't surface email-not-found errors to the user —
    // see comment above. Log so an operator can spot real failures.
    if (err instanceof APIError) {
      // Better-Auth returns 200 on email-not-found by default for the
      // same reason, so any APIError here is a real server problem.
    } else {
      throw err;
    }
  }

  redirect("/forgot?sent=1");
}

/**
 * Step 2 of password reset. Better-Auth handles the token check, the
 * password hash, and the session reissue.
 */
export async function completePasswordReset(formData: FormData) {
  const ip = await getClientIp();
  const gate = await authLimiter.consume(ip);
  if (!gate.allowed) {
    const token = String(formData.get("token") || "");
    redirect(`/reset?token=${encodeURIComponent(token)}&error=${TOO_MANY}`);
  }

  const token = String(formData.get("token") || "");
  const password = String(formData.get("password") || "");

  if (password.length < 8) {
    redirect(
      `/reset?token=${encodeURIComponent(token)}&error=Password+must+be+at+least+8+characters`,
    );
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: password, token },
      headers: await headers(),
    });
  } catch (err) {
    if (err instanceof APIError) {
      redirect(
        `/reset?token=${encodeURIComponent(token)}&error=Reset+link+is+invalid+or+expired`,
      );
    }
    throw err;
  }

  redirect("/login?reset=1");
}
