import Link from "next/link";
import { CalendarClock, Clock, ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { autoScheduleQueue } from "@/lib/actions/packages";
import { parseScheduleDays } from "@/lib/schedule";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(value: Date) {
  return value.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default async function CalendarPage() {
  const user = await requireUser();

  const packages = await db.package.findMany({
    where: { beat: { userId: user.id } },
    include: { beat: true },
    orderBy: { scheduledAt: "asc" },
  });

  const unscheduled = packages.filter((p) => !p.scheduledAt);
  const upcoming = packages
    .filter((p) => p.scheduledAt && p.scheduledAt >= new Date())
    .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime());
  const activeDays = parseScheduleDays(user.profile?.scheduleDays || "1,3,5");
  const scheduleTime = user.profile?.scheduleTime || "18:00";
  const rhythm = DAYS.map((label, index) => ({
    label,
    active: activeDays.includes(index),
    count: upcoming.filter((p) => p.scheduledAt!.getDay() === index).length,
  }));
  const nextUpload = upcoming[0];

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
      <p className="page-sub">Rhythm, queue, and scheduled uploads.</p>

      <div className="calendar-overview">
        <div className="card rhythm-card">
          <div className="field-head">
            <h3>Weekly rhythm</h3>
            <Link href="/profile" className="copy-btn">
              Edit
            </Link>
          </div>
          <div className="rhythm-grid" aria-label="Weekly posting rhythm">
            {rhythm.map((day) => (
              <div key={day.label} className={day.active ? "rhythm-day active" : "rhythm-day"}>
                <strong>{day.label}</strong>
                <span>{day.active ? scheduleTime : "Off"}</span>
                <small>{day.count ? `${day.count}` : "Clear"}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="card queue-summary-card">
          <div className="queue-summary-icon" aria-hidden="true">
            {unscheduled.length ? <ListChecks size={22} strokeWidth={2.2} /> : <CalendarClock size={22} strokeWidth={2.2} />}
          </div>
          <div>
            <span className="next-action-kicker">{unscheduled.length ? "Queue waiting" : "Next upload"}</span>
            <h3>{unscheduled.length ? `${unscheduled.length} unscheduled` : nextUpload?.beat.name || "No uploads scheduled"}</h3>
            <p>{unscheduled.length ? "Place the queue into open slots." : nextUpload ? formatTime(nextUpload.scheduledAt!) : "Create a pack to start the calendar."}</p>
          </div>
          {unscheduled.length > 0 ? (
            <form action={autoScheduleQueue}>
              <button type="submit" className="btn btn-primary btn-sm">
                <CalendarClock size={17} strokeWidth={2.2} aria-hidden="true" />
                Auto-schedule
              </button>
            </form>
          ) : (
            <Link href="/beats/new" className="btn btn-ghost btn-sm">
              New beat
            </Link>
          )}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div className="card">
          <h3>Queue</h3>
          <div className="cal-list">
            {unscheduled.map((p) => (
              <div key={p.id} className="cal-item">
                <span>
                  <Link href={`/packages/${p.id}`}>{p.beat.name}</Link>
                  <small>{p.beat.targetArtist}</small>
                </span>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Upcoming uploads</h3>
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <p>Nothing scheduled yet. Generate packages and auto-schedule them here.</p>
            <Link href="/beats/new" className="btn btn-primary">
              New beat
            </Link>
          </div>
        ) : (
          [...byDate.entries()].map(([date, items]) => (
            <div key={date} className="cal-day">
              <div className="cal-day-head">{date}</div>
              {items.map((p) => (
                <div key={p.id} className="cal-item">
                  <span>
                    <Link href={`/packages/${p.id}`}>{p.beat.name}</Link>
                    <small>{p.beat.targetArtist}</small>
                  </span>
                  <span className="cal-meta">
                    <Clock size={15} strokeWidth={2.2} aria-hidden="true" />
                    <span className="cal-time">{formatTime(p.scheduledAt!)}</span>
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
