import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteBeat } from "@/lib/actions/beats";
import { effectiveStatus } from "@/lib/package-status";
import { getPlanState } from "@/lib/billing";

export default async function BeatsPage() {
  const user = await requireUser();
  const [beats, plan] = await Promise.all([
    db.beat.findMany({
      where: { userId: user.id },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    }),
    getPlanState(user),
  ]);
  const canBatchUpload = plan.isAdmin || plan.planId !== "free";

  return (
    <>
      <div className="batch-page-heading">
        <h1 className="page-title">Beats</h1>
        <div className="batch-page-actions">
          {canBatchUpload ? (
            <Link href="/beats/batch" className="btn btn-primary btn-sm">Batch upload</Link>
          ) : null}
          <Link href="/beats/new" className="btn btn-ghost btn-sm">Upload</Link>
        </div>
      </div>
      <p className="page-sub">Every beat you&apos;ve added, with its upload package.</p>

      <div className="card">
        {beats.length === 0 ? (
          <div className="empty-state">
            <p>No beats yet.</p>
            <Link href="/beats/new" className="btn btn-primary">
              + Add your first beat
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Beat</th>
                  <th>Target artist</th>
                  <th>BPM / Key</th>
                  <th>Package</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {beats.map((b) => (
                  <tr key={b.id}>
                    <td>
                      {b.package ? (
                        <Link href={`/packages/${b.package.id}`}>{b.name}</Link>
                      ) : (
                        b.name
                      )}
                    </td>
                    <td>
                      {b.targetArtist}
                      {b.secondaryArtist ? ` x ${b.secondaryArtist}` : ""}
                    </td>
                    <td className="tb-muted">
                      {[b.bpm ? `${b.bpm} BPM` : "", b.key].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td>
                      {b.package ? (
                        (() => { const s = effectiveStatus(b.package); return <span className={`badge badge-${s}`}>{s}</span>; })()
                      ) : (
                        <span className="badge badge-draft">none</span>
                      )}
                    </td>
                    <td className="tb-row-end">
                      <Link href={`/beats/${b.id}/edit`} className="copy-btn" style={{ marginRight: 8 }}>
                        Edit
                      </Link>
                      <form action={deleteBeat} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="copy-btn">
                          Delete
                        </button>
                      </form>
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
