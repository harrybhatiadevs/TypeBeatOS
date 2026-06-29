import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { autoScheduleQueue } from "@/lib/actions/packages";
import AutoScheduleButton from "./AutoScheduleButton";
import UpcomingList from "./UpcomingList";
import { effectiveStatus } from "@/lib/package-status";

export default async function CalendarPage() {
  const user = await requireUser();

  const packages = await db.package.findMany({
    where: { beat: { userId: user.id } },
    include: { beat: true },
    orderBy: { scheduledAt: "asc" },
  });

  const unscheduled = packages.filter((p) => !p.scheduledAt);
  const upcoming = packages.filter((p) => p.scheduledAt && p.scheduledAt >= new Date());

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
              {(() => { const s = effectiveStatus(p); return <span className={`badge badge-${s}`}>{s}</span>; })()}
            </div>
          ))}
          <AutoScheduleButton action={autoScheduleQueue} />
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
          <UpcomingList
            items={upcoming.map((p) => ({
              id: p.id,
              title: p.selectedTitle,
              iso: p.scheduledAt!.toISOString(),
            }))}
          />
        )}
      </div>
    </>
  );
}
