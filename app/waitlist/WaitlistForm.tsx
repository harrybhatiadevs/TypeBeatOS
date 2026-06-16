"use client";

import { useState } from "react";
import { joinWaitlist, type WaitlistResult } from "@/lib/actions/waitlist";

export default function WaitlistForm({
  cta = "Join waitlist",
  placeholder = "your@email.com",
}: {
  cta?: string;
  placeholder?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setState("loading");
    let res: WaitlistResult;
    try {
      res = await joinWaitlist(formData);
    } catch {
      res = { ok: false, message: "Something went wrong. Try again." };
    }
    setMessage(res.message);
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <div className="wl-form-success" role="status">
        <span className="wl-check" aria-hidden="true">✓</span>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <form action={action} className="wl-form">
      <input
        type="email"
        name="email"
        required
        placeholder={placeholder}
        autoComplete="email"
        aria-label="Email address"
        disabled={state === "loading"}
      />
      <button type="submit" className="btn btn-primary" disabled={state === "loading"}>
        {state === "loading" ? "Joining…" : cta}
      </button>
      {state === "error" && (
        <p className="wl-form-error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
