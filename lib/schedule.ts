/**
 * Weekly posting-slot computation, anchored to the *user's* time zone.
 *
 * The server runs in UTC, so naive `setHours`/`getDay` would build "7 PM" in
 * UTC rather than the producer's local 7 PM. We therefore do all wall-clock
 * math in an explicit IANA time zone (e.g. "America/New_York") passed from the
 * browser, and return absolute UTC `Date`s.
 */

/** Calendar parts of an instant as seen in a given IANA time zone. */
function zoneParts(date: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(date)) p[part.type] = part.value;
  const wk: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    year: +p.year,
    month: +p.month, // 1-12
    day: +p.day,
    hour: +(p.hour === "24" ? "0" : p.hour),
    minute: +p.minute,
    second: +p.second,
    weekday: wk[p.weekday] ?? 0,
  };
}

/** The absolute UTC instant for a wall-clock time in a given zone (DST-correct). */
function zonedWallClockToUtc(
  y: number,
  month1: number,
  d: number,
  h: number,
  mi: number,
  timeZone: string
): Date {
  const guess = Date.UTC(y, month1 - 1, d, h, mi, 0);
  const seen = zoneParts(new Date(guess), timeZone);
  const seenAsUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute, seen.second);
  const offset = seenAsUtc - guess; // ms the zone is ahead of UTC at that instant
  return new Date(guess - offset);
}

/**
 * Compute the next `count` posting slots from a weekly schedule.
 * days: day-of-week numbers (0 = Sunday), time: "HH:MM" in the user's zone,
 * taken: epoch ms of occupied slots, timeZone: IANA zone (defaults to UTC).
 */
export function nextSlots(
  days: number[],
  time: string,
  count: number,
  taken: Set<number>,
  timeZone = "UTC"
): Date[] {
  const [h, m] = time.split(":").map(Number);
  const slots: Date[] = [];
  const used = new Set(taken);
  const now = new Date();

  for (let i = 0; i < 366 && slots.length < count; i++) {
    const probe = new Date(now.getTime() + i * 86400000);
    const { year, month, day, weekday } = zoneParts(probe, timeZone);
    if (!days.includes(weekday)) continue;
    const slot = zonedWallClockToUtc(year, month, day, h || 18, m || 0, timeZone);
    const t = slot.getTime();
    if (slot > now && !used.has(t)) {
      slots.push(slot);
      used.add(t);
    }
  }
  return slots;
}

export function parseScheduleDays(s: string): number[] {
  return s
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
}
