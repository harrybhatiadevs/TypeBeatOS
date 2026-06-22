"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { nextSlots, parseScheduleDays } from "@/lib/schedule";
import { sniff } from "@/lib/file-magic";

async function ownedPackage(id: string, userId: string) {
  const pkg = await db.package.findUnique({ where: { id }, include: { beat: true } });
  if (!pkg || pkg.beat.userId !== userId) throw new Error("Package not found");
  return pkg;
}

export async function updatePackage(input: {
  id: string;
  selectedTitle: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
  scheduledAt: string; // datetime-local value or ""
  status: string;
}) {
  const user = await requireUser();
  await ownedPackage(input.id, user.id);

  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;

  await db.package.update({
    where: { id: input.id },
    data: {
      selectedTitle: input.selectedTitle,
      description: input.description,
      tags: input.tags,
      hashtags: input.hashtags,
      pinnedComment: input.pinnedComment,
      scheduledAt,
      status: scheduledAt ? "scheduled" : input.status === "ready" ? "ready" : "draft",
    },
  });

  revalidatePath(`/packages/${input.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

const MAX_THUMB_BYTES = 8 * 1024 * 1024; // 8 MB

export async function saveThumbnail(formData: FormData) {
  const user = await requireUser();
  const packageId = String(formData.get("packageId") || "");
  await ownedPackage(packageId, user.id);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Invalid image data");
  if (file.size > MAX_THUMB_BYTES) throw new Error("Thumbnail too large (max 8 MB)");

  // Trust the bytes, not the Content-Type header.
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes.subarray(0, 16), "image");
  if (ext !== ".png") throw new Error("Thumbnail must be a PNG");

  const dir = path.join(process.cwd(), "uploads", "thumbs");
  await mkdir(dir, { recursive: true });
  const filename = `${packageId}.png`;
  await writeFile(path.join(dir, filename), Buffer.from(bytes));

  const thumbnailPath = `/api/files/thumbs/${filename}`;
  await db.package.update({ where: { id: packageId }, data: { thumbnailPath } });

  revalidatePath(`/packages/${packageId}`);
  return thumbnailPath;
}

export async function autoScheduleQueue() {
  const user = await requireUser();
  const profile = user.profile;

  const unscheduled = await db.package.findMany({
    where: { beat: { userId: user.id }, scheduledAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (unscheduled.length === 0) return;

  const existing = await db.package.findMany({
    where: { beat: { userId: user.id }, scheduledAt: { not: null } },
    select: { scheduledAt: true },
  });
  const taken = new Set(existing.map((p) => p.scheduledAt!.getTime()));

  const days = parseScheduleDays(profile?.scheduleDays || "1,3,5");
  const slots = nextSlots(days.length ? days : [1, 3, 5], profile?.scheduleTime || "18:00", unscheduled.length, taken);

  await Promise.all(
    unscheduled.map((pkg, i) =>
      slots[i]
        ? db.package.update({
            where: { id: pkg.id },
            data: { scheduledAt: slots[i], status: "scheduled" },
          })
        : Promise.resolve()
    )
  );

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
