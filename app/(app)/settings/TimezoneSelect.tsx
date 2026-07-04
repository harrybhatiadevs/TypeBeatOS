"use client";

import { useEffect, useMemo, useState } from "react";

/** Full IANA zone list where the platform exposes it; empty otherwise. */
function supportedZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf;
    if (fn) return fn("timeZone");
  } catch {
    /* not supported — fall back to just the detected + saved zone */
  }
  return [];
}

/**
 * Time-zone picker for the producer's posting schedule. When no zone has been
 * saved yet it pre-selects the browser's detected zone, so the default upload
 * schedule (and every YouTube publish time it produces) lands in local time.
 */
export default function TimezoneSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const browserZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const [value, setValue] = useState(defaultValue || browserZone);

  useEffect(() => {
    if (!defaultValue) setValue(browserZone);
  }, [defaultValue, browserZone]);

  const options = useMemo(() => {
    const set = new Set(supportedZones());
    set.add("UTC");
    if (browserZone) set.add(browserZone);
    if (value) set.add(value);
    return Array.from(set).sort();
  }, [browserZone, value]);

  return (
    <select name={name} value={value} onChange={(e) => setValue(e.target.value)}>
      {options.map((z) => (
        <option key={z} value={z}>
          {z.replace(/_/g, " ")}
          {z === browserZone ? " — detected" : ""}
        </option>
      ))}
    </select>
  );
}
