import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminPage() {
  const admin = await requireAdmin();

  const now = new Date();
  const day = 86_400_000;
  const since7 = new Date(now.getTime() - 7 * day);
  const since30 = new Date(now.getTime() - 30 * day);
  const since14 = new Date(now.getTime() - 14 * day);

  const [
    totalUsers,
    newUsers7,
    newUsers30,
    activatedUsers,
    totalBeats,
    totalPackages,
    uploadedPackages,
    scheduledPackages,
    youtubeConnected,
    waitlist,
    signupWindow,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: since7 } } }),
    db.user.count({ where: { createdAt: { gte: since30 } } }),
    db.user.count({ where: { onboardedAt: { not: null } } }),
    db.beat.count(),
    db.package.count(),
    db.package.count({ where: { uploadStatus: "uploaded" } }),
    db.package.count({ where: { scheduledAt: { not: null } } }),
    db.youTubeAccount.count(),
    db.waitlistSignup.count(),
    db.user.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        email: true,
        name: true,
        onboardedAt: true,
        emailVerified: true,
        createdAt: true,
        youtube: { select: { channelTitle: true } },
        _count: { select: { beats: true } },
      },
    }),
  ]);

  // Bucket the last 14 days of signups for a simple bar chart.
  const buckets: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const start = new Date(now.getTime() - i * day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + day);
    buckets.push({
      label: start.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      count: signupWindow.filter((u) => u.createdAt >= start && u.createdAt < end).length,
    });
  }
  const peak = Math.max(1, ...buckets.map((b) => b.count));

  const activationRate = totalUsers ? Math.round((activatedUsers / totalUsers) * 100) : 0;

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Admin · owner only
      </p>
      <h1 className="page-title">Overview</h1>
      <p className="page-sub">
        Signed in as {admin.email}. Live production metrics as of {fmtDate(now)}.{" "}
        <Link href="/dashboard">Back to app</Link>
      </p>

      {/* Customers */}
      <h3 style={{ margin: "0 0 1rem", letterSpacing: "0.02em" }}>Customers</h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-num">{totalUsers}</div>
          <div className="stat-label">Total customers</div>
        </div>
        <div className="stat">
          <div className="stat-num">{newUsers7}</div>
          <div className="stat-label">New · last 7 days</div>
        </div>
        <div className="stat">
          <div className="stat-num">{newUsers30}</div>
          <div className="stat-label">New · last 30 days</div>
        </div>
        <div className="stat">
          <div className="stat-num">{activationRate}%</div>
          <div className="stat-label">Onboarded ({activatedUsers})</div>
        </div>
      </div>

      {/* Signups chart */}
      <div className="card">
        <h3>Signups · last 14 days</h3>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, marginTop: 8 }}>
          {buckets.map((b, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div
                title={`${b.count} signup${b.count === 1 ? "" : "s"}`}
                style={{
                  width: "100%",
                  height: `${Math.round((b.count / peak) * 96)}px`,
                  minHeight: b.count > 0 ? 4 : 2,
                  borderRadius: 6,
                  background: b.count > 0 ? "linear-gradient(180deg, #ed072c, #b30420)" : "rgba(255,255,255,0.06)",
                  boxShadow: b.count > 0 ? "0 0 14px rgba(237,7,44,0.35)" : "none",
                }}
              />
              <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payments — placeholder until billing is live */}
      <h3 style={{ margin: "2rem 0 1rem", letterSpacing: "0.02em" }}>
        Payments{" "}
        <span className="badge badge-draft" style={{ verticalAlign: "middle", marginLeft: 8 }}>
          Not live yet
        </span>
      </h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-num" style={{ color: "rgba(255,255,255,0.5)" }}>$0</div>
          <div className="stat-label">MRR</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "rgba(255,255,255,0.5)" }}>0</div>
          <div className="stat-label">Active subscriptions</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "rgba(255,255,255,0.5)" }}>$0</div>
          <div className="stat-label">Lifetime revenue</div>
        </div>
        <div className="stat">
          <div className="stat-num" style={{ color: "rgba(255,255,255,0.5)" }}>—</div>
          <div className="stat-label">Churn</div>
        </div>
      </div>
      <p className="page-sub" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Billing isn&apos;t connected yet. Wire up Stripe and these will populate — the layout is ready.
      </p>

      {/* Product usage */}
      <h3 style={{ margin: "2rem 0 1rem", letterSpacing: "0.02em" }}>Product usage</h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-num">{totalBeats}</div>
          <div className="stat-label">Beats created</div>
        </div>
        <div className="stat">
          <div className="stat-num">{totalPackages}</div>
          <div className="stat-label">Upload packages</div>
        </div>
        <div className="stat">
          <div className="stat-num">{uploadedPackages}</div>
          <div className="stat-label">Uploaded to YouTube</div>
        </div>
        <div className="stat">
          <div className="stat-num">{scheduledPackages}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat">
          <div className="stat-num">{youtubeConnected}</div>
          <div className="stat-label">YouTube channels connected</div>
        </div>
        <div className="stat">
          <div className="stat-num">{waitlist}</div>
          <div className="stat-label">Waitlist signups</div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="card">
        <h3>Recent signups</h3>
        {recentUsers.length === 0 ? (
          <div className="empty-state"><p>No customers yet.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Beats</th>
                  <th>YouTube</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td className="tb-muted">{fmtDate(u.createdAt)}</td>
                    <td className="tb-muted">{u._count.beats}</td>
                    <td>
                      {u.youtube ? (
                        <span className="badge badge-uploaded" title={u.youtube.channelTitle || undefined}>
                          connected
                        </span>
                      ) : (
                        <span className="badge badge-draft">none</span>
                      )}
                    </td>
                    <td>
                      {u.onboardedAt ? (
                        <span className="badge badge-uploaded">onboarded</span>
                      ) : u.emailVerified ? (
                        <span className="badge badge-ready">verified</span>
                      ) : (
                        <span className="badge badge-draft">signed up</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
