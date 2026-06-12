"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { enqueueRender, type VideoStyle } from "@/lib/video";

export async function generateVideo(packageId: string, style: VideoStyle) {
  const user = await requireUser();
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: true },
  });
  if (!pkg || pkg.beat.userId !== user.id) throw new Error("Package not found");
  if (pkg.videoStatus === "rendering") return;

  if (!pkg.beat.audioPath) {
    await db.package.update({
      where: { id: packageId },
      data: { videoStatus: "failed", videoError: "This beat has no audio file. Re-add the beat with audio attached." },
    });
    return;
  }
  if (!pkg.thumbnailPath) {
    await db.package.update({
      where: { id: packageId },
      data: { videoStatus: "failed", videoError: "Save a thumbnail first — it becomes the video visual." },
    });
    return;
  }

  await db.package.update({
    where: { id: packageId },
    data: { videoStatus: "rendering", videoError: "" },
  });
  enqueueRender(packageId, style === "waveform" ? "waveform" : "static");
}

export async function getVideoStatus(packageId: string) {
  const user = await requireUser();
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: { select: { userId: true } } },
  });
  if (!pkg || pkg.beat.userId !== user.id) throw new Error("Package not found");
  return { status: pkg.videoStatus, videoPath: pkg.videoPath, error: pkg.videoError };
}
