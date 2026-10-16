import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBeatPackage } from "@/lib/beat-create";
import { saveBatchThumbnail } from "@/lib/batch-thumbnail";
import { startBatchPipeline, refreshBatchStatus } from "@/lib/batch-pipeline";
import { audioUploadError } from "@/lib/audio-upload";
import { loggerFor } from "@/lib/logger";
import { getPlanState, startOfMonth } from "@/lib/billing";

const log = loggerFor("batch-upload");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const { id, itemId } = await params;
  log.info({ batchId: id, itemId }, "batch item request received");
  const item = await db.uploadBatchItem.findFirst({
    where: { id: itemId, batchId: id, batch: { userId: user.id } },
    include: { batch: true },
  });
  if (!item) return NextResponse.json({ error: "Batch item not found." }, { status: 404 });
  if (item.packageId) {
    return NextResponse.json({ packageId: item.packageId });
  }
  if (item.status === "failed") {
    // Failed uploads release their reservation. A retry must recheck quota in
    // case the producer has since used it on another batch.
    const plan = await getPlanState(user);
    if (!plan.isAdmin) {
      const reserved = await db.uploadBatchItem.count({ where: {
        batch: { userId: user.id }, packageId: null,
        status: { in: ["pending", "preparing"] }, createdAt: { gte: startOfMonth() },
      } });
      if (plan.planId === "free" || plan.remaining <= reserved) {
        return NextResponse.json({ error: "No upload packs are available for this retry. Check your plan or wait for the next month." }, { status: 403 });
      }
    }
  }

  // Atomically claim a first attempt or a failed upload. Concurrent requests
  // cannot create duplicate packages for the same batch item.
  const claimed = await db.uploadBatchItem.updateMany({
    where: { id: item.id, packageId: null, status: { in: ["pending", "failed"] } },
    data: { status: "preparing", error: "" },
  });
  if (!claimed.count) {
    return NextResponse.json({ error: "This beat is still being prepared. Wait a moment, then retry." }, { status: 409 });
  }

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const audioError = audioUploadError(audio instanceof File ? audio : null);
    if (!(audio instanceof File) || audio.size === 0) throw new Error("Choose an audio file.");
    if (audioError) throw new Error(audioError);

    const result = await createBeatPackage(user, formData, { fast: true });
    if ("error" in result) throw new Error(result.error);

    await db.uploadBatchItem.update({
      where: { id: item.id },
      data: { packageId: result.packageId },
    });

    await saveBatchThumbnail(result.packageId, formData.get("image"));
    await db.package.update({
      where: { id: result.packageId },
      data: {
        scheduledAt: item.scheduledAt,
        status: item.scheduledAt ? "scheduled" : "ready",
        youtubePrivacyStatus: item.batch.privacyStatus,
        youtubeMadeForKids: item.batch.madeForKids,
      },
    });

    await startBatchPipeline({
      itemId: item.id,
      batchId: item.batchId,
      packageId: result.packageId,
      autoUpload: item.batch.autoUpload,
    });

    return NextResponse.json({ packageId: result.packageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not prepare this beat.";
    log.warn({ batchId: id, itemId, error: message }, "batch item upload failed");
    await db.uploadBatchItem.update({
      where: { id: item.id },
      data: { status: "failed", error: message },
    });
    await refreshBatchStatus(item.batchId);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  const { id, itemId } = await params;
  const item = await db.uploadBatchItem.findFirst({
    where: { id: itemId, batchId: id, batch: { userId: user.id } },
  });
  if (!item) return NextResponse.json({ error: "Batch item not found." }, { status: 404 });

  const body = await request.json().catch(() => ({})) as { error?: string };
  const message = typeof body.error === "string"
    ? body.error.trim().slice(0, 500)
    : "This file could not be prepared.";
  await db.uploadBatchItem.updateMany({
    // Do not release an in-flight server claim after a lost client response.
    where: { id: item.id, packageId: null, status: "pending" },
    data: { status: "failed", error: message || "This file could not be prepared." },
  });
  await refreshBatchStatus(item.batchId);
  return NextResponse.json({ ok: true });
}
