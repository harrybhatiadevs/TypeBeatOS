/**
 * Compute the next `count` posting slots from a weekly schedule.
 * days: day-of-week numbers (0 = Sunday), time: "HH:MM", taken: epoch ms of occupied slots.
 */
export function nextSlots(
  days: number[],
  time: string,
  count: number,
  taken: Set<number>
): Date[] {
  const [h, m] = time.split(":").map(Number);
  const slots: Date[] = [];
  const now = new Date();
  const cursor = new Date(now);
  cursor.setHours(h || 18, m || 0, 0, 0);

  for (let i = 0; i < 366 && slots.length < count; i++) {
    if (days.includes(cursor.getDay()) && cursor > now && !taken.has(cursor.getTime())) {
      slots.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

export function parseScheduleDays(s: string): number[] {
  return s
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !isNaN(d) && d >= 0 && d <= 6);
}
