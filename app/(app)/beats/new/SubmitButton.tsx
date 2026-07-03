"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button for the new-beat form. Uses the form's pending state so the
 * producer gets clear feedback while the package generates (audio decode +
 * title generation can take a few seconds), and can't double-submit.
 */
export default function SubmitButton() {
  const { pending } = useFormStatus();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!pending) {
      setSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [pending]);

  const label = seconds > 15
    ? "Still generating..."
    : seconds > 8
      ? "Saving audio..."
      : "Building package...";

  return (
    <button type="submit" className="btn btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? label : "Generate upload package →"}
    </button>
  );
}
