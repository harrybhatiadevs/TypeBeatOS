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
  onStatusChange,
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
  onStatusChange?: (next: { status: string; videoId: string; error: string }) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [error, setError] = useState(initialError);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "uploading") return;
    pollRef.current = setInterval(async () => {
      try {
        const s = await getYouTubeUploadStatus(packageId);
        setStatus(s.status);
        setVideoId(s.videoId);
        setError(s.error);
        onStatusChange?.({ status: s.status, videoId: s.videoId, error: s.error });
      } catch {
        // keep polling
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, packageId, onStatusChange]);

  const start = async () => {
    setStatus("uploading");
    setError("");
    onStatusChange?.({ status: "uploading", videoId, error: "" });
    await uploadToYouTube(packageId);
    const s = await getYouTubeUploadStatus(packageId);
    setStatus(s.status);
    setError(s.error);
    setVideoId(s.videoId);
    onStatusChange?.({ status: s.status, videoId: s.videoId, error: s.error });
  };

  return (
    <div className="card">
      <h3>YouTube</h3>

      {status === "uploaded" && videoId ? (
        <>
          <p className="tb-accent tb-strong helper-block">
            Uploaded{scheduledLabel ? ` - publishes ${scheduledLabel}` : " as private"}
          </p>
          <div className="cluster">
            <a
              href={`https://studio.youtube.com/video/${videoId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Open in YouTube Studio
            </a>
            <a
              href={`https://youtu.be/${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Watch link
            </a>
          </div>
        </>
      ) : status === "uploading" ? (
        <p className="tb-accent tb-strong">
          Uploading in background.
        </p>
      ) : !configured ? (
        <p className="tb-helper">
          YouTube upload is unavailable here.
        </p>
      ) : !connected ? (
        <p className="tb-helper">
          <Link href="/profile">Connect YouTube</Link> to upload.
        </p>
      ) : (
        <>
          {error && <div className="form-error">{error}</div>}
          <p className="tb-helper helper-block">
            {hasVideo
              ? scheduledLabel
                ? `Private upload to ${channelTitle}. Publishes ${scheduledLabel}.`
                : `Private upload to ${channelTitle}. Add a schedule to auto-publish.`
              : "Render video first."}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!hasVideo}
            onClick={start}
          >
            Upload to YouTube
          </button>
        </>
      )}
    </div>
  );
}
