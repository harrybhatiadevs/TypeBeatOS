import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteBeat } from "@/lib/actions/beats";

export default async function BeatsPage() {
  const user = await requireUser();
  const beats = await db.beat.findMany({
    where: { userId: user.id },
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <h1 className="page-title">Beats</h1>
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
                  <td style={{ color: "var(--text-dim)" }}>
                    {[b.bpm ? `${b.bpm} BPM` : "", b.key].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>
                    {b.package ? (
                      <span className={`badge badge-${b.package.status}`}>{b.package.status}</span>
                    ) : (
                      <span className="badge badge-draft">none</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
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
        )}
      </div>
    </>
  );
}
