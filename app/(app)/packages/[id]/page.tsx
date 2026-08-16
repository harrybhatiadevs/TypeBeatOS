import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { youtubeConfigured } from "@/lib/youtube";
import { getTemplateState } from "@/lib/actions/packages";
import { formatTitleRecommendation } from "@/lib/generate";
import PackageEditor from "./PackageEditor";

export default async function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const pkg = await db.package.findUnique({
    where: { id },
    include: { beat: true },
  });
  if (!pkg || pkg.beat.userId !== user.id) notFound();

  const [youtube, templateState] = await Promise.all([
    db.youTubeAccount.findUnique({ where: { userId: user.id } }),
    getTemplateState(),
  ]);
  const storedTitleOptions = JSON.parse(pkg.titleOptions) as string[];
  const titleOptions = storedTitleOptions.map((title) =>
    formatTitleRecommendation(title, pkg.beat.name),
  );
  const selectedOptionIndex = storedTitleOptions.indexOf(pkg.selectedTitle);
  const selectedTitle =
    selectedOptionIndex >= 0 ? titleOptions[selectedOptionIndex] : pkg.selectedTitle;

  return (
    <PackageEditor
      pkg={{
        id: pkg.id,
        titleOptions,
        selectedTitle,
        description: pkg.description,
        tags: pkg.tags,
        hashtags: pkg.hashtags,
        pinnedComment: pkg.pinnedComment,
        thumbnailPath: pkg.thumbnailPath,
        thumbnailConfig: pkg.thumbnailConfig,
        videoStatus: pkg.videoStatus,
        videoPath: pkg.videoPath,
        videoError: pkg.videoError,
        uploadStatus: pkg.uploadStatus,
        youtubeVideoId: pkg.youtubeVideoId,
        uploadError: pkg.uploadError,
        youtubePrivacyStatus: pkg.youtubePrivacyStatus,
        youtubeMadeForKids: pkg.youtubeMadeForKids,
        scheduledAt: pkg.scheduledAt ? pkg.scheduledAt.toISOString() : "",
        status: pkg.status,
      }}
      beat={{
        name: pkg.beat.name,
        targetArtist: pkg.beat.targetArtist,
        secondaryArtist: pkg.beat.secondaryArtist,
        genre: pkg.beat.genre,
        bpm: pkg.beat.bpm,
        key: pkg.beat.key,
        storeLink: pkg.beat.storeLink,
        audioPath: pkg.beat.audioPath,
      }}
      youtube={{
        configured: youtubeConfigured(),
        connected: !!youtube,
        channelTitle: youtube?.channelTitle || "your channel",
      }}
      templates={templateState.templates}
      templateLimit={Number.isFinite(templateState.limit) ? templateState.limit : null}
      profileStoreUrl={user.profile?.storeUrl || ""}
    />
  );
}
