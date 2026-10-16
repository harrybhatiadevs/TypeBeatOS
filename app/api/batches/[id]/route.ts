import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconcileBatch } from "@/lib/batch-pipeline";
import { beatNameFromFilename } from "@/lib/beat-name";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });

  const { id } = await params;
  const owned = await db.uploadBatch.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!owned) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  await reconcileBatch(id);
  const batch = await db.uploadBatch.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          package: {
            select: {
              id: true,
              videoStatus: true,
              uploadStatus: true,
              youtubeVideoId: true,
              beat: { select: { name: true, targetArtist: true, secondaryArtist: true, genre: true, mood: true, storeLink: true, licensePrice: true, exclusivePrice: true } },
            },
          },
        },
      },
    },
  });
  if (!batch) return NextResponse.json({ error: "Batch not found." }, { status: 404 });
  const example = batch.items.find((item) => item.package)?.package?.beat;

  return NextResponse.json({
    id: batch.id,
    status: batch.status,
    autoUpload: batch.autoUpload,
    createdAt: batch.createdAt,
    retryDefaults: {
      targetArtist: example?.targetArtist || "",
      secondaryArtist: example?.secondaryArtist || "",
      genre: example?.genre || "",
      mood: example?.mood || "",
      storeLink: example?.storeLink || user.profile?.storeUrl || "",
      licensePrice: example?.licensePrice || "",
      exclusivePrice: example?.exclusivePrice || "",
    },
    items: batch.items.map((item) => ({
      id: item.id,
      position: item.position,
      name: item.package?.beat.name || beatNameFromFilename(item.audioName),
      audioName: item.audioName,
      imageName: item.imageName,
      status: item.status,
      error: item.error,
      scheduledAt: item.scheduledAt,
      packageId: item.packageId,
      videoStatus: item.package?.videoStatus || "none",
      uploadStatus: item.package?.uploadStatus || "none",
      youtubeVideoId: item.package?.youtubeVideoId || "",
    })),
  });
}
