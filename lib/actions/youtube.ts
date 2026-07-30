"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { enqueueYouTubeUpload, revokeGoogleAuthorization } from "@/lib/youtube";
import { isYouTubePrivacyStatus } from "@/lib/youtube-upload-policy";

export async function disconnectYouTube() {
  const user = await requireUser();
  const account = await db.youTubeAccount.findUnique({ where: { userId: user.id } });
  if (!account) return;

  await revokeGoogleAuthorization(account.refreshToken);
  await db.youTubeAccount.deleteMany({ where: { userId: user.id } });
  revalidatePath("/profile");
  revalidatePath("/settings");
}

export async function uploadToYouTube(input: {
  packageId: string;
  privacyStatus: string;
  madeForKids: boolean;
  scheduledAt: string;
}) {
  const user = await requireUser();
  if (!isYouTubePrivacyStatus(input.privacyStatus)) {
    throw new Error("Choose Public, Private, or Unlisted before uploading.");
  }
  if (typeof input.madeForKids !== "boolean") {
    throw new Error("Choose whether this video is made for kids.");
  }
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Choose a valid YouTube publish date.");
  }

  const pkg = await db.package.findUnique({
    where: { id: input.packageId },
    include: { beat: true },
  });
  if (!pkg || pkg.beat.userId !== user.id) throw new Error("Package not found");
  if (pkg.uploadStatus === "uploading") return;

  const account = await db.youTubeAccount.findUnique({ where: { userId: user.id } });
  if (!account) {
    await db.package.update({
      where: { id: input.packageId },
      data: { uploadStatus: "failed", uploadError: "Connect your YouTube channel in your profile first." },
    });
    return;
  }
  if (!pkg.videoPath) {
    await db.package.update({
      where: { id: input.packageId },
      data: { uploadStatus: "failed", uploadError: "Render the video first — it's the file that gets uploaded." },
    });
    return;
  }

  await db.package.update({
    where: { id: input.packageId },
    data: {
      uploadStatus: "uploading",
      uploadError: "",
      youtubePrivacyStatus: input.privacyStatus,
      youtubeMadeForKids: input.madeForKids,
      scheduledAt,
    },
  });
  enqueueYouTubeUpload(input.packageId);
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
