"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for the new-beat form. Uses the form's pending state so the
 * producer gets clear feedback while the package generates (audio decode +
 * title generation can take a few seconds), and can't double-submit.
 */
export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? "Generating…" : "Generate upload package →"}
    </button>
  );
}
