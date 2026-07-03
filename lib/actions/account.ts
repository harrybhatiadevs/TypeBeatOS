"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";
import { requireUser } from "@/lib/auth";

/** Update the account display name (Settings → Account). */
export async function updateAccountName(formData: FormData) {
  await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) redirect("/settings?error=" + encodeURIComponent("Name can't be empty."));

  await auth.api.updateUser({
    body: { name },
    headers: await headers(),
  });
  redirect("/settings?saved=account");
}

