"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const producerName = String(formData.get("producerName") || "").trim();

  if (!email || !email.includes("@")) redirect("/signup?error=Enter+a+valid+email");
  if (password.length < 8) redirect("/signup?error=Password+must+be+at+least+8+characters");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) redirect("/signup?error=An+account+with+that+email+already+exists");

  const user = await db.user.create({
    data: {
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      profile: { create: { producerName } },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    redirect("/login?error=Wrong+email+or+password");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
