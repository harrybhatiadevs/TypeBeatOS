import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reconcileBatch } from "@/lib/batch-pipeline";

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
              beat: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!batch) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  return NextResponse.json({
    id: batch.id,
    status: batch.status,
    videoStyle: batch.videoStyle,
    autoUpload: batch.autoUpload,
    createdAt: batch.createdAt,
    items: batch.items.map((item) => ({
      id: item.id,
      position: item.position,
      name: item.package?.beat.name || item.audioName.replace(/\.[^.]+$/, ""),
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
