"use client";

import { useCallback, useMemo, useState, useTransition, type ComponentType } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  ImageIcon,
  MessageSquareText,
  PlaySquare,
  Radio,
  Tags,
  UploadCloud,
} from "lucide-react";
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
  scheduledAt: string;
  status: string;
};

type BeatProps = {
  name: string;
  targetArtist: string;
  secondaryArtist: string;
  genre: string;
  audioPath: string;
};

type SectionId =
  | "title"
  | "description"
  | "tags"
  | "comment"
  | "thumbnail"
  | "schedule"
  | "video"
  | "youtube";

type ReadinessTone = "ready" | "warning" | "blocked";

type ReadinessItem = {
  id: SectionId;
  label: string;
  status: string;
  detail: string;
  tone: ReadinessTone;
};

const SECTION_ICONS: Record<SectionId, ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>> = {
  title: FileText,
  description: FileText,
  tags: Tags,
  comment: MessageSquareText,
  thumbnail: ImageIcon,
  schedule: Radio,
  video: PlaySquare,
  youtube: UploadCloud,
};

function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(value: string) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildPackText({
  selectedTitle,
  description,
  tags,
  hashtags,
  pinnedComment,
  scheduledAt,
}: {
  selectedTitle: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
  scheduledAt: string;
}) {
  return [
    "TITLE",
    selectedTitle,
    "",
    "DESCRIPTION",
    description,
    "",
    "TAGS",
    tags,
    "",
    "HASHTAGS",
    hashtags,
    "",
    "PINNED COMMENT",
    pinnedComment,
    "",
    scheduledAt ? `SCHEDULE\n${new Date(scheduledAt).toLocaleString()}` : "",
  ].join("\n");
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
      <Clipboard size={14} strokeWidth={2.2} aria-hidden="true" />
      {copied ? "Copied" : label}
    </button>
  );
}

function readinessStatusClass(tone: ReadinessTone) {
  return `readiness-status readiness-status-${tone}`;
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
  const [activeSection, setActiveSection] = useState<SectionId>("title");
  const [selectedTitle, setSelectedTitle] = useState(pkg.selectedTitle);
  const [description, setDescription] = useState(pkg.description);
  const [tags, setTags] = useState(pkg.tags);
  const [hashtags, setHashtags] = useState(pkg.hashtags);
  const [pinnedComment, setPinnedComment] = useState(pkg.pinnedComment);
  const [thumbnailPath, setThumbnailPath] = useState(pkg.thumbnailPath);
  const [videoStatus, setVideoStatus] = useState(pkg.videoStatus);
  const [videoPath, setVideoPath] = useState(pkg.videoPath);
  const [uploadStatus, setUploadStatus] = useState(pkg.uploadStatus);
  const [youtubeVideoId, setYoutubeVideoId] = useState(pkg.youtubeVideoId);
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(pkg.scheduledAt));
  const [status, setStatus] = useState(pkg.status);
  const [saved, setSaved] = useState(false);
  const [copiedPack, setCopiedPack] = useState(false);
  const [isPending, startTransition] = useTransition();

  const packText = buildPackText({
    selectedTitle,
    description,
    tags,
    hashtags,
    pinnedComment,
    scheduledAt,
  });

  const readiness = useMemo<ReadinessItem[]>(() => {
    const titleEdited = selectedTitle !== pkg.selectedTitle;
    const descriptionEdited = description !== pkg.description;
    const tagsEdited = tags !== pkg.tags || hashtags !== pkg.hashtags;
    const commentEdited = pinnedComment !== pkg.pinnedComment;

    const videoTone: ReadinessTone =
      !beat.audioPath || !thumbnailPath || videoStatus === "failed"
        ? "blocked"
        : videoStatus === "done"
          ? "ready"
          : "warning";
    const videoLabel =
      !beat.audioPath
        ? "Missing audio"
        : !thumbnailPath
          ? "Missing thumbnail"
          : videoStatus === "done"
            ? "Done"
            : videoStatus === "rendering"
              ? "Rendering"
              : videoStatus === "failed"
                ? "Error"
                : "Ready to render";

    const youtubeTone: ReadinessTone =
      uploadStatus === "uploaded"
        ? "ready"
        : uploadStatus === "uploading"
          ? "warning"
          : uploadStatus === "failed" || !youtube.configured || !youtube.connected || videoStatus !== "done"
            ? "blocked"
            : "warning";
    const youtubeLabel =
      uploadStatus === "uploaded"
        ? "Uploaded"
        : uploadStatus === "uploading"
          ? "Uploading"
          : uploadStatus === "failed"
            ? "Error"
            : !youtube.configured
              ? "Unavailable"
              : !youtube.connected
                ? "Not connected"
                : videoStatus === "done"
                  ? "Ready"
                  : "Waiting on video";

    return [
      {
        id: "title",
        label: "Title",
        status: selectedTitle.trim() ? (titleEdited ? "Edited" : "Ready") : "Needs title",
        detail: selectedTitle.trim() ? "Search-ready headline selected." : "Choose or write the final title.",
        tone: selectedTitle.trim() ? "ready" : "blocked",
      },
      {
        id: "description",
        label: "Description",
        status: description.trim() ? (descriptionEdited ? "Edited" : "Ready") : "Missing",
        detail: description.trim() ? "Description is ready to review." : "Add the upload description.",
        tone: description.trim() ? "ready" : "blocked",
      },
      {
        id: "tags",
        label: "Tags",
        status: tags.length > 500 ? "Over limit" : tags.trim() ? (tagsEdited ? "Edited" : "Ready") : "Missing",
        detail: tags.length > 500 ? `${tags.length} characters. Keep under 500.` : `${tags.length} of 500 characters.`,
        tone: tags.length > 500 || !tags.trim() ? "blocked" : "ready",
      },
      {
        id: "comment",
        label: "Pinned comment",
        status: pinnedComment.trim() ? (commentEdited ? "Edited" : "Ready") : "Missing",
        detail: pinnedComment.trim() ? "Comment is ready." : "Add a pinned comment.",
        tone: pinnedComment.trim() ? "ready" : "blocked",
      },
      {
        id: "thumbnail",
        label: "Thumbnail",
        status: thumbnailPath ? "Ready" : "Missing",
        detail: thumbnailPath ? "Thumbnail saved." : "Save a thumbnail before video render.",
        tone: thumbnailPath ? "ready" : "blocked",
      },
      {
        id: "schedule",
        label: "Schedule",
        status: scheduledAt ? "Scheduled" : "Not set",
        detail: scheduledAt ? formatDateTime(scheduledAt) : "Can be scheduled later.",
        tone: scheduledAt ? "ready" : "warning",
      },
      {
        id: "video",
        label: "Video",
        status: videoLabel,
        detail: videoStatus === "done" ? "MP4 is ready for upload." : "Render after audio and thumbnail are ready.",
        tone: videoTone,
      },
      {
        id: "youtube",
        label: "YouTube",
        status: youtubeLabel,
        detail: youtubeVideoId ? "Published to YouTube." : youtube.connected ? youtube.channelTitle : "Connect a channel in profile.",
        tone: youtubeTone,
      },
    ];
  }, [
    beat.audioPath,
    description,
    hashtags,
    pinnedComment,
    pkg.description,
    pkg.hashtags,
    pkg.pinnedComment,
    pkg.selectedTitle,
    pkg.tags,
    scheduledAt,
    selectedTitle,
    tags,
    thumbnailPath,
    uploadStatus,
    videoStatus,
    youtube.channelTitle,
    youtube.configured,
    youtube.connected,
    youtubeVideoId,
  ]);

  const blockers = readiness.filter((item) => item.tone === "blocked");
  const readyCount = readiness.filter((item) => item.tone === "ready").length;
  const nextItem = blockers[0] ?? readiness.find((item) => item.tone === "warning") ?? readiness[0];
  const currentItem = readiness.find((item) => item.id === activeSection) ?? readiness[0];

  const save = (nextStatus?: string) => {
    const next = nextStatus ?? status;
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
        status: next,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const copyPack = async () => {
    await navigator.clipboard.writeText(packText);
    setCopiedPack(true);
    setTimeout(() => setCopiedPack(false), 1500);
  };

  const downloadPack = () => {
    const blob = new Blob([packText], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${beat.name.replace(/\s+/g, "-").toLowerCase()}-upload-pack.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleVideoStatusChange = useCallback((next: { status: string; videoPath: string }) => {
    setVideoStatus(next.status);
    setVideoPath(next.videoPath);
  }, []);

  const handleUploadStatusChange = useCallback((next: { status: string; videoId: string }) => {
    setUploadStatus(next.status);
    setYoutubeVideoId(next.videoId);
  }, []);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "title":
        return (
          <div className="card package-section-card">
            <div className="field-head">
              <h3>Title</h3>
              <CopyButton value={selectedTitle} />
            </div>
            <div className="title-option-list">
              {pkg.titleOptions.map((title) => (
                <label
                  key={title}
                  className={`title-option${title === selectedTitle ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="title"
                    checked={title === selectedTitle}
                    onChange={() => setSelectedTitle(title)}
                  />
                  <span>{title}</span>
                </label>
              ))}
            </div>
            <div className="editor-field editor-field-spaced">
              <label>Final title</label>
              <input type="text" value={selectedTitle} onChange={(event) => setSelectedTitle(event.target.value)} />
            </div>
          </div>
        );
      case "description":
        return (
          <div className="card package-section-card">
            <div className="field-head">
              <h3>Description</h3>
              <CopyButton value={description} />
            </div>
            <textarea rows={16} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
        );
      case "tags":
        return (
          <div className="card package-section-card">
            <div className="field-head">
              <h3>Tags</h3>
              <CopyButton value={tags} />
            </div>
            <textarea rows={5} value={tags} onChange={(event) => setTags(event.target.value)} />
            <p className={tags.length > 500 ? "tb-helper helper-spaced tb-danger-text" : "tb-helper helper-spaced"}>
              {tags.length} / 500 characters
            </p>
            <div className="editor-field editor-field-spaced">
              <div className="field-head">
                <label>Hashtags</label>
                <CopyButton value={hashtags} />
              </div>
              <input type="text" value={hashtags} onChange={(event) => setHashtags(event.target.value)} />
            </div>
          </div>
        );
      case "comment":
        return (
          <div className="card package-section-card">
            <div className="field-head">
              <h3>Pinned comment</h3>
              <CopyButton value={pinnedComment} />
            </div>
            <textarea rows={6} value={pinnedComment} onChange={(event) => setPinnedComment(event.target.value)} />
          </div>
        );
      case "thumbnail":
        return (
          <ThumbnailBuilder
            packageId={pkg.id}
            initialThumbnailPath={pkg.thumbnailPath}
            defaultTitle={beat.name}
            defaultSubtitle={`${beat.targetArtist}${beat.secondaryArtist ? ` x ${beat.secondaryArtist}` : ""} Type Beat`}
            onSaved={setThumbnailPath}
          />
        );
      case "schedule":
        return (
          <div className="card package-section-card">
            <h3>Schedule</h3>
            <div className="form-field">
              <label htmlFor="scheduledAt">Publish date and time</label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <p className="tb-helper helper-spaced">Leave blank to schedule later.</p>
            {beat.audioPath && (
              <div className="editor-field editor-field-spaced">
                <h3>Beat audio</h3>
                <audio controls src={beat.audioPath} />
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <VideoGenerator
            packageId={pkg.id}
            initialStatus={pkg.videoStatus}
            initialVideoPath={pkg.videoPath}
            initialError={pkg.videoError}
            hasAudio={!!beat.audioPath}
            hasThumbnail={!!thumbnailPath}
            onStatusChange={handleVideoStatusChange}
          />
        );
      case "youtube":
        return (
          <YouTubeUploader
            packageId={pkg.id}
            configured={youtube.configured}
            connected={youtube.connected}
            channelTitle={youtube.channelTitle}
            hasVideo={videoStatus === "done" && !!videoPath}
            scheduledLabel={formatDateTime(scheduledAt)}
            initialStatus={pkg.uploadStatus}
            initialVideoId={pkg.youtubeVideoId}
            initialError={pkg.uploadError}
            onStatusChange={handleUploadStatusChange}
          />
        );
    }
  };

  return (
    <>
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Package review
      </p>

      <div className="package-header">
        <div>
          <h1 className="page-title">{beat.name}</h1>
          <p className="page-sub package-sub">
            {beat.targetArtist}
            {beat.secondaryArtist ? ` x ${beat.secondaryArtist}` : ""}{" "}
            <span className={`badge badge-${status}`}>{status}</span>
          </p>
        </div>
        <div className="package-score" aria-label="Package readiness">
          <strong>{readyCount}/{readiness.length}</strong>
          <span>{blockers.length ? `${blockers.length} blockers` : "Ready to review"}</span>
        </div>
      </div>

      <div className="package-workbench">
        <aside className="card readiness-rail" aria-label="Package readiness sections">
          <div className="readiness-rail-head">
            <h3>Readiness</h3>
            <p>Next: {nextItem.label}</p>
          </div>
          <div className="readiness-list">
            {readiness.map((item) => {
              const Icon = SECTION_ICONS[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`readiness-row${item.id === activeSection ? " active" : ""}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <Icon size={17} strokeWidth={2.2} aria-hidden />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <em className={readinessStatusClass(item.tone)}>{item.status}</em>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="package-active-area" aria-label={`${currentItem.label} editor`}>
          <div className="active-section-head">
            <div>
              <span className={readinessStatusClass(currentItem.tone)}>{currentItem.status}</span>
              <h2>{currentItem.label}</h2>
            </div>
            {currentItem.tone === "ready" ? (
              <CheckCircle2 size={22} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <AlertCircle size={22} strokeWidth={2.2} aria-hidden="true" />
            )}
          </div>
          {renderActiveSection()}
        </section>

        <aside className="package-side-panel">
          <div className="card package-preview-card">
            <div className="field-head">
              <h3>Preview</h3>
              <CopyButton value={packText} label="Copy pack" />
            </div>
            <div className="preview-block">
              <span>Title</span>
              <strong>{selectedTitle || "No title yet"}</strong>
            </div>
            <div className="preview-block">
              <span>Description</span>
              <p>{description ? description.slice(0, 190) : "No description yet"}</p>
            </div>
            <div className="preview-block">
              <span>Schedule</span>
              <strong>{scheduledAt ? formatDateTime(scheduledAt) : "Not set"}</strong>
            </div>
          </div>

          <div className="card package-actions-card">
            <h3>Package actions</h3>
            <div className="action-stack">
              <button type="button" className="btn btn-ghost" onClick={copyPack}>
                <Clipboard size={18} strokeWidth={2.2} aria-hidden="true" />
                {copiedPack ? "Copied pack" : "Copy package"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={downloadPack}>
                <Download size={18} strokeWidth={2.2} aria-hidden="true" />
                Export package
              </button>
              <button type="button" className="btn btn-primary" disabled={isPending} onClick={() => save("ready")}>
                {isPending ? "Saving..." : "Save and mark ready"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={isPending} onClick={() => save()}>
                Save changes
              </button>
              <span className="save-status">{saved ? "Saved" : isPending ? "Saving" : "Manual save"}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
