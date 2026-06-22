"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { destroySession } from "@/lib/auth";
import { authLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";

const TOO_MANY = "Too+many+attempts.+Try+again+in+a+minute.";

export async function signup(formData: FormData) {
  const ip = await getClientIp();
  const gate = await authLimiter.consume(ip);
  if (!gate.allowed) redirect(`/signup?error=${TOO_MANY}`);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const producerName = String(formData.get("producerName") || "").trim();

  if (!email || !email.includes("@")) redirect("/signup?error=Enter+a+valid+email");
  if (password.length < 8) redirect("/signup?error=Password+must+be+at+least+8+characters");

  try {
    // Better-Auth creates the User + credential Account + Session +
    // cookie atomically. autoSignIn:true in the config means the
    // caller is signed in by the time this resolves.
    const result = await auth.api.signUpEmail({
      body: { email, password, name: producerName || email.split("@")[0] },
      headers: await headers(),
      asResponse: false,
    });

    if (!result?.user) {
      redirect("/signup?error=Could+not+create+account");
    }

    // Attach the producer profile to the new user. Better-Auth doesn't
    // know about our Profile relation — we own that.
    await db.profile.upsert({
      where: { userId: result.user.id },
      create: { userId: result.user.id, producerName },
      update: {},
    });
  } catch (err) {
    if (err instanceof APIError) {
      const code = err.body?.code || "";
      if (code.includes("USER_ALREADY_EXISTS") || code.includes("EMAIL")) {
        redirect("/signup?error=An+account+with+that+email+already+exists");
      }
      redirect(`/signup?error=${encodeURIComponent(err.message || "Signup failed")}`);
    }
    throw err;
  }

  redirect("/onboarding");
}

export async function login(formData: FormData) {
  const ip = await getClientIp();
  const gate = await authLimiter.consume(ip);
  if (!gate.allowed) redirect(`/login?error=${TOO_MANY}`);

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  try {
    const result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
      asResponse: false,
    });
    if (!result?.user) {
      redirect("/login?error=Wrong+email+or+password");
    }
  } catch (err) {
    if (err instanceof APIError) {
      redirect("/login?error=Wrong+email+or+password");
    }
    throw err;
  }

  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
