import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { autoScheduleQueue } from "@/lib/actions/packages";

export default async function CalendarPage() {
  const user = await requireUser();

  const packages = await db.package.findMany({
    where: { beat: { userId: user.id } },
    include: { beat: true },
    orderBy: { scheduledAt: "asc" },
  });

  const unscheduled = packages.filter((p) => !p.scheduledAt);
  const upcoming = packages.filter((p) => p.scheduledAt && p.scheduledAt >= new Date());

  // Group upcoming by date
  const byDate = new Map<string, typeof upcoming>();
  for (const p of upcoming) {
    const key = p.scheduledAt!.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(p);
  }

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Posting rhythm
      </p>
      <h1 className="page-title">Upload calendar</h1>
      <p className="page-sub">
        Your posting rhythm is set in your <Link href="/profile">profile</Link>. Auto-schedule
        spreads the queue across your next free slots.
      </p>

      {unscheduled.length > 0 && (
        <div className="card">
          <h3>Queue — {unscheduled.length} unscheduled</h3>
          {unscheduled.map((p) => (
            <div key={p.id} className="cal-item">
              <Link href={`/packages/${p.id}`}>{p.selectedTitle}</Link>
              <span className={`badge badge-${p.status}`}>{p.status}</span>
            </div>
          ))}
          <form action={autoScheduleQueue} style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary btn-sm">
              ⚡ Auto-schedule the queue
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Upcoming uploads</h3>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <p>Nothing scheduled yet. Generate packages and auto-schedule them here.</p>
            <Link href="/beats/new" className="btn btn-primary">
              + New beat
            </Link>
          </div>
        ) : (
          [...byDate.entries()].map(([date, items]) => (
            <div key={date} className="cal-day">
              <div className="cal-day-head">{date}</div>
              {items.map((p) => (
                <div key={p.id} className="cal-item">
                  <Link href={`/packages/${p.id}`}>{p.selectedTitle}</Link>
                  <span className="cal-time">
                    {p.scheduledAt!.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </>
  );
}
