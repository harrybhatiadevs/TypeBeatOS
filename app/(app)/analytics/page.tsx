import Link from "next/link";
import { BarChart3, CalendarDays, Eye, Heart, MessageCircle, RefreshCw, Target, Trophy } from "lucide-react";
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
  const topUpload = uploaded[0];
  const topArtist = byArtist[0];
  const bestDay = byDay[0];
  const totalComments = uploaded.reduce((s, p) => s + p.commentCount, 0);
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
      <p className="page-sub">What is working, and what to publish next.</p>

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
          <div className="insight-grid">
            <div className="card insight-card">
              <div className="insight-icon" aria-hidden="true">
                <Trophy size={21} strokeWidth={2.2} />
              </div>
              <span>Top upload</span>
              <h3>{topUpload?.beat.name || "No winner yet"}</h3>
              <p>{topUpload ? `${fmt(topUpload.viewCount)} views from ${topUpload.beat.targetArtist}` : "Refresh stats after publishing."}</p>
              {topUpload && (
                <Link href={`/packages/${topUpload.id}`} className="copy-btn">
                  Open pack
                </Link>
              )}
            </div>

            <div className="card insight-card">
              <div className="insight-icon" aria-hidden="true">
                <Target size={21} strokeWidth={2.2} />
              </div>
              <span>Best keyword</span>
              <h3>{topArtist?.artist || "No keyword yet"}</h3>
              <p>{topArtist ? `${fmt(topArtist.avgViews)} avg views per upload.` : "Upload more videos to compare."}</p>
            </div>

            <div className="card insight-card">
              <div className="insight-icon" aria-hidden="true">
                <CalendarDays size={21} strokeWidth={2.2} />
              </div>
              <span>Best day</span>
              <h3>{bestDay?.day || "Not enough data"}</h3>
              <p>{bestDay ? `${fmt(bestDay.avgViews)} avg views from ${bestDay.uploads} uploads.` : "Scheduled uploads unlock day insights."}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <Eye size={18} strokeWidth={2.2} aria-hidden="true" />
              <div className="stat-num">{fmt(totalViews)}</div>
              <div className="stat-label">Total views</div>
            </div>
            <div className="stat">
              <BarChart3 size={18} strokeWidth={2.2} aria-hidden="true" />
              <div className="stat-num">{fmt(avgViews)}</div>
              <div className="stat-label">Avg views / upload</div>
            </div>
            <div className="stat">
              <Heart size={18} strokeWidth={2.2} aria-hidden="true" />
              <div className="stat-num">{fmt(totalLikes)}</div>
              <div className="stat-label">Likes</div>
            </div>
            <div className="stat">
              <MessageCircle size={18} strokeWidth={2.2} aria-hidden="true" />
              <div className="stat-num">{fmt(totalComments)}</div>
              <div className="stat-label">Comments</div>
            </div>
          </div>

          <details className="card analytics-detail" open>
            <summary>
              <span>
                <strong>Upload details</strong>
                <small>{lastUpdated ? `Last refreshed ${lastUpdated.toLocaleString()}` : "Stats not pulled yet."}</small>
              </span>
              <form action={refreshAnalytics}>
                <button type="submit" className="copy-btn">
                  <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
                  Refresh
                </button>
              </form>
            </summary>
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
                        Watch
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <div className="editor-grid">
            <details className="card analytics-detail">
              <summary>
                <span>
                  <strong>Artist keywords</strong>
                  <small>Compare repeated target artists.</small>
                </span>
                <Target size={18} strokeWidth={2.2} aria-hidden="true" />
              </summary>
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
                      <td className="tb-strong">{a.artist}</td>
                      <td>{fmt(a.uploads)}</td>
                      <td>{fmt(a.views)}</td>
                      <td>{fmt(a.avgViews)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <details className="card analytics-detail">
              <summary>
                <span>
                  <strong>Upload days</strong>
                  <small>Compare publishing rhythm.</small>
                </span>
                <CalendarDays size={18} strokeWidth={2.2} aria-hidden="true" />
              </summary>
              {byDay.length === 0 ? (
                <p className="tb-helper analytics-detail-empty">
                  Schedule uploads to compare days.
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
                        <td className="tb-strong">{d.day}</td>
                        <td>{fmt(d.uploads)}</td>
                        <td>{fmt(d.avgViews)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </details>
          </div>
        </>
      )}
    </>
  );
}
