"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePackage } from "@/lib/actions/packages";
import ThumbnailBuilder from "./ThumbnailBuilder";
import VideoGenerator from "./VideoGenerator";
import YouTubeUploader from "./YouTubeUploader";

type PkgProps = {
  id: string;
  titleOptions: string[];
  selectedTitle: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
  thumbnailPath: string;
  videoStatus: string;
  videoPath: string;
  videoError: string;
  uploadStatus: string;
  youtubeVideoId: string;
  uploadError: string;
  scheduledAt: string; // ISO or ""
  status: string;
};

type BeatProps = {
  name: string;
  targetArtist: string;
  secondaryArtist: string;
  genre: string;
  audioPath: string;
};

function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}

export default function PackageEditor({
  pkg,
  beat,
  youtube,
}: {
  pkg: PkgProps;
  beat: BeatProps;
  youtube: { configured: boolean; connected: boolean; channelTitle: string };
}) {
  const [selectedTitle, setSelectedTitle] = useState(pkg.selectedTitle);
  const [description, setDescription] = useState(pkg.description);
  const [tags, setTags] = useState(pkg.tags);
  const [hashtags, setHashtags] = useState(pkg.hashtags);
  const [pinnedComment, setPinnedComment] = useState(pkg.pinnedComment);
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(pkg.scheduledAt));
  const [status, setStatus] = useState(pkg.status);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const save = (nextStatus?: string) => {
    const s = nextStatus ?? status;
    if (nextStatus) setStatus(nextStatus);
    startTransition(async () => {
      await updatePackage({
        id: pkg.id,
        selectedTitle,
        description,
        tags,
        hashtags,
        pinnedComment,
        scheduledAt,
        status: s,
      });
      // Marking a package ready is a "done with this one" action — send the
      // producer back to the dashboard so they see it land in the queue.
      if (nextStatus === "ready") {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const downloadPack = () => {
    const text = [
      "=== TITLE ===",
      selectedTitle,
      "",
      "=== DESCRIPTION ===",
      description,
      "",
      "=== TAGS (paste into YouTube Studio) ===",
      tags,
      "",
      "=== HASHTAGS ===",
      hashtags,
      "",
      "=== PINNED COMMENT (paste after publishing) ===",
      pinnedComment,
      "",
      scheduledAt ? `=== SCHEDULE ===\n${new Date(scheduledAt).toLocaleString()}` : "",
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${beat.name.replace(/\s+/g, "-").toLowerCase()}-upload-pack.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Upload package
      </p>
      <h1 className="page-title">{beat.name}</h1>
      <p className="page-sub">
        {beat.targetArtist}
        {beat.secondaryArtist ? ` x ${beat.secondaryArtist}` : ""}{" "}
        <span className={`badge badge-${status}`}>{status}</span>
      </p>

      <div className="editor-grid">
        <div>
          <div className="card">
            <h3>Title</h3>
            {pkg.titleOptions.map((t) => (
              <label
                key={t}
                className={`title-option${t === selectedTitle ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name="title"
                  checked={t === selectedTitle}
                  onChange={() => setSelectedTitle(t)}
                />
                <span>{t}</span>
              </label>
            ))}
            <div className="editor-field" style={{ marginTop: 14 }}>
              <div className="field-head">
                <label>Final title (editable)</label>
                <CopyButton value={selectedTitle} />
              </div>
              <input
                type="text"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="card">
            <div className="field-head">
              <h3>Description</h3>
              <CopyButton value={description} />
            </div>
            <textarea
              rows={14}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="card">
            <div className="field-head">
              <h3>Tags</h3>
              <CopyButton value={tags} />
            </div>
            <textarea rows={4} value={tags} onChange={(e) => setTags(e.target.value)} />
            <p className="tb-helper" style={{ marginTop: 8, fontSize: "0.82rem" }}>
              {tags.length} / 500 characters (YouTube limit)
            </p>

            <div className="editor-field" style={{ marginTop: 14 }}>
              <div className="field-head">
                <label>Hashtags</label>
                <CopyButton value={hashtags} />
              </div>
              <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="field-head">
              <h3>Pinned comment</h3>
              <CopyButton value={pinnedComment} />
            </div>
            <textarea
              rows={4}
              value={pinnedComment}
              onChange={(e) => setPinnedComment(e.target.value)}
            />
          </div>
        </div>

        <div>
          <ThumbnailBuilder
            packageId={pkg.id}
            initialThumbnailPath={pkg.thumbnailPath}
            defaultTitle={beat.name.toUpperCase()}
            defaultSubtitle={`${beat.targetArtist.toUpperCase()} TYPE BEAT`}
          />

          <div className="card">
            <h3>Schedule</h3>
            <div className="form-field">
              <label htmlFor="scheduledAt">Publish date &amp; time</label>
              <input
                id="scheduledAt"
                type="datetime-local"
                className="date-field"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                onClick={(e) => {
                  // Open the native date/time popup from anywhere on the
                  // field, not just the tiny calendar icon.
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  } catch {
                    /* showPicker unsupported or not user-activated — ignore */
                  }
                }}
              />
            </div>
            <p className="tb-helper" style={{ marginTop: 10 }}>
              Or leave blank and use ⚡ auto-schedule on the calendar page.
            </p>
          </div>

          {beat.audioPath && (
            <div className="card">
              <h3>Beat audio</h3>
              <audio controls src={beat.audioPath} style={{ width: "100%" }} />
            </div>
          )}

          <VideoGenerator
            packageId={pkg.id}
            initialStatus={pkg.videoStatus}
            initialVideoPath={pkg.videoPath}
            initialError={pkg.videoError}
            hasAudio={!!beat.audioPath}
            hasThumbnail={!!pkg.thumbnailPath}
          />

          <YouTubeUploader
            packageId={pkg.id}
            configured={youtube.configured}
            connected={youtube.connected}
            channelTitle={youtube.channelTitle}
            hasVideo={pkg.videoStatus === "done" && !!pkg.videoPath}
            scheduledLabel={
              scheduledAt
                ? new Date(scheduledAt).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : ""
            }
            initialStatus={pkg.uploadStatus}
            initialVideoId={pkg.youtubeVideoId}
            initialError={pkg.uploadError}
          />


          <div className="card">
            <h3>Export</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={downloadPack}>
                ⬇ Download upload pack (.txt)
              </button>
              <button type="button" className="btn btn-primary" disabled={isPending} onClick={() => save("ready")}>
                {isPending ? "Saving…" : "Save & mark ready"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={isPending} onClick={() => save()}>
                Save changes
              </button>
              {saved && <span className="form-saved">✓ Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
