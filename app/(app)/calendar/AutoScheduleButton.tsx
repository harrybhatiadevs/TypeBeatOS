"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-schedule form that submits the browser's IANA time zone so posting
 * slots are computed in the producer's local time (not the server's UTC).
 */
export default function AutoScheduleButton({
  action,
}: {
  action: (formData: FormData) => void;
}) {
  const tzRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tzRef.current) {
      tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
  }, []);

  return (
    <form action={action} style={{ marginTop: 16 }}>
      <input type="hidden" name="timeZone" ref={tzRef} />
      <button type="submit" className="btn btn-primary btn-sm">
        ⚡ Auto-schedule the queue
      </button>
    </form>
  );
}
