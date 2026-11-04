export type PracticeStreak = { lastPracticeDate: string; days: number };
export function localPracticeDate(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
const dayNumber = (date: string) => Date.parse(date + "T00:00:00Z") / 86400000;
// Calendar arithmetic avoids treating DST days as fixed 24-hour practice windows.
export function recordPractice(
  streak: PracticeStreak | undefined,
  now = Date.now(),
): PracticeStreak {
  const today = localPracticeDate(now);
  if (!streak) return { lastPracticeDate: today, days: 1 };
  const gap = dayNumber(today) - dayNumber(streak.lastPracticeDate);
  if (gap <= 0) return streak; // A repeated day or a backwards clock/time-zone change adds nothing.
  return { lastPracticeDate: today, days: gap === 1 ? streak.days + 1 : 1 };
}
export function visibleStreak(
  streak: PracticeStreak | undefined,
  now = Date.now(),
): number {
  if (!streak) return 0;
  return dayNumber(localPracticeDate(now)) -
    dayNumber(streak.lastPracticeDate) >
    1
    ? 0
    : streak.days;
}
export function validStreak(value: unknown): value is PracticeStreak {
  if (!value || typeof value !== "object") return false;
  const v = value as PracticeStreak;
  return (
    typeof v.lastPracticeDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.lastPracticeDate) &&
    Number.isInteger(v.days) &&
    v.days > 0 &&
    Number.isFinite(dayNumber(v.lastPracticeDate)) &&
    new Date(v.lastPracticeDate + "T00:00:00Z").toISOString().slice(0, 10) ===
      v.lastPracticeDate
  );
}
