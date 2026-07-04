import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { PLANS } from "@/lib/plans";

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
    activeSubs,
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
    db.subscription.findMany({
      where: { status: { in: ["active", "trialing"] } },
      select: { plan: true, interval: true },
    }),
  ]);

  // Payments from active subscriptions (MRR = monthly-equivalent revenue).
  const paidSubs = activeSubs.filter((s) => s.plan === "pro" || s.plan === "serious");
  const mrr = paidSubs.reduce((sum, s) => {
    const plan = PLANS[s.plan as "pro" | "serious"];
    return sum + (s.interval === "year" ? plan.priceAnnual / 12 : plan.priceMonthly);
  }, 0);
  const proCount = paidSubs.filter((s) => s.plan === "pro").length;
  const seriousCount = paidSubs.filter((s) => s.plan === "serious").length;

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
                  background: b.count > 0 ? "linear-gradient(180deg, var(--accent), var(--accent-deep))" : "var(--surface-3)",
                  boxShadow: b.count > 0 ? "0 0 14px rgba(255,29,63,0.35)" : "none",
                }}
              />
              <span style={{ fontSize: "0.62rem", color: "var(--faint)", whiteSpace: "nowrap" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payments — live from Stripe subscriptions */}
      <h3 style={{ margin: "2rem 0 1rem", letterSpacing: "0.02em" }}>Payments</h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-num">${Math.round(mrr).toLocaleString()}</div>
          <div className="stat-label">MRR</div>
        </div>
        <div className="stat">
          <div className="stat-num">${Math.round(mrr * 12).toLocaleString()}</div>
          <div className="stat-label">ARR (run-rate)</div>
        </div>
        <div className="stat">
          <div className="stat-num">{paidSubs.length}</div>
          <div className="stat-label">Active subscriptions</div>
        </div>
        <div className="stat">
          <div className="stat-num">
            {proCount}<span style={{ fontSize: "1rem", color: "var(--faint)" }}> pro</span> /{" "}
            {seriousCount}<span style={{ fontSize: "1rem", color: "var(--faint)" }}> serious</span>
          </div>
          <div className="stat-label">Plan mix</div>
        </div>
      </div>

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
