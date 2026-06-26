import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export default async function Dashboard() {
  const user = await requireUser();

  const [beatCount, packages, youtube] = await Promise.all([
    db.beat.count({ where: { userId: user.id } }),
    db.package.findMany({
      where: { beat: { userId: user.id } },
      include: { beat: true },
      orderBy: { createdAt: "desc" },
    }),
    db.youTubeAccount.findUnique({ where: { userId: user.id } }),
  ]);

  const setup = [
    {
      label: "Set your producer brand & store link",
      done: !!(user.profile?.producerName && user.profile?.storeUrl),
      href: "/profile",
      hint: "feeds every description",
    },
    {
      label: "Connect your YouTube channel",
      done: !!youtube,
      href: "/profile",
      hint: "enables direct upload",
    },
    {
      label: "Add your first beat",
      done: beatCount > 0,
      href: "/beats/new",
      hint: "generates the full package",
    },
  ];
  const setupIncomplete = setup.some((s) => !s.done);

  const scheduled = packages.filter((p) => p.scheduledAt && p.scheduledAt > new Date());
  const drafts = packages.filter((p) => p.status === "draft");
  const recent = packages.slice(0, 8);

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Producer dashboard
      </p>
      <h1 className="page-title">
        {user.profile?.producerName ? `What's good, ${user.profile.producerName}` : "Dashboard"}
      </h1>
      <p className="page-sub">Your upload pipeline at a glance.</p>

      {setupIncomplete && (
        <div className="card">
          <h3>Finish your setup</h3>
          {setup.map((s) =>
            s.done ? (
              <div key={s.label} className="checklist-item done">
                <span className="check">✓</span>
                {s.label}
              </div>
            ) : (
              <Link key={s.label} href={s.href} className="checklist-item">
                <span className="check">○</span>
                {s.label}
                <span className="checklist-hint">{s.hint} →</span>
              </Link>
            )
          )}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat">
          <div className="stat-num">{beatCount}</div>
          <div className="stat-label">Beats</div>
        </div>
        <div className="stat">
          <div className="stat-num">{packages.length}</div>
          <div className="stat-label">Upload packages</div>
        </div>
        <div className="stat">
          <div className="stat-num">{scheduled.length}</div>
          <div className="stat-label">Scheduled</div>
        </div>
        <div className="stat">
          <div className="stat-num">{drafts.length}</div>
          <div className="stat-label">Drafts to review</div>
        </div>
      </div>

      <div className="card">
        <h3>Recent upload packages</h3>
        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No upload packages yet. Add your first beat and TypeBeatOS will generate the full YouTube package.</p>
            <Link href="/beats/new" className="btn btn-primary">
              + Add your first beat
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/packages/${p.id}`}>{p.selectedTitle}</Link>
                    </td>
                    <td>{p.beat.targetArtist}</td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </td>
                    <td className="tb-muted">
                      {p.scheduledAt
                        ? p.scheduledAt.toLocaleString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
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
