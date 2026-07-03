import { NextResponse } from "next/server";
import { readdir, unlink } from "fs/promises";
import path from "path";
import { getUser, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { loggerFor } from "@/lib/logger";

const log = loggerFor("account");

/** Best-effort: remove every uploaded file whose name starts with one of the ids. */
async function removeUploads(subdir: string, ids: string[]) {
  if (ids.length === 0) return;
  const dir = path.join(process.cwd(), "uploads", subdir);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return; // directory may not exist in this environment
  }
  await Promise.allSettled(
    entries
      .filter((name) => ids.some((id) => name.startsWith(id)))
      .map((name) => unlink(path.join(dir, name))),
  );
}

/**
 * Permanently delete the signed-in account (Settings → Danger zone).
 * Plain form POST with a typed confirmation. Order matters:
 * 1. cancel any live Stripe subscription (no further charges),
 * 2. best-effort remove uploaded audio / thumbnails / videos from disk,
 * 3. delete the User row — Session, Account, Profile, Beat→Package,
 *    YouTubeAccount, and Subscription all cascade,
 * 4. clear the session cookie and land on the homepage.
 */
export async function POST(request: Request) {
  const redirectTo = (p: string) =>
    new NextResponse(null, { status: 303, headers: { Location: p } });

  const user = await getUser();
  if (!user) return redirectTo("/login");

  let confirm = "";
  try {
    const form = await request.formData();
    confirm = String(form.get("confirm") || "");
  } catch {
    /* fall through to the check below */
  }
  if (confirm.trim().toUpperCase() !== "DELETE") {
    return redirectTo("/settings?error=" + encodeURIComponent('Type "DELETE" to confirm.'));
  }

  // 1. Stop billing before the data goes away.
  const sub = await db.subscription.findUnique({ where: { userId: user.id } });
  if (sub?.stripeSubscriptionId && stripeConfigured()) {
    try {
      await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      // Already-canceled subs throw; anything else is logged but never
      // blocks the deletion the user asked for.
      log.warn(
        { userId: user.id, err: err instanceof Error ? err.message : err },
        "stripe cancel during account deletion failed",
      );
    }
  }

  // 2. Uploaded files (audio keyed by beat id, thumbs/videos by package id).
  const beats = await db.beat.findMany({
    where: { userId: user.id },
    select: { id: true, package: { select: { id: true } } },
  });
  const beatIds = beats.map((b) => b.id);
  const packageIds = beats.flatMap((b) => (b.package ? [b.package.id] : []));
  await removeUploads("audio", beatIds);
  await removeUploads("thumbs", packageIds);
  await removeUploads("videos", packageIds);

  // 3. The row — everything else cascades.
  await db.user.delete({ where: { id: user.id } });
  log.info({ userId: user.id, beats: beatIds.length, packages: packageIds.length }, "account deleted");

  // 4. Session out, back to the landing page.
  await destroySession();
  return redirectTo("/");
}
