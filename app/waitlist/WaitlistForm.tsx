"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { joinWaitlist, type WaitlistResult } from "@/lib/actions/waitlist";

export default function WaitlistForm({
  cta = "Join waitlist",
  placeholder = "you@studio.com",
  id,
}: {
  cta?: string;
  placeholder?: string;
  id?: string;
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
      <div id={id} className="tb-form tb-form-done" role="status">
        <span className="tb-form-check" aria-hidden="true">
          <Check size={14} strokeWidth={2.4} />
        </span>
        <span className="tb-form-done-text">{message}</span>
      </div>
    );
  }

  return (
    <div className="tb-form-wrap">
      <form id={id} action={action} className="tb-form">
        <input
          type="email"
          name="email"
          required
          placeholder={placeholder}
          autoComplete="email"
          aria-label="Email address"
          className="tb-form-input"
          disabled={state === "loading"}
        />
        <button type="submit" className="tb-form-btn" disabled={state === "loading"}>
          {state === "loading" ? "Joining..." : cta}
        </button>
      </form>
      {state === "error" && (
        <p className="tb-form-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
