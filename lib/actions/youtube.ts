"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { enqueueYouTubeUpload } from "@/lib/youtube";

export async function disconnectYouTube() {
  const user = await requireUser();
  await db.youTubeAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/profile");
}

export async function uploadToYouTube(packageId: string) {
  const user = await requireUser();
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: true },
  });
  if (!pkg || pkg.beat.userId !== user.id) throw new Error("Package not found");
  if (pkg.uploadStatus === "uploading") return;

  const account = await db.youTubeAccount.findUnique({ where: { userId: user.id } });
  if (!account) {
    await db.package.update({
      where: { id: packageId },
      data: { uploadStatus: "failed", uploadError: "Connect your YouTube channel in your profile first." },
    });
    return;
  }
  if (!pkg.videoPath) {
    await db.package.update({
      where: { id: packageId },
      data: { uploadStatus: "failed", uploadError: "Render the video first — it's the file that gets uploaded." },
    });
    return;
  }

  await db.package.update({
    where: { id: packageId },
    data: { uploadStatus: "uploading", uploadError: "" },
  });
  enqueueYouTubeUpload(packageId);
}

export async function getYouTubeUploadStatus(packageId: string) {
  const user = await requireUser();
  const pkg = await db.package.findUnique({
    where: { id: packageId },
    include: { beat: { select: { userId: true } } },
  });
  if (!pkg || pkg.beat.userId !== user.id) throw new Error("Package not found");
  return { status: pkg.uploadStatus, videoId: pkg.youtubeVideoId, error: pkg.uploadError };
}
