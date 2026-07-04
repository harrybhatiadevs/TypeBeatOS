"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPackageTemplate,
  deletePackageTemplate,
  updatePackage,
} from "@/lib/actions/packages";
import ThumbnailBuilder from "./ThumbnailBuilder";
import VideoGenerator from "./VideoGenerator";
import YouTubeUploader from "./YouTubeUploader";
import { effectiveStatus } from "@/lib/package-status";

type PkgProps = {
  id: string;
  titleOptions: string[];
  selectedTitle: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
  thumbnailPath: string;
  thumbnailConfig: string;
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
  bpm: number | null;
  key: string;
  audioPath: string;
};

type PackageTemplate = {
  id: string;
  name: string;
  title: string;
  description: string;
  tags: string;
  hashtags: string;
  pinnedComment: string;
};

function toLocalInputValue(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setFailed(false);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
          setFailed(true);
          setTimeout(() => setFailed(false), 2000);
        }
      }}
    >
      {failed ? "Copy failed" : copied ? "✓ Copied" : label}
    </button>
  );
}

export default function PackageEditor({
  pkg,
  beat,
  youtube,
  templates,
}: {
  pkg: PkgProps;
  beat: BeatProps;
  youtube: { configured: boolean; connected: boolean; channelTitle: string };
  templates: PackageTemplate[];
}) {
  const [selectedTitle, setSelectedTitle] = useState(pkg.selectedTitle);
  const [description, setDescription] = useState(pkg.description);
  const [tags, setTags] = useState(pkg.tags);
  const [hashtags, setHashtags] = useState(pkg.hashtags);
  const [pinnedComment, setPinnedComment] = useState(pkg.pinnedComment);
  const [templateList, setTemplateList] = useState(templates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || "");
  const [templateName, setTemplateName] = useState("");
  const [templateTitle, setTemplateTitle] = useState(pkg.selectedTitle);
  const [templateDescription, setTemplateDescription] = useState(pkg.description);
  const [templateTags, setTemplateTags] = useState(pkg.tags);
  const [templateHashtags, setTemplateHashtags] = useState(pkg.hashtags);
  const [templatePinnedComment, setTemplatePinnedComment] = useState(pkg.pinnedComment);
  const [templateMessage, setTemplateMessage] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(pkg.scheduledAt));
  const [status, setStatus] = useState(pkg.status);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [templatePending, startTemplateTransition] = useTransition();
  const router = useRouter();

  const renderTemplate = (value: string) => {
    const replacements: Record<string, string> = {
      beat: beat.name,
      beatname: beat.name,
      artist: beat.targetArtist,
      targetartist: beat.targetArtist,
      secondaryartist: beat.secondaryArtist,
      genre: beat.genre,
      bpm: beat.bpm ? String(beat.bpm) : "",
      key: beat.key,
    };

    return value.replace(/\{([a-zA-Z]+)\}/g, (token, key) => {
      const replacement = replacements[String(key).toLowerCase()];
      return replacement === undefined ? token : replacement;
    });
  };

  const fillTemplateFromCurrent = () => {
    setTemplateTitle(selectedTitle);
    setTemplateDescription(description);
    setTemplateTags(tags);
    setTemplateHashtags(hashtags);
    setTemplatePinnedComment(pinnedComment);
    setTemplateMessage("Template draft filled from this package.");
    setTemplateError("");
  };

  const applyTemplate = () => {
    const template = templateList.find((t) => t.id === selectedTemplateId);
    if (!template) {
      setTemplateError("Choose a template first.");
      setTemplateMessage("");
      return;
    }

    setSelectedTitle(renderTemplate(template.title));
    setDescription(renderTemplate(template.description));
    setTags(renderTemplate(template.tags));
    setHashtags(renderTemplate(template.hashtags));
    setPinnedComment(renderTemplate(template.pinnedComment));
    setTemplateError("");
    setTemplateMessage(`Imported "${template.name}". Save changes when ready.`);
  };

  const saveTemplate = () => {
    setTemplateError("");
    setTemplateMessage("");
    startTemplateTransition(async () => {
      try {
        const template = await createPackageTemplate({
          packageId: pkg.id,
          name: templateName,
          title: templateTitle,
          description: templateDescription,
          tags: templateTags,
          hashtags: templateHashtags,
          pinnedComment: templatePinnedComment,
        });
        setTemplateList((current) => [template, ...current.filter((t) => t.id !== template.id)]);
        setSelectedTemplateId(template.id);
        setTemplateName("");
        setTemplateMessage(`Saved "${template.name}" to templates.`);
      } catch (err) {
        setTemplateError(errorMessage(err, "Could not save template. Try again."));
      }
    });
  };

  const removeTemplate = () => {
    const template = templateList.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    setTemplateError("");
    setTemplateMessage("");
    startTemplateTransition(async () => {
      try {
        await deletePackageTemplate({ packageId: pkg.id, templateId: template.id });
        setTemplateList((current) => current.filter((t) => t.id !== template.id));
        setSelectedTemplateId((current) => {
          if (current !== template.id) return current;
          const next = templateList.find((t) => t.id !== template.id);
          return next?.id || "";
        });
        setTemplateMessage(`Deleted "${template.name}".`);
      } catch (err) {
        setTemplateError(errorMessage(err, "Could not delete template. Try again."));
      }
    });
  };

  const save = (nextStatus?: string) => {
    const s = nextStatus ?? status;
    const previousStatus = status;
    if (nextStatus) setStatus(nextStatus);
    setSaveError("");
    setSaved(false);
    startTransition(async () => {
      try {
        // Convert the naive datetime-local value to an absolute UTC instant HERE,
        // in the browser, where the timezone is the user's. Sending the naive
        // string would let the (UTC) server misread it as UTC. "" stays "".
        const scheduledAtIso = scheduledAt ? new Date(scheduledAt).toISOString() : "";
        await updatePackage({
          id: pkg.id,
          selectedTitle,
          description,
          tags,
          hashtags,
          pinnedComment,
          scheduledAt: scheduledAtIso,
          status: s,
        });
        if (nextStatus === "ready") {
          router.push("/dashboard");
          router.refresh();
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        if (nextStatus) setStatus(previousStatus);
        setSaveError(errorMessage(err, "Could not save this package. Try again."));
      }
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
      <h1 className="page-title">{beat.name}</h1>
      <p className="page-sub">
        {beat.targetArtist}
        {beat.secondaryArtist ? ` x ${beat.secondaryArtist}` : ""}{" "}
        {(() => {
          const s = effectiveStatus({ status, uploadStatus: pkg.uploadStatus });
          return <span className={`badge badge-${s}`}>{s}</span>;
        })()}
      </p>

      <div className="editor-grid">
        <div>
          <div className="card template-card">
            <div className="field-head">
              <h3>Import from template</h3>
              <span className="badge badge-draft">{templateList.length}</span>
            </div>

            <div className="template-select-row">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">Choose a saved template</option>
                {templateList.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={templatePending || !selectedTemplateId}
                onClick={applyTemplate}
              >
                Import
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={templatePending || !selectedTemplateId}
                onClick={removeTemplate}
              >
                Delete
              </button>
            </div>

            <details className="template-builder">
              <summary>+ New template</summary>
              <div className="template-form">
                <div className="form-field">
                  <label htmlFor="templateName">Template name</label>
                  <input
                    id="templateName"
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Drake x Latin"
                  />
                </div>
                <div className="template-actions">
                  <button type="button" className="btn btn-ghost" onClick={fillTemplateFromCurrent}>
                    Fill from current pack
                  </button>
                </div>
                <div className="form-field">
                  <label htmlFor="templateTitle">Title template</label>
                  <input
                    id="templateTitle"
                    type="text"
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    placeholder="[FREE] Latin x Drake Type Beat - {beatname}"
                  />
                  <p className="tb-helper">
                    Placeholders: {"{beatname}"}, {"{artist}"}, {"{secondaryartist}"}, {"{genre}"}, {"{bpm}"}, {"{key}"}
                  </p>
                </div>
                <div className="form-field">
                  <label htmlFor="templateDescription">Description</label>
                  <textarea
                    id="templateDescription"
                    rows={8}
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
                <div className="template-two-col">
                  <div className="form-field">
                    <label htmlFor="templateTags">Tags</label>
                    <textarea
                      id="templateTags"
                      rows={4}
                      value={templateTags}
                      onChange={(e) => setTemplateTags(e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="templateHashtags">Hashtags</label>
                    <input
                      id="templateHashtags"
                      type="text"
                      value={templateHashtags}
                      onChange={(e) => setTemplateHashtags(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="templatePinnedComment">Pinned comment</label>
                  <textarea
                    id="templatePinnedComment"
                    rows={4}
                    value={templatePinnedComment}
                    onChange={(e) => setTemplatePinnedComment(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={templatePending}
                  onClick={saveTemplate}
                >
                  {templatePending ? "Saving…" : "Save template"}
                </button>
              </div>
            </details>

            {templateError && <div className="form-error">{templateError}</div>}
            {templateMessage && <span className="form-saved">{templateMessage}</span>}
          </div>

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
            initialConfig={pkg.thumbnailConfig}
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
              {saveError && <div className="form-error">{saveError}</div>}
              {saved && <span className="form-saved">✓ Saved</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
