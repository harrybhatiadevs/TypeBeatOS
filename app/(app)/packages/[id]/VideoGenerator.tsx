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
  onStatusChange?: (next: { status: string; videoPath: string; error: string }) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videoPath, setVideoPath] = useState(initialVideoPath);
  const [error, setError] = useState(initialError);
  const [style, setStyle] = useState<"static" | "waveform">("static");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "rendering") return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await getVideoStatus(packageId);
        setStatus(s.status);
        setVideoPath(s.videoPath);
        setError(s.error);
        onStatusChange?.({ status: s.status, videoPath: s.videoPath, error: s.error });
      } catch {
        // keep polling
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, packageId, onStatusChange]);

  const start = async () => {
    setStatus("rendering");
    setError("");
    onStatusChange?.({ status: "rendering", videoPath, error: "" });
    await generateVideo(packageId, style);
    const s = await getVideoStatus(packageId);
    setStatus(s.status);
    setError(s.error);
    setVideoPath(s.videoPath);
    onStatusChange?.({ status: s.status, videoPath: s.videoPath, error: s.error });
  };

  const ready = hasAudio && hasThumbnail;

  return (
    <div className="card">
      <h3>Video</h3>

      {status === "done" && videoPath ? (
        <>
          <video controls src={videoPath} className="thumb-canvas media-spaced" />
          <div className="cluster">
            <a href={videoPath} download={`${packageId}.mp4`} className="btn btn-ghost btn-sm">
              Download MP4
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus("none")}>
              Re-render
            </button>
          </div>
        </>
      ) : status === "rendering" ? (
        <p className="tb-accent tb-strong">
          Rendering in background.
        </p>
      ) : (
        <>
          {!ready && (
            <p className="tb-helper helper-block">
              {!hasAudio && "Audio required. "}
              {!hasThumbnail && "Save thumbnail first."}
            </p>
          )}
          {error && <div className="form-error">{error}</div>}
          <div className="form-field helper-block">
            <label>Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value as "static" | "waveform")}>
              <option value="static">Static image (fast render)</option>
              <option value="waveform">Image + waveform visualizer</option>
            </select>
          </div>
          <button type="button" className="btn btn-primary btn-sm" disabled={!ready} onClick={start}>
            Generate video
          </button>
        </>
      )}
    </div>
  );
}
