import Link from "next/link";
import { ArrowRight, CalendarClock, Check, Circle, Clock, ListChecks, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function formatDate(value: Date | null) {
  if (!value) return "Not scheduled";
  return value.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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
      hint: "creates the pack",
    },
  ];
  const setupIncomplete = setup.some((s) => !s.done);

  const now = new Date();
  const scheduled = packages
    .filter((p) => p.scheduledAt && p.scheduledAt > now)
    .sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime());
  const drafts = packages.filter((p) => p.status === "draft");
  const unscheduled = packages.filter((p) => !p.scheduledAt);
  const nextDraft = drafts[0];
  const nextScheduled = scheduled[0];
  const firstSetupTask = setup.find((s) => !s.done);
  const recent = packages.slice(0, 8);
  const nextAction =
    beatCount === 0
      ? {
          icon: Plus,
          kicker: "Start here",
          title: "Add your first beat",
          body: "Create the first upload pack.",
          href: "/beats/new",
          label: "New beat",
        }
      : nextDraft
        ? {
            icon: ListChecks,
            kicker: "Review needed",
            title: nextDraft.beat.name,
            body: "Finish the pack before it enters the queue.",
            href: `/packages/${nextDraft.id}`,
            label: "Review pack",
          }
        : unscheduled.length
          ? {
              icon: CalendarClock,
              kicker: "Queue waiting",
              title: `${unscheduled.length} unscheduled ${unscheduled.length === 1 ? "pack" : "packs"}`,
              body: "Place the queue into publishing slots.",
              href: "/calendar",
              label: "Open calendar",
            }
          : firstSetupTask
            ? {
                icon: Circle,
                kicker: "Setup",
                title: firstSetupTask.label,
                body: firstSetupTask.hint,
                href: firstSetupTask.href,
                label: "Open profile",
              }
            : nextScheduled
              ? {
                  icon: Clock,
                  kicker: "Next upload",
                  title: nextScheduled.beat.name,
                  body: formatDate(nextScheduled.scheduledAt),
                  href: `/packages/${nextScheduled.id}`,
                  label: "View pack",
                }
              : {
                  icon: Plus,
                  kicker: "Keep building",
                  title: "Add the next beat",
                  body: "Create another upload pack.",
                  href: "/beats/new",
                  label: "New beat",
                };
  const NextActionIcon = nextAction.icon;

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Producer dashboard
      </p>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Queue status and the next useful move.</p>

      <div className="command-grid">
        <div className="card next-action-card">
          <div className="next-action-icon" aria-hidden="true">
            <NextActionIcon size={22} strokeWidth={2.2} />
          </div>
          <div>
            <span className="next-action-kicker">{nextAction.kicker}</span>
            <h3>{nextAction.title}</h3>
            <p>{nextAction.body}</p>
          </div>
          <Link href={nextAction.href} className="btn btn-primary">
            {nextAction.label}
            <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>

        {setupIncomplete && (
          <div className="card setup-card">
            <h3>Finish your setup</h3>
            {setup.map((s) =>
              s.done ? (
                <div key={s.label} className="checklist-item done">
                  <span className="check" aria-hidden="true">
                    <Check size={14} strokeWidth={2.4} />
                  </span>
                  {s.label}
                </div>
              ) : (
                <Link key={s.label} href={s.href} className="checklist-item">
                  <span className="check" aria-hidden="true">
                    <Circle size={12} strokeWidth={2.2} />
                  </span>
                  {s.label}
                  <span className="checklist-hint">{s.hint}</span>
                </Link>
              )
            )}
          </div>
        )}
      </div>

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
            <p>Start with a beat. Review the upload pack next.</p>
            <Link href="/beats/new" className="btn btn-primary">
              Add beat
            </Link>
          </div>
        ) : (
          <>
            <table className="table package-table">
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
                    <td className="tb-muted">{formatDate(p.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mobile-package-list" aria-label="Recent upload packages">
              {recent.map((p) => (
                <Link key={p.id} href={`/packages/${p.id}`} className="package-mobile-card">
                  <span>
                    <strong>{p.beat.name}</strong>
                    <small>{p.beat.targetArtist}</small>
                  </span>
                  <span>
                    <em className={`badge badge-${p.status}`}>{p.status}</em>
                    <small>{formatDate(p.scheduledAt)}</small>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
