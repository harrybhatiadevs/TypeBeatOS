import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aggregateByArtist, aggregateByDay } from "@/lib/analytics";
import { refreshAnalytics } from "@/lib/actions/analytics";

const fmt = (n: number) => n.toLocaleString();

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const [uploaded, connected] = await Promise.all([
    db.package.findMany({
      where: { beat: { userId: user.id }, youtubeVideoId: { not: "" } },
      include: { beat: true },
      orderBy: { viewCount: "desc" },
    }),
    db.youTubeAccount.findUnique({ where: { userId: user.id } }),
  ]);

  const totalViews = uploaded.reduce((s, p) => s + p.viewCount, 0);
  const totalLikes = uploaded.reduce((s, p) => s + p.likeCount, 0);
  const avgViews = uploaded.length ? Math.round(totalViews / uploaded.length) : 0;
  const byArtist = aggregateByArtist(uploaded);
  const byDay = aggregateByDay(uploaded);
  const lastUpdated = uploaded
    .map((p) => p.statsUpdatedAt)
    .filter(Boolean)
    .sort((a, b) => b!.getTime() - a!.getTime())[0];

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Channel performance
      </p>
      <h1 className="page-title">Analytics</h1>
      <p className="page-sub">
        How your uploaded packages are performing on YouTube — and which artist keywords earn
        their slots.
      </p>

      {error && <div className="form-error">{error}</div>}

      {uploaded.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>
              No uploaded videos to track yet.{" "}
              {connected
                ? "Upload a package to YouTube and stats will show up here."
                : "Connect your YouTube channel in your profile, then upload a package."}
            </p>
            <Link href={connected ? "/beats" : "/profile"} className="btn btn-primary">
              {connected ? "Go to beats" : "Open profile"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat">
              <div className="stat-num">{fmt(totalViews)}</div>
              <div className="stat-label">Total views</div>
            </div>
            <div className="stat">
              <div className="stat-num">{fmt(avgViews)}</div>
              <div className="stat-label">Avg views / upload</div>
            </div>
            <div className="stat">
              <div className="stat-num">{fmt(totalLikes)}</div>
              <div className="stat-label">Likes</div>
            </div>
            <div className="stat">
              <div className="stat-num">{fmt(uploaded.length)}</div>
              <div className="stat-label">Videos live</div>
            </div>
          </div>

          <div className="card">
            <div className="field-head">
              <h3>Uploads</h3>
              <form action={refreshAnalytics}>
                <button type="submit" className="copy-btn">
                  ↻ Refresh stats
                </button>
              </form>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Artist</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {uploaded.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/packages/${p.id}`}>{p.selectedTitle}</Link>
                    </td>
                    <td>{p.beat.targetArtist}</td>
                    <td>{fmt(p.viewCount)}</td>
                    <td>{fmt(p.likeCount)}</td>
                    <td>{fmt(p.commentCount)}</td>
                    <td className="tb-row-end">
                      <a
                        href={`https://youtu.be/${p.youtubeVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="copy-btn"
                      >
                        Watch ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tb-helper" style={{ marginTop: 12, fontSize: "0.82rem" }}>
              {lastUpdated
                ? `Last refreshed ${lastUpdated.toLocaleString()}`
                : "Stats not pulled yet — hit refresh."}{" "}
              Scheduled videos show 0 views until they publish.
            </p>
          </div>

          <div className="editor-grid">
            <div className="card">
              <h3>Best performing artists</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Artist keyword</th>
                    <th>Uploads</th>
                    <th>Views</th>
                    <th>Avg / upload</th>
                  </tr>
                </thead>
                <tbody>
                  {byArtist.map((a) => (
                    <tr key={a.artist}>
                      <td style={{ fontWeight: 600 }}>{a.artist}</td>
                      <td>{fmt(a.uploads)}</td>
                      <td>{fmt(a.views)}</td>
                      <td>{fmt(a.avgViews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3>Best upload days</h3>
              {byDay.length === 0 ? (
                <p className="tb-helper">
                  Schedule uploads to see which days perform.
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Uploads</th>
                      <th>Avg views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byDay.map((d) => (
                      <tr key={d.day}>
                        <td style={{ fontWeight: 600 }}>{d.day}</td>
                        <td>{fmt(d.uploads)}</td>
                        <td>{fmt(d.avgViews)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <p className="tb-helper">
            CTR and impressions need the YouTube Analytics API scope — on the roadmap. Views,
            likes, and comments come from the YouTube Data API and refresh on demand.
          </p>
        </>
      )}
    </>
  );
}
