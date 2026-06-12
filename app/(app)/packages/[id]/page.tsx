import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import PackageEditor from "./PackageEditor";

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const pkg = await db.package.findUnique({
    where: { id },
    include: { beat: true },
  });
  if (!pkg || pkg.beat.userId !== user.id) notFound();

  return (
    <PackageEditor
      pkg={{
        id: pkg.id,
        titleOptions: JSON.parse(pkg.titleOptions) as string[],
        selectedTitle: pkg.selectedTitle,
        description: pkg.description,
        tags: pkg.tags,
        hashtags: pkg.hashtags,
        pinnedComment: pkg.pinnedComment,
        thumbnailPath: pkg.thumbnailPath,
        videoStatus: pkg.videoStatus,
        videoPath: pkg.videoPath,
        videoError: pkg.videoError,
        scheduledAt: pkg.scheduledAt ? pkg.scheduledAt.toISOString() : "",
        status: pkg.status,
      }}
      beat={{
        name: pkg.beat.name,
        targetArtist: pkg.beat.targetArtist,
        secondaryArtist: pkg.beat.secondaryArtist,
        genre: pkg.beat.genre,
        audioPath: pkg.beat.audioPath,
      }}
      producerName={user.profile?.producerName || ""}
    />
  );
}
