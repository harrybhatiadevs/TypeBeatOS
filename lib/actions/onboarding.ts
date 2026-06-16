"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function saveOnboardingBrand(formData: FormData) {
  const user = await requireUser();
  await db.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  await db.profile.update({
    where: { userId: user.id },
    data: {
      producerName: String(formData.get("producerName") || "").trim(),
      storeUrl: String(formData.get("storeUrl") || "").trim(),
      contactEmail: String(formData.get("contactEmail") || "").trim(),
    },
  });
  redirect("/onboarding?step=2");
}

export async function saveOnboardingSchedule(formData: FormData) {
  const user = await requireUser();
  const days = formData.getAll("scheduleDays").map(String).join(",");
  await db.profile.update({
    where: { userId: user.id },
    data: {
      scheduleDays: days || "1,3,5",
      scheduleTime: String(formData.get("scheduleTime") || "18:00"),
    },
  });
  redirect("/onboarding?step=3");
}

export async function finishOnboarding() {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { onboardedAt: new Date() },
  });
  redirect("/dashboard");
}
