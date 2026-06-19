"use server";

import { db } from "@/lib/db";
import { waitlistLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-context";

export type WaitlistResult = { ok: boolean; message: string; alreadyIn?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  const ip = await getClientIp();
  const gate = await waitlistLimiter.consume(ip);
  if (!gate.allowed) {
    return { ok: false, message: "Too many submissions — try again in a minute." };
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "producer").trim();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const existing = await db.waitlistSignup.findUnique({ where: { email } });
  if (existing) {
    // Upgrade a plain waitlist signup to beta if they came back via the beta form.
    if (role === "beta" && existing.role !== "beta") {
      await db.waitlistSignup.update({ where: { email }, data: { role: "beta" } });
      return { ok: true, message: "You're on the beta list — we'll be in touch soon.", alreadyIn: true };
    }
    return { ok: true, message: "You're already on the list. We'll email you when it's time.", alreadyIn: true };
  }

  await db.waitlistSignup.create({
    data: { email, role: role === "beta" ? "beta" : "producer" },
  });

  return {
    ok: true,
    message:
      role === "beta"
        ? "You're in — beta invites go out in waves. Watch your inbox."
        : "You're on the waitlist. We'll email you the moment it opens.",
  };
}

export async function waitlistCount(): Promise<number> {
  return db.waitlistSignup.count();
}
