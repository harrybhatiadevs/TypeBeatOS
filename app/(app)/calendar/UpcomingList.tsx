"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; title: string; iso: string };

/**
 * Renders the upcoming-uploads list grouped by day, formatted in the browser's
 * time zone. Grouping must happen client-side too: a slot stored as UTC can
 * fall on a different calendar day than the producer's local day.
 */
export default function UpcomingList({ items }: { items: Item[] }) {
  const [groups, setGroups] = useState<{ date: string; items: Item[] }[] | null>(null);

  useEffect(() => {
    const byDate = new Map<string, Item[]>();
    for (const it of items) {
      const key = new Date(it.iso).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(it);
    }
    setGroups([...byDate.entries()].map(([date, its]) => ({ date, items: its })));
  }, [items]);

  // Pre-hydration placeholder (avoids showing server-UTC grouping).
  if (!groups) return <div className="cal-day" suppressHydrationWarning />;

  return (
    <>
      {groups.map(({ date, items: its }) => (
        <div key={date} className="cal-day">
          <div className="cal-day-head">{date}</div>
          {its.map((p) => (
            <div key={p.id} className="cal-item">
              <Link href={`/packages/${p.id}`}>{p.title}</Link>
              <span className="cal-time">
                {new Date(p.iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
