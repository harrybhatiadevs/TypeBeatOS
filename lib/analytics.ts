import { db } from "./db";
import { validAccessToken } from "./youtube";

/**
 * Pull fresh view/like/comment counts from YouTube for every uploaded package.
 * videos.list costs 1 quota unit per call (up to 50 ids), so this is cheap.
 */
export async function refreshStats(userId: string) {
  const uploaded = await db.package.findMany({
    where: { beat: { userId }, youtubeVideoId: { not: "" } },
    select: { id: true, youtubeVideoId: true },
  });
  if (uploaded.length === 0) return 0;

  const token = await validAccessToken(userId);
  let updated = 0;

  for (let i = 0; i < uploaded.length; i += 50) {
    const batch = uploaded.slice(i, i + 50);
    const ids = batch.map((p) => p.youtubeVideoId).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      throw new Error(`Stats fetch failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
    const data = await res.json();
    const byId = new Map<string, { viewCount?: string; likeCount?: string; commentCount?: string }>(
      (data.items || []).map((v: { id: string; statistics: Record<string, string> }) => [
        v.id,
        v.statistics || {},
      ])
    );

    await Promise.all(
      batch.map((pkg) => {
        const stats = byId.get(pkg.youtubeVideoId);
        if (!stats) return Promise.resolve();
        updated++;
        return db.package.update({
          where: { id: pkg.id },
          data: {
            viewCount: parseInt(stats.viewCount || "0", 10),
            likeCount: parseInt(stats.likeCount || "0", 10),
            commentCount: parseInt(stats.commentCount || "0", 10),
            statsUpdatedAt: new Date(),
          },
        });
      })
    );
  }
  return updated;
}

export type ArtistPerformance = {
  artist: string;
  uploads: number;
  views: number;
  avgViews: number;
};

export type DayPerformance = {
  day: string;
  uploads: number;
  views: number;
  avgViews: number;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function aggregateByArtist(
  packages: { viewCount: number; beat: { targetArtist: string } }[]
): ArtistPerformance[] {
  const map = new Map<string, { uploads: number; views: number }>();
  for (const p of packages) {
    const key = p.beat.targetArtist || "Unknown";
    const cur = map.get(key) || { uploads: 0, views: 0 };
    cur.uploads++;
    cur.views += p.viewCount;
    map.set(key, cur);
  }
  return [...map.entries()]
    .map(([artist, { uploads, views }]) => ({
      artist,
      uploads,
      views,
      avgViews: Math.round(views / uploads),
    }))
    .sort((a, b) => b.views - a.views);
}

export function aggregateByDay(
  packages: { viewCount: number; scheduledAt: Date | null }[]
): DayPerformance[] {
  const map = new Map<number, { uploads: number; views: number }>();
  for (const p of packages) {
    if (!p.scheduledAt) continue;
    const day = p.scheduledAt.getDay();
    const cur = map.get(day) || { uploads: 0, views: 0 };
    cur.uploads++;
    cur.views += p.viewCount;
    map.set(day, cur);
  }
  return [...map.entries()]
    .map(([day, { uploads, views }]) => ({
      day: DAY_NAMES[day],
      uploads,
      views,
      avgViews: Math.round(views / uploads),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}
