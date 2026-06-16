"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { refreshStats } from "@/lib/analytics";
import { redirect } from "next/navigation";

export async function refreshAnalytics() {
  const user = await requireUser();
  try {
    await refreshStats(user.id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Stats refresh failed";
    redirect(`/analytics?error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/analytics");
  redirect("/analytics");
}
