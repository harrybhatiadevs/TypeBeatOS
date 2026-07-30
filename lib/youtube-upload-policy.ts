export const YOUTUBE_PRIVACY_STATUSES = ["public", "private", "unlisted"] as const;

export type YouTubePrivacyStatus = (typeof YOUTUBE_PRIVACY_STATUSES)[number];

export function isYouTubePrivacyStatus(value: unknown): value is YouTubePrivacyStatus {
  return (
    typeof value === "string" &&
    YOUTUBE_PRIVACY_STATUSES.includes(value as YouTubePrivacyStatus)
  );
}

/**
 * YouTube only accepts publishAt when a video is initially private. A user who
 * chooses Public with a future date is therefore uploaded privately and handed
 * to YouTube's scheduler; Private and Unlisted choices stay at that visibility.
 */
export function youtubePublishStatus({
  privacyStatus,
  madeForKids,
  scheduledAt,
  now = new Date(),
}: {
  privacyStatus: YouTubePrivacyStatus;
  madeForKids: boolean;
  scheduledAt: Date | null;
  now?: Date;
}) {
  const scheduledPublic =
    privacyStatus === "public" && scheduledAt !== null && scheduledAt > now;

  return {
    privacyStatus: scheduledPublic ? ("private" as const) : privacyStatus,
    selfDeclaredMadeForKids: madeForKids,
    ...(scheduledPublic ? { publishAt: scheduledAt.toISOString() } : {}),
  };
}
