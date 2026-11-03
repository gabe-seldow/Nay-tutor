import { describe, it, expect, vi } from "vitest";
import { characters, items, lessons, units, itemById } from "./curriculum";
import { validateCurriculum } from "./validate-curriculum";
import {
  defaultProfile,
  freshProgress,
  hangulProgress,
  isProgress,
  isUnlocked,
  localProgressRepository,
  nextLesson,
  STORAGE_KEY,
} from "./progress";
import { parseRoute, routeHref, savedRoute } from "./navigation";
import type { LearnerProgress, MasteryRecord } from "./types";

function memory() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: vi.fn((k: string) => data.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => {
      data.set(k, v);
    }),
  };
}
describe("Phase 1 curriculum contract", () => {
  it("has a complete, structurally valid eight-unit plan with no runnable lesson claims", () => {
    expect(units).toHaveLength(8);
    expect(lessons).toHaveLength(40);
    expect(validateCurriculum()).toEqual([]);
    expect(
      lessons.every(
        (l) =>
          l.status === "planned" &&
          l.exercises.every((e) => e.status === "planned"),
      ),
    ).toBe(true);
  });
  it("covers all 21 vowels and 19 consonants with stable, unique item IDs", () => {
    expect(characters.filter((x) => x.kind === "vowel")).toHaveLength(21);
    expect(characters.filter((x) => x.kind === "consonant")).toHaveLength(19);
    expect(new Set(items.map((x) => x.id)).size).toBe(items.length);
    expect(new Set(lessons.flatMap((l) => l.newItemIds)).size).toBe(
      items.length,
    );
  });
  it("starts with only two vowels and a silent carrier", () => {
    expect(lessons[0].newItemIds.map((id) => itemById[id].ko)).toEqual([
      "ㅏ",
      "ㅣ",
      "ㅇ",
    ]);
    expect(lessons[0].prerequisites).toEqual([]);
  });
  it("defines objectives, examples, answers, hints, feedback, and review dependencies for every lesson", () => {
    for (const l of lessons) {
      expect(l.objective).toBeTruthy();
      expect(l.examples.length).toBeGreaterThan(0);
      expect(l.minutes).toBeGreaterThanOrEqual(3);
      expect(l.minutes).toBeLessThanOrEqual(5);
      for (const e of l.exercises) {
        expect(e.answers.length).toBeGreaterThan(0);
        expect(e.hint).toBeTruthy();
        expect(e.feedback.correct).toBeTruthy();
        expect(e.feedback.incorrect).toBeTruthy();
      }
    }
  });
  it("detects cyclic, unknown, or forward prerequisites", () => {
    const course = structuredClone(lessons);
    course[0].prerequisites = ["u8-l4"];
    expect(
      validateCurriculum(course).some((e) =>
        e.includes("Prerequisite must exist earlier"),
      ),
    ).toBe(true);
  });
  it("detects untaught review items and missing exercise answers", () => {
    const course = structuredClone(lessons);
    course[0].reviewItemIds = ["word-bap"];
    course[1].exercises[0].answers = [];
    expect(validateCurriculum(course)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Review item not taught earlier"),
        expect.stringContaining("Incomplete exercise outline"),
      ]),
    );
  });
  it("detects undeclared letters, audio transcripts in prompts, and premature typing", () => {
    const course = structuredClone(lessons);
    course[0].exercises[1].prompt = "Listen to 아";
    course[0].exercises[2] = {
      ...course[0].exercises[2],
      type: "listen-type",
      input: "Hangul",
      answers: ["커피"],
    };
    const errors = validateCurriculum(course);
    expect(errors.some((e) => e.includes("reveals its transcript"))).toBe(true);
    expect(errors.some((e) => e.includes("before keyboard orientation"))).toBe(
      true,
    );
    expect(errors.some((e) => e.includes("Untaught initial/vowel"))).toBe(true);
  });
  it("does not test merged ae/e spellings as an audio-only distinction", () => {
    expect(
      lessons.find((l) => l.id === "u2-l5")!.exercises.every((e) => !e.audio),
    ).toBe(true);
  });
  it("keeps consonant speech in syllable context and uses Korean-only audio", () => {
    expect(
      characters
        .filter((x) => x.kind === "consonant")
        .every(
          (x) =>
            x.audio.mode === "context-syllable" &&
            x.audio.text !== x.ko &&
            !!x.audio.note,
        ),
    ).toBe(true);
    expect(items.every((x) => x.audio.language === "ko-KR")).toBe(true);
  });
  it("keeps casual forms optional and late, and identifies formal thanks", () => {
    expect(
      items
        .filter((x) => x.kind === "phrase" && x.speechLevel === "casual")
        .map((x) => x.id),
    ).toEqual(["phrase-casual-what", "phrase-casual-night"]);
    expect(itemById["phrase-thanks-formal"]).toMatchObject({
      speechLevel: "formal-polite",
    });
    expect(lessons.find((l) => l.id === "u5-l1")!.explanation).toContain(
      "siblings commonly use casual Korean",
    );
  });
});
describe("independent progress repository", () => {
  it("starts fresh with unconfirmed configurable family spellings and zero learning credit", () => {
    const p = freshProgress();
    expect(isProgress(p)).toBe(true);
    expect(p.profile).toEqual(defaultProfile);
    expect(p.profile.spellingsConfirmed).toBe(false);
    expect(p.completedLessonIds).toEqual([]);
    expect(p.mastery).toEqual({});
  });
  it("isolates fresh objects from one another and the default profile", () => {
    const a = freshProgress(),
      b = freshProgress();
    a.profile.learner.name = "Changed";
    expect(b.profile.learner.name).toBe("Jaeyeon");
    expect(defaultProfile.learner.name).toBe("Jaeyeon");
  });
  it("never reads, migrates, overwrites or removes Hangeul data", () => {
    const storage = memory();
    storage.data.set("hangeul.progress.v2", "personal data");
    const repo = localProgressRepository(() => storage);
    const { progress } = repo.load();
    expect(repo.save(progress)).toBe(true);
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(
      storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY),
    ).toBe(true);
    expect(storage.data.get("hangeul.progress.v2")).toBe("personal data");
  });
  it("round trips profiles, settings, completion, categories, and last preview", () => {
    const storage = memory(),
      repo = localProgressRepository(() => storage),
      p = freshProgress();
    p.profile.dog = { name: "Miguel", koreanName: "미구엘" };
    p.profile.spellingsConfirmed = true;
    p.preferences.romanization = "on-demand";
    p.completedLessonIds = ["u1-l1"];
    p.navigation = { page: "learn", previewLessonId: "u1-l2" };
    const at = new Date().toISOString();
    const m: MasteryRecord = {
      itemId: "hangul-314f",
      kind: "vowel",
      correctAttempts: 1,
      incorrectAttempts: 2,
      hintedAttempts: 1,
      recentPerformance: [{ correct: false, hintUsed: true, at }],
      lastPracticedAt: at,
      nextReviewAt: at,
      level: "learning",
    };
    p.mastery[m.itemId] = m;
    expect(repo.save(p)).toBe(true);
    expect(repo.load()).toEqual({ progress: p, warning: null });
  });
  it.each(["not json", "null", '{"version":99}', '{"version":1}'])(
    "recovers malformed saves without overwriting them: %s",
    (raw) => {
      const storage = memory();
      storage.data.set(STORAGE_KEY, raw);
      const result = localProgressRepository(() => storage).load();
      expect(result.warning).toBeTruthy();
      expect(isProgress(result.progress)).toBe(true);
      expect(storage.setItem).not.toHaveBeenCalled();
      expect(storage.data.get(STORAGE_KEY)).toBe(raw);
    },
  );
  it("reports read and write failures without crashing", () => {
    const repo = localProgressRepository(() => {
      throw Error("denied");
    });
    expect(repo.load().warning).toBeTruthy();
    expect(repo.save(freshProgress())).toBe(false);
    const storage = memory();
    storage.setItem.mockImplementation(() => {
      throw Error("quota");
    });
    expect(localProgressRepository(() => storage).save(freshProgress())).toBe(
      false,
    );
  });
  it.each([
    "profile",
    "navigation",
    "mastery",
    "preferences",
    "completedLessonIds",
  ])("rejects invalid nested %s data", (key) => {
    const p = freshProgress() as unknown as Record<string, unknown>;
    p[key] = null;
    expect(isProgress(p)).toBe(false);
  });
  it("rejects unknown items, invalid dates, and unknown lessons", () => {
    const p = freshProgress();
    p.completedLessonIds = ["missing"];
    expect(isProgress(p)).toBe(false);
    p.completedLessonIds = [];
    p.updatedAt = "yesterday";
    expect(isProgress(p)).toBe(false);
    p.updatedAt = new Date().toISOString();
    p.mastery.bad = {} as MasteryRecord;
    expect(isProgress(p)).toBe(false);
  });
  it("does not save an invalid in-memory payload", () => {
    const storage = memory();
    expect(
      localProgressRepository(() => storage).save({
        version: 99,
      } as unknown as LearnerProgress),
    ).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it("computes prerequisite-based next lessons without awarding completion", () => {
    const p = freshProgress();
    expect(nextLesson(p)?.id).toBe("u1-l1");
    expect(isUnlocked("u1-l2", p)).toBe(false);
    p.completedLessonIds = ["u1-l1"];
    expect(nextLesson(p)?.id).toBe("u1-l2");
    expect(isUnlocked("u1-l2", p)).toBe(true);
    expect(isUnlocked("invalid", p)).toBe(false);
  });
  it("keeps Hangul progress separate from vocabulary and phrases", () => {
    const p = freshProgress();
    expect(hangulProgress(p)).toEqual({ practiced: 0, mastered: 0, total: 40 });
  });
});
describe("navigation", () => {
  it.each(["learn", "hangul", "review", "settings"] as const)(
    "round trips the %s page",
    (page) => {
      const route = { page, lessonId: null };
      expect(parseRoute(routeHref(route))).toEqual(route);
    },
  );
  it("resolves stable lesson IDs and rejects arbitrary routes", () => {
    expect(parseRoute("#/lesson/u1-l1")).toEqual({
      page: "learn",
      lessonId: "u1-l1",
    });
    expect(parseRoute("#/lesson/nope")).toBeNull();
    expect(parseRoute("#/unknown")).toBeNull();
    expect(parseRoute("#/<script>")).toBeNull();
  });
  it("restores the last preview from saved progress", () => {
    const p = freshProgress();
    p.navigation = { page: "learn", previewLessonId: "u2-l3" };
    expect(routeHref(savedRoute(p))).toBe("#/lesson/u2-l3");
  });
});
