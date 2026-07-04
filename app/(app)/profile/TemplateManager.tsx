"use client";

import { useState, useTransition } from "react";
import {
  createPackageTemplate,
  deletePackageTemplate,
  updatePackageTemplate,
} from "@/lib/actions/packages";
import type { PackageTemplate } from "@/lib/actions/packages";

type TemplateDraft = Omit<PackageTemplate, "id"> & { id?: string };

const emptyDraft: TemplateDraft = {
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

export default function TemplateManager({ initialTemplates }: { initialTemplates: PackageTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id || "");
  const [draft, setDraft] = useState<TemplateDraft>(initialTemplates[0] || emptyDraft);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectTemplate = (id: string) => {
    setSelectedId(id);
    setError("");
    setMessage("");
    const template = templates.find((item) => item.id === id);
    setDraft(template || emptyDraft);
  };

  const newTemplate = () => {
    setSelectedId("");
    setDraft(emptyDraft);
    setError("");
    setMessage("");
  };

  const updateDraft = (key: keyof TemplateDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveTemplate = () => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        if (draft.id) {
          const template = await updatePackageTemplate({
            templateId: draft.id,
            name: draft.name,
            title: draft.title,
            description: draft.description,
            tags: draft.tags,
            hashtags: draft.hashtags,
            pinnedComment: draft.pinnedComment,
          });
          setTemplates((current) => current.map((item) => (item.id === template.id ? template : item)));
          setDraft(template);
          setSelectedId(template.id);
          setMessage(`Updated "${template.name}".`);
          return;
        }

        const template = await createPackageTemplate({
          name: draft.name,
          title: draft.title,
          description: draft.description,
          tags: draft.tags,
          hashtags: draft.hashtags,
          pinnedComment: draft.pinnedComment,
        });
        setTemplates((current) => [template, ...current]);
        setDraft(template);
        setSelectedId(template.id);
        setMessage(`Saved "${template.name}".`);
      } catch (err) {
        setError(errorMessage(err, "Could not save template. Try again."));
      }
    });
  };

  const removeTemplate = () => {
    if (!draft.id) return;
    const current = templates.find((item) => item.id === draft.id);
    if (!current) return;
    if (!window.confirm(`Delete template "${current.name}"?`)) return;

    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        await deletePackageTemplate({ templateId: current.id });
        const next = templates.filter((item) => item.id !== current.id);
        setTemplates(next);
        const nextTemplate = next[0];
        setSelectedId(nextTemplate?.id || "");
        setDraft(nextTemplate || emptyDraft);
        setMessage(`Deleted "${current.name}".`);
      } catch (err) {
        setError(errorMessage(err, "Could not delete template. Try again."));
      }
    });
  };

  return (
    <div className="card template-card profile-template-card">
      <div className="field-head">
        <h3>Upload templates</h3>
        <span className="badge badge-draft">{templates.length}</span>
      </div>
      <p className="tb-helper profile-template-copy">
        Save reusable title, description, tag, hashtag, and pinned comment templates for different
        artist lanes. Package pages can import any saved template.
      </p>

      <div className="template-select-row profile-template-select">
        <select value={selectedId} onChange={(e) => selectTemplate(e.target.value)}>
          <option value="">New template</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={newTemplate} disabled={isPending}>
          New
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={removeTemplate}
          disabled={isPending || !draft.id}
        >
          Delete
        </button>
      </div>

      <div className="template-form profile-template-form">
        <div className="form-field">
          <label htmlFor="profileTemplateName">Template name</label>
          <input
            id="profileTemplateName"
            type="text"
            value={draft.name}
            onChange={(e) => updateDraft("name", e.target.value)}
            placeholder="Drake x Latin"
          />
        </div>

        <div className="form-field">
          <label htmlFor="profileTemplateTitle">Title template</label>
          <input
            id="profileTemplateTitle"
            type="text"
            value={draft.title}
            onChange={(e) => updateDraft("title", e.target.value)}
            placeholder="[FREE] Latin x Drake Type Beat - {beatname}"
          />
          <p className="tb-helper">
            Placeholders: {"{beatname}"}, {"{artist}"}, {"{secondaryartist}"}, {"{genre}"}, {"{bpm}"}, {"{key}"}
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="profileTemplateDescription">Description</label>
          <textarea
            id="profileTemplateDescription"
            rows={8}
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
          />
        </div>

        <div className="template-two-col">
          <div className="form-field">
            <label htmlFor="profileTemplateTags">Tags</label>
            <textarea
              id="profileTemplateTags"
              rows={4}
              value={draft.tags}
              onChange={(e) => updateDraft("tags", e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="profileTemplateHashtags">Hashtags</label>
            <input
              id="profileTemplateHashtags"
              type="text"
              value={draft.hashtags}
              onChange={(e) => updateDraft("hashtags", e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="profileTemplatePinnedComment">Pinned comment</label>
          <textarea
            id="profileTemplatePinnedComment"
            rows={4}
            value={draft.pinnedComment}
            onChange={(e) => updateDraft("pinnedComment", e.target.value)}
          />
        </div>

        <div className="form-actions profile-template-actions">
          <button type="button" className="btn btn-primary" onClick={saveTemplate} disabled={isPending}>
            {isPending ? "Saving..." : draft.id ? "Update template" : "Save template"}
          </button>
          {message && <span className="form-saved">{message}</span>}
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>
    </div>
  );
}
