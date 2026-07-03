"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getYouTubeUploadStatus, uploadToYouTube } from "@/lib/actions/youtube";

export default function YouTubeUploader({
  packageId,
  configured,
  connected,
  channelTitle,
  hasVideo,
  scheduledLabel,
  initialStatus,
  initialVideoId,
  initialError,
}: {
  packageId: string;
  configured: boolean;
  connected: boolean;
  channelTitle: string;
  hasVideo: boolean;
  scheduledLabel: string;
  initialStatus: string;
  initialVideoId: string;
  initialError: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [error, setError] = useState(initialError);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "uploading") return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await getYouTubeUploadStatus(packageId);
        setStatus(s.status);
        setVideoId(s.videoId);
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
    setStatus("uploading");
    setError("");
    try {
      await uploadToYouTube(packageId);
      const s = await getYouTubeUploadStatus(packageId);
      setStatus(s.status);
      setVideoId(s.videoId);
      setError(s.error);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error && err.message ? err.message : "Could not start YouTube upload.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="card">
      <h3>YouTube</h3>

      {status === "uploaded" && videoId ? (
        <>
          <p className="tb-accent" style={{ fontWeight: 600, marginBottom: 12 }}>
            ✓ Uploaded{scheduledLabel ? ` — publishes ${scheduledLabel}` : " as private"}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a
              href={`https://studio.youtube.com/video/${videoId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Open in YouTube Studio ↗
            </a>
            <a
              href={`https://youtu.be/${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Watch link ↗
            </a>
          </div>
        </>
      ) : status === "uploading" ? (
        <p className="tb-accent" style={{ fontWeight: 600 }}>
          ⏳ Uploading to YouTube… this runs in the background.
        </p>
      ) : !configured ? (
        <p className="tb-helper" style={{ fontSize: "0.9rem" }}>
          Direct upload needs Google API credentials — see the YouTube card in your{" "}
          <Link href="/profile">profile</Link> for setup.
        </p>
      ) : !connected ? (
        <p className="tb-helper" style={{ fontSize: "0.9rem" }}>
          <Link href="/profile">Connect your YouTube channel</Link> to upload this package
          directly.
        </p>
      ) : (
        <>
          {error && <div className="form-error">{error}</div>}
          <p className="tb-helper" style={{ marginBottom: 14, fontSize: "0.9rem" }}>
            {hasVideo
              ? scheduledLabel
                ? `Uploads to ${channelTitle} as private, set to publish ${scheduledLabel}.`
                : `Uploads to ${channelTitle} as private — set a schedule first to auto-publish.`
              : "Render the video first — it's the file that gets uploaded."}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!hasVideo || starting}
            onClick={start}
          >
            {starting ? "Starting..." : "▶ Upload to YouTube"}
          </button>
        </>
      )}
    </div>
  );
}
