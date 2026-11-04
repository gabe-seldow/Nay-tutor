import { describe, it, expect } from "vitest";
import { localPracticeDate, recordPractice, visibleStreak } from "./streak";
import {
  freshProgress,
  isProgress,
  localProgressRepository,
  STORAGE_KEY,
} from "./progress";
import {
  continueSession,
  keyboardChoice,
  learnedItemIds,
  makeSession,
  skipTyping,
  submitAnswer,
  reviewExercises,
  updateMastery,
} from "./learning";
import {
  exerciseById,
  items,
  lessons,
  retiredItemIds,
  soundId,
} from "./curriculum";
const day = (y: number, m: number, d: number, h = 12) =>
  new Date(y, m - 1, d, h).getTime();
describe("quiet local-calendar streak", () => {
  it("starts at one and counts repeated practice only once per day", () => {
    const a = recordPractice(undefined, day(2026, 11, 4));
    expect(a).toEqual({ lastPracticeDate: "2026-11-04", days: 1 });
    expect(recordPractice(a, day(2026, 11, 4, 23))).toBe(a);
  });
  it("counts consecutive days across month and year boundaries", () => {
    let s = recordPractice(undefined, day(2026, 12, 31));
    s = recordPractice(s, day(2027, 1, 1));
    expect(s.days).toBe(2);
    expect(s.lastPracticeDate).toBe("2027-01-01");
  });
  it("uses calendar days across daylight-saving changes", () => {
    const a = recordPractice(undefined, day(2026, 10, 31, 23));
    const b = recordPractice(a, day(2026, 11, 1, 23));
    expect(b.days).toBe(2);
    expect(recordPractice(b, day(2026, 11, 2, 1)).days).toBe(3);
  });
  it("shows zero after a missed day and starts again on the next practice", () => {
    const a = recordPractice(undefined, day(2026, 11, 4));
    expect(visibleStreak(a, day(2026, 11, 5))).toBe(1);
    expect(visibleStreak(a, day(2026, 11, 6))).toBe(0);
    expect(recordPractice(a, day(2026, 11, 7)).days).toBe(1);
    expect(a.days).toBe(1);
  });
  it("does not gain a day when the clock or local date goes backwards", () => {
    const a = recordPractice(undefined, day(2026, 11, 4));
    expect(recordPractice(a, day(2026, 11, 3))).toBe(a);
    expect(recordPractice(a, day(2026, 11, 4))).toBe(a);
    expect(recordPractice(a, day(2026, 11, 5)).days).toBe(2);
  });
  it("uses the learner local date, including shortly after midnight", () => {
    const now = new Date(2026, 10, 4, 0, 5).getTime();
    expect(localPracticeDate(now)).toBe("2026-11-04");
  });
  it("counts a submitted question, including a mistake, but not a page visit, hint or incomplete answer", () => {
    let p = freshProgress();
    p.session = makeSession(p, lessons[0].id, day(2026, 11, 4));
    expect(p.streak).toBeUndefined();
    p.session!.hintUsed = true;
    expect(p.streak).toBeUndefined();
    expect(submitAnswer(p, "", day(2026, 11, 4))).toBe(p);
    p = submitAnswer(p, "wrong", day(2026, 11, 4));
    expect(p.streak?.days).toBe(1);
    expect(p.history.at(-1)?.correct).toBe(false);
    const before = p.streak;
    p = continueSession(p);
    p.session!.heardAudio = true;
    p = submitAnswer(
      p,
      exerciseById[p.session!.exerciseIds[p.session!.index]].answers[0],
      day(2026, 11, 4),
    );
    expect(p.streak).toBe(before);
  });
  it("does not count skipped Korean typing", () => {
    let p = freshProgress();
    p.completedLessonIds = lessons.slice(0, 10).map((l) => l.id);
    p.session = makeSession(p, lessons[10].id);
    p = keyboardChoice(p, "deferred");
    p = skipTyping(p);
    expect(p.streak).toBeUndefined();
    expect(p.history).toEqual([]);
  });
  it("round trips through the existing namespace, preserving old progress without retroactive streak credit", () => {
    const p = freshProgress();
    p.completedLessonIds = [lessons[0].id];
    const map = new Map([[STORAGE_KEY, JSON.stringify(p)]]);
    const repo = localProgressRepository(() => ({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
    }));
    const old = repo.load().progress;
    expect(old.completedLessonIds).toEqual(p.completedLessonIds);
    expect(old.streak).toBeUndefined();
    old.streak = recordPractice(undefined, day(2026, 11, 4));
    expect(repo.save(old)).toBe(true);
    expect(repo.load().progress.streak).toEqual(old.streak);
  });
  it("validates optional streak data without requiring it on older saves", () => {
    const p = freshProgress();
    expect(isProgress(p)).toBe(true);
    p.streak = { lastPracticeDate: "2026-02-30", days: 5 };
    expect(isProgress(p)).toBe(false);
    p.streak = { lastPracticeDate: "2026-11-04", days: 1 };
    expect(isProgress(p)).toBe(true);
  });
});
describe("five active family expressions with compatible prior learning", () => {
  it("teaches five supported expressions and keeps the old casual phrase out of new core practice", () => {
    expect(
      items.filter((i) => i.kind === "phrase" && !retiredItemIds.has(i.id)),
    ).toHaveLength(5);
    expect(
      lessons
        .flatMap((l) => l.exercises)
        .every((e) => !e.itemIds.some((id) => retiredItemIds.has(id))),
    ).toBe(true);
    expect(lessons[11].examples.every((e) => e.ko !== "안녕")).toBe(true);
  });
  it("preserves older phrase evidence and review opportunities without inventing that learning for new students", () => {
    const p = freshProgress();
    p.completedLessonIds = lessons.slice(0, 12).map((l) => l.id);
    expect(learnedItemIds(p).has("u1-phrase-hi")).toBe(false);
    p.mastery["u1-phrase-hi"] = updateMastery(
      undefined,
      "u1-phrase-hi",
      true,
      false,
      false,
      "u1-day-12-phrase-3",
      day(2026, 11, 3),
    );
    expect(learnedItemIds(p).has("u1-phrase-hi")).toBe(true);
    expect(
      reviewExercises(p).some((e) => e.itemIds.includes("u1-phrase-hi")),
    ).toBe(true);
    expect(isProgress(p)).toBe(true);
  });
});
