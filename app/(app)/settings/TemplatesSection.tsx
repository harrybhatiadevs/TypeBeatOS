"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createPackageTemplate,
  deletePackageTemplate,
  generateTemplateDraft,
  updatePackageTemplate,
  type PackageTemplate,
} from "@/lib/actions/packages";
import type { PlanId } from "@/lib/plans";

type Draft = Omit<PackageTemplate, "id"> & { id?: string };

const emptyDraft: Draft = {
  name: "",
  title: "",
  description: "",
  tags: "",
  hashtags: "",
  pinnedComment: "",
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function TemplatesSection({
  initialTemplates,
  limit,
  aiEnabled,
}: {
  initialTemplates: PackageTemplate[];
  /** Plan template cap; null = unlimited. */
  limit: number | null;
  planId: PlanId;
  /** Whether AI generation is available (an Anthropic key is set). */
  aiEnabled: boolean;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [brief, setBrief] = useState("");
  const [aiPending, startAiTransition] = useTransition();

  const unlimited = limit === null;
  const locked = limit === 0;
  const atLimit = !unlimited && limit !== null && templates.length >= limit;
  const limitLabel = unlimited ? "∞" : String(limit);

  const openNew = () => {
    setDraft({ ...emptyDraft });
    setError("");
    setMessage("");
  };

  const generate = () => {
    if (!brief.trim()) {
      setError('Describe a lane first — e.g. "Drake x Latin trap, dark melodic".');
      return;
    }
    setError("");
    setMessage("");
    startAiTransition(async () => {
      try {
        const t = await generateTemplateDraft({ brief });
        // Open the editor pre-filled with the AI draft (id blank = unsaved).
        setDraft({ name: t.name, title: t.title, description: t.description, tags: t.tags, hashtags: t.hashtags, pinnedComment: t.pinnedComment });
        setMessage("Generated — review and Save it.");
      } catch (err) {
        setError(errorMessage(err, "Could not generate a template. Try again."));
      }
    });
  };
  const openEdit = (t: PackageTemplate) => {
    setDraft({ ...t });
    setError("");
    setMessage("");
  };
  const closeEditor = () => {
    setDraft(null);
    setError("");
  };
  const update = (key: keyof Draft, value: string) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = () => {
    if (!draft) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        if (draft.id) {
          const t = await updatePackageTemplate({ templateId: draft.id, ...draft });
          setTemplates((cur) => cur.map((x) => (x.id === t.id ? t : x)));
          setMessage(`Updated "${t.name}".`);
        } else {
          const t = await createPackageTemplate({ ...draft });
          setTemplates((cur) => [t, ...cur]);
          setMessage(`Saved "${t.name}".`);
        }
        setDraft(null);
      } catch (err) {
        setError(errorMessage(err, "Could not save template. Try again."));
      }
    });
  };

  const remove = (t: PackageTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await deletePackageTemplate({ templateId: t.id });
        setTemplates((cur) => cur.filter((x) => x.id !== t.id));
        setDraft((d) => (d?.id === t.id ? null : d));
        setMessage(`Deleted "${t.name}".`);
      } catch (err) {
        setError(errorMessage(err, "Could not delete template. Try again."));
      }
    });
  };

  if (locked) {
    return (
      <div className="card settings-templates-locked">
        <h3>Upload templates</h3>
        <p className="tb-helper" style={{ maxWidth: "44rem" }}>
          Save reusable title, description, tag, hashtag, and pinned-comment templates for each of
          your artist lanes, then import them on any package in one click.
        </p>
        <p style={{ margin: "0.6rem 0 1.1rem", color: "var(--muted)" }}>
          Saved templates are a <strong style={{ color: "var(--ink)" }}>Pro</strong> feature.
        </p>
        <Link href="/settings?tab=billing" className="btn btn-primary btn-sm">Upgrade to unlock</Link>
      </div>
    );
  }

  return (
    <div className="card settings-templates">
      <div className="field-head">
        <h3>Upload templates</h3>
        <span className="badge badge-draft">{templates.length} / {limitLabel}</span>
      </div>
      <p className="tb-helper" style={{ maxWidth: "44rem" }}>
        Reusable title, description, tag, hashtag, and pinned-comment presets for different artist
        lanes. Import any of them from a package&apos;s editor.
      </p>

      <div className="template-ai-bar">
        <input
          type="text"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Describe a lane — e.g. Drake x Latin trap, dark melodic"
          disabled={!aiEnabled || aiPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              generate();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={generate}
          disabled={!aiEnabled || aiPending}
          title={aiEnabled ? undefined : "Add an ANTHROPIC_API_KEY to enable AI generation"}
        >
          {aiPending ? "Generating…" : "✨ Generate with AI"}
        </button>
      </div>
      {!aiEnabled && (
        <p className="tb-helper">
          Set <code>ANTHROPIC_API_KEY</code> to generate SEO-optimised templates with AI.
        </p>
      )}

      <div className="template-manager">
        <div className="template-list">
          {templates.length === 0 ? (
            <p className="template-empty tb-muted">No templates yet. Create your first one.</p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className={`template-row${draft?.id === t.id ? " is-active" : ""}`}
              >
                <button type="button" className="template-row-name" onClick={() => openEdit(t)}>
                  {t.name}
                </button>
                <button
                  type="button"
                  className="template-row-del"
                  onClick={() => remove(t)}
                  disabled={isPending}
                  aria-label={`Delete ${t.name}`}
                >
                  Delete
                </button>
              </div>
            ))
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm template-new-btn"
            onClick={openNew}
            disabled={atLimit || isPending}
          >
            + New template
          </button>
          {atLimit && (
            <p className="tb-helper">
              You&apos;ve reached your {limitLabel}-template limit.{" "}
              <Link href="/settings?tab=billing">Upgrade</Link> for more.
            </p>
          )}
        </div>

        {draft && (
          <div className="template-editor">
            <div className="form-field">
              <label htmlFor="tplName">Template name</label>
              <input id="tplName" type="text" value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Drake x Latin" />
            </div>
            <div className="form-field">
              <label htmlFor="tplTitle">Title template</label>
              <input id="tplTitle" type="text" value={draft.title} onChange={(e) => update("title", e.target.value)} placeholder="[FREE] Latin x Drake Type Beat - {beatname}" />
              <p className="tb-helper">
                Placeholders: {"{beatname}"}, {"{artist}"}, {"{secondaryartist}"}, {"{genre}"}, {"{bpm}"}, {"{key}"}
              </p>
            </div>
            <div className="form-field">
              <label htmlFor="tplDesc">Description</label>
              <textarea id="tplDesc" rows={7} value={draft.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="template-two-col">
              <div className="form-field">
                <label htmlFor="tplTags">Tags</label>
                <textarea id="tplTags" rows={4} value={draft.tags} onChange={(e) => update("tags", e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="tplHash">Hashtags</label>
                <input id="tplHash" type="text" value={draft.hashtags} onChange={(e) => update("hashtags", e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label htmlFor="tplPin">Pinned comment</label>
              <textarea id="tplPin" rows={3} value={draft.pinnedComment} onChange={(e) => update("pinnedComment", e.target.value)} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={isPending}>
                {isPending ? "Saving..." : draft.id ? "Update template" : "Save template"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeEditor} disabled={isPending}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <span className="form-saved">{message}</span>}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
