"use client";

import { useEffect, useRef, useState } from "react";
import { generateVideo, getVideoStatus } from "@/lib/actions/video";

export default function VideoGenerator({
  packageId,
  initialStatus,
  initialVideoPath,
  initialError,
  hasAudio,
  hasThumbnail,
  onStatusChange,
}: {
  packageId: string;
  initialStatus: string;
  initialVideoPath: string;
  initialError: string;
  hasAudio: boolean;
  hasThumbnail: boolean;
  /** Notifies the parent editor when the render status changes (for gating). */
  onStatusChange?: (status: string) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videoPath, setVideoPath] = useState(initialVideoPath);
  const [error, setError] = useState(initialError);
  const [style, setStyle] = useState<"static" | "waveform">("static");
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the parent editor's copy of the video status in sync so it can gate
  // "Mark ready" on a finished render without a full page refresh.
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (status !== "rendering") return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await getVideoStatus(packageId);
        setStatus(s.status);
        setVideoPath(s.videoPath);
        setError(s.error);
      } catch {
        // keep polling
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, packageId]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setStatus("rendering");
    setError("");
    try {
      await generateVideo(packageId, style);
      const s = await getVideoStatus(packageId);
      setStatus(s.status);
      setVideoPath(s.videoPath);
      setError(s.error);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error && err.message ? err.message : "Could not start video render.");
    } finally {
      setStarting(false);
    }
  };

  const ready = hasAudio && hasThumbnail;

  return (
    <div className="card">
      <h3>Video</h3>

      {status === "done" && videoPath ? (
        <>
          <video controls src={videoPath} className="thumb-canvas" style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={videoPath} download={`${packageId}.mp4`} className="btn btn-ghost btn-sm">
              ⬇ Download MP4
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus("none")}>
              Re-render
            </button>
          </div>
        </>
      ) : status === "rendering" ? (
        <p className="tb-accent" style={{ fontWeight: 600 }}>
          ⏳ Rendering… this can take a minute for longer beats. You can keep editing — it finishes
          in the background.
        </p>
      ) : (
        <>
          {!ready && (
            <p className="tb-helper" style={{ marginBottom: 12, fontSize: "0.9rem" }}>
              {!hasAudio && "Add a beat with an audio file to render a video. "}
              {!hasThumbnail && "Save a thumbnail first — it becomes the video visual."}
            </p>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value as "static" | "waveform")}>
              <option value="static">Static image (fast render)</option>
              <option value="waveform">Image + waveform visualizer</option>
            </select>
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled={!ready || starting} onClick={start}>
            {starting ? "Starting..." : "🎬 Generate video"}
          </button>
        </>
      )}
    </div>
  );
}
