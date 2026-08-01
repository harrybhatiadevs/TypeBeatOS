"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ItemStatus = "pending" | "preparing" | "rendering" | "uploading_youtube" | "completed" | "ready" | "failed";
type BatchData = {
  id: string;
  status: string;
  autoUpload: boolean;
  items: Array<{
    id: string;
    name: string;
    audioName: string;
    imageName: string;
    status: ItemStatus;
    error: string;
    scheduledAt: string | null;
    packageId: string | null;
    youtubeVideoId: string;
  }>;
};

const LABELS: Record<ItemStatus, string> = {
  pending: "Waiting for files",
  preparing: "Preparing package",
  rendering: "Rendering video",
  uploading_youtube: "Uploading to YouTube",
  completed: "Scheduled on YouTube",
  ready: "Ready to publish",
  failed: "Needs attention",
};

const PROGRESS: Record<ItemStatus, number> = {
  pending: 8,
  preparing: 22,
  rendering: 55,
  uploading_youtube: 82,
  completed: 100,
  ready: 100,
  failed: 100,
};

export default function BatchProgress({ batchId }: { batchId: string }) {
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      try {
        const response = await fetch(`/api/batches/${batchId}`, { cache: "no-store" });
        const data = await response.json() as BatchData & { error?: string };
        if (!response.ok) throw new Error(data.error || "Could not load this batch.");
        if (cancelled) return;
        setBatch(data);
        setError("");
        if (data.status !== "completed" && data.status !== "partial_failure") {
          timer = setTimeout(load, 3000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load this batch.");
        timer = setTimeout(load, 5000);
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [batchId]);

  const summary = useMemo(() => {
    const items = batch?.items || [];
    return {
      done: items.filter((item) => item.status === "completed" || item.status === "ready").length,
      failed: items.filter((item) => item.status === "failed").length,
      total: items.length,
    };
  }, [batch]);

  return (
    <div className="batch-progress-page" aria-live="polite">
      {error && <div className="form-error">{error}</div>}
      {!batch ? (
        <div className="card"><p className="tb-helper">Loading batch progress…</p></div>
      ) : (
        <>
          <div className="card batch-summary-card">
            <div><span className={`badge badge-${summary.failed ? "failed" : batch.status === "completed" ? "uploaded" : "rendering"}`}>{batch.status.replace("_", " ")}</span><h2>{summary.done} of {summary.total} complete</h2><p>{summary.failed ? `${summary.failed} item${summary.failed === 1 ? "" : "s"} need attention.` : batch.status === "completed" ? (batch.autoUpload ? "Every video is now on YouTube." : "Every video is rendered and ready to publish.") : "TypeBeatOS is working through the queue."}</p></div>
            <Link href="/beats/batch" className="btn btn-ghost btn-sm">+ Start another batch</Link>
          </div>

          <div className="batch-progress-list">
            {batch.items.map((item, index) => (
              <article className={`card batch-progress-item is-${item.status}`} key={item.id}>
                <div className="batch-progress-index">{index + 1}</div>
                <div className="batch-progress-main">
                  <div className="batch-progress-title"><div><h3>{item.name}</h3><p>{item.audioName} · {item.imageName}</p></div><span className={`badge badge-${item.status === "completed" ? "uploaded" : item.status === "failed" ? "failed" : item.status === "ready" ? "ready" : "rendering"}`}>{LABELS[item.status]}</span></div>
                  <div className="batch-progress-track"><span style={{ width: `${PROGRESS[item.status]}%` }} /></div>
                  {item.scheduledAt && <p className="batch-schedule-note">Publish slot: {new Date(item.scheduledAt).toLocaleString()}</p>}
                  {item.error && <div className="form-error">{item.error}</div>}
                  <div className="batch-progress-actions">
                    {item.packageId && <Link href={`/packages/${item.packageId}`} className="copy-btn">Open package</Link>}
                    {item.youtubeVideoId && <a href={`https://studio.youtube.com/video/${item.youtubeVideoId}/edit`} target="_blank" rel="noreferrer" className="copy-btn">Open in YouTube Studio ↗</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
