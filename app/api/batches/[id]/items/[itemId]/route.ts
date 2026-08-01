import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBeatPackage } from "@/lib/beat-create";
import { saveBatchThumbnail } from "@/lib/batch-thumbnail";
import { startBatchPipeline, refreshBatchStatus } from "@/lib/batch-pipeline";
import { audioUploadError } from "@/lib/audio-upload";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const { id, itemId } = await params;
  const item = await db.uploadBatchItem.findFirst({
    where: { id: itemId, batchId: id, batch: { userId: user.id } },
    include: { batch: true },
  });
  if (!item) return NextResponse.json({ error: "Batch item not found." }, { status: 404 });
  if (item.packageId || item.status !== "pending") {
    return NextResponse.json({ error: "This beat has already been submitted." }, { status: 409 });
  }

  await db.uploadBatchItem.update({ where: { id: item.id }, data: { status: "preparing", error: "" } });

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
      videoStyle: item.batch.videoStyle === "waveform" ? "waveform" : "static",
      autoUpload: item.batch.autoUpload,
    });

    return NextResponse.json({ packageId: result.packageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not prepare this beat.";
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
    where: { id: item.id, status: { in: ["pending", "preparing"] } },
    data: { status: "failed", error: message || "This file could not be prepared." },
  });
  await refreshBatchStatus(item.batchId);
  return NextResponse.json({ ok: true });
}
