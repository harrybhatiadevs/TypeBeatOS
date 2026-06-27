"use client";

import { useEffect, useState } from "react";

type Mode = "time" | "datetime" | "datetime-long";

const OPTS: Record<Mode, Intl.DateTimeFormatOptions> = {
  time: { hour: "numeric", minute: "2-digit" },
  datetime: { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
  "datetime-long": {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

/**
 * Formats an absolute ISO instant in the *browser's* time zone. Server
 * components store UTC; rendering the local time here (post-mount) keeps the
 * displayed time consistent with what the producer scheduled. `suppressHydration`
 * covers the SSR placeholder vs. client value difference.
 */
export default function LocalDateTime({
  iso,
  mode = "datetime",
  fallback = "—",
}: {
  iso: string | null;
  mode?: Mode;
  fallback?: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(iso ? new Date(iso).toLocaleString(undefined, OPTS[mode]) : fallback);
  }, [iso, mode, fallback]);

  return <span suppressHydrationWarning>{text ?? (iso ? "…" : fallback)}</span>;
}
