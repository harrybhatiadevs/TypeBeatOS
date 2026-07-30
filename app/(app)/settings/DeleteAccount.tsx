"use client";

import { useState } from "react";

/**
 * Type-to-confirm account deletion. Expands inline (no modal) and posts a
 * plain form to /api/account/delete — the server re-checks the typed
 * confirmation before doing anything irreversible.
 */
export default function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const armed = typed.trim().toUpperCase() === "DELETE";

  if (!open) {
    return (
      <button type="button" className="btn btn-danger btn-sm" onClick={() => setOpen(true)}>
        Delete account…
      </button>
    );
  }

  return (
    <form
      method="POST"
      action="/api/account/delete"
      onSubmit={(e) => {
        if (!armed) {
          e.preventDefault();
          return;
        }
        setSubmitting(true);
      }}
      style={{ display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: "26rem" }}
    >
      <p style={{ fontSize: "0.92rem", lineHeight: 1.55, color: "var(--muted)" }}>
        This permanently deletes <strong style={{ color: "var(--ink)" }}>{email}</strong> — every
        beat, upload package, thumbnail, video, and your subscription (canceled immediately).
        Any connected Google authorization is revoked first. Videos already published on YouTube
        remain on your YouTube channel. There is no undo.
      </p>
      <div className="form-field">
        <label htmlFor="confirm-delete">Type <strong>DELETE</strong> to confirm</label>
        <input
          id="confirm-delete"
          name="confirm"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
        />
      </div>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-danger btn-sm" disabled={!armed || submitting} aria-busy={submitting}>
          {submitting ? "Deleting…" : "Permanently delete my account"}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
