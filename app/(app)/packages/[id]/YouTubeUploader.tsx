"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getYouTubeUploadStatus, uploadToYouTube } from "@/lib/actions/youtube";
import {
  isYouTubePrivacyStatus,
  type YouTubePrivacyStatus,
} from "@/lib/youtube-upload-policy";

export default function YouTubeUploader({
  packageId,
  configured,
  connected,
  channelTitle,
  hasVideo,
  scheduledLabel,
  scheduledAt,
  initialStatus,
  initialVideoId,
  initialError,
  initialPrivacyStatus,
  initialMadeForKids,
}: {
  packageId: string;
  configured: boolean;
  connected: boolean;
  channelTitle: string;
  hasVideo: boolean;
  scheduledLabel: string;
  scheduledAt: string;
  initialStatus: string;
  initialVideoId: string;
  initialError: string;
  initialPrivacyStatus: string;
  initialMadeForKids: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [videoId, setVideoId] = useState(initialVideoId);
  const [error, setError] = useState(initialError);
  const [starting, setStarting] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState<YouTubePrivacyStatus>(
    isYouTubePrivacyStatus(initialPrivacyStatus) ? initialPrivacyStatus : "private",
  );
  const [madeForKids, setMadeForKids] = useState(initialMadeForKids);
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
      await uploadToYouTube({
        packageId,
        privacyStatus,
        madeForKids,
        scheduledAt,
      });
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
            ✓ Uploaded
            {privacyStatus === "public" && scheduledLabel
              ? ` — publishes ${scheduledLabel}`
              : ` as ${privacyStatus}`}
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
          <Link href="/settings?tab=profile">profile</Link> for setup.
        </p>
      ) : !connected ? (
        <p className="tb-helper" style={{ fontSize: "0.9rem" }}>
          <Link href="/settings?tab=profile">Connect your YouTube channel</Link> to upload this package
          directly.
        </p>
      ) : (
        <>
          {error && <div className="form-error">{error}</div>}
          <div className="form-grid" style={{ marginBottom: 14 }}>
            <div className="form-field">
              <label htmlFor={`youtube-visibility-${packageId}`}>Visibility</label>
              <select
                id={`youtube-visibility-${packageId}`}
                value={privacyStatus}
                onChange={(event) =>
                  setPrivacyStatus(event.target.value as YouTubePrivacyStatus)
                }
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor={`youtube-audience-${packageId}`}>Audience</label>
              <select
                id={`youtube-audience-${packageId}`}
                value={madeForKids ? "yes" : "no"}
                onChange={(event) => setMadeForKids(event.target.value === "yes")}
              >
                <option value="no">Not made for kids</option>
                <option value="yes">Made for kids</option>
              </select>
            </div>
          </div>
          <p className="tb-helper" style={{ marginBottom: 14, fontSize: "0.9rem" }}>
            {!hasVideo
              ? "Render the video first — it's the file that gets uploaded."
              : privacyStatus === "public" && scheduledLabel
                ? `Uploads privately to ${channelTitle}, then YouTube publishes it ${scheduledLabel}.`
                : privacyStatus === "public"
                  ? `Publishes immediately on ${channelTitle}.`
                  : scheduledLabel
                    ? `Uploads as ${privacyStatus} to ${channelTitle}. The calendar date will not make it public.`
                    : `Uploads as ${privacyStatus} to ${channelTitle}.`}
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
