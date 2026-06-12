"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function saveProfile(formData: FormData) {
  const user = await requireUser();

  const days = formData.getAll("scheduleDays").map(String).join(",");

  await db.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  await db.profile.update({
    where: { userId: user.id },
    data: {
      producerName: String(formData.get("producerName") || ""),
      youtubeUrl: String(formData.get("youtubeUrl") || ""),
      storeUrl: String(formData.get("storeUrl") || ""),
      instagramUrl: String(formData.get("instagramUrl") || ""),
      contactEmail: String(formData.get("contactEmail") || ""),
      licenseText: String(formData.get("licenseText") || ""),
      descriptionFooter: String(formData.get("descriptionFooter") || ""),
      scheduleDays: days || "1,3,5",
      scheduleTime: String(formData.get("scheduleTime") || "18:00"),
    },
  });

  redirect("/profile?saved=1");
}
