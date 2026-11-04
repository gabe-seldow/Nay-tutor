import { describe, it, expect, vi } from "vitest";
import {
  characters,
  exerciseById,
  itemById,
  items,
  lessons,
  soundId,
} from "./curriculum";
import { validateCurriculum } from "./validate-curriculum";
import {
  freshProgress,
  isProgress,
  isUnlocked,
  localProgressRepository,
  migratePhaseOne,
  nextLesson,
  STORAGE_KEY,
} from "./progress";
import {
  answerText,
  blockParts,
  completionPercent,
  composeBlock,
  continueSession,
  evaluateAnswer,
  makeSession,
  newMastery,
  normalizeAnswer,
  resolveExercise,
  reviewQueue,
  shuffled,
  submitAnswer,
  updateMastery,
} from "./learning";
import { parseRoute } from "./navigation";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ExerciseControls } from "./components/LessonPlayer";
import type { Answer, Exercise, LearnerProgress } from "./types";
const now = Date.UTC(2026, 10, 3, 12),
  DAY = 86400000;
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
function sample(e: Exercise): Answer {
  return e.answers[0];
}
function ready(p: LearnerProgress, e: Exercise) {
  p.session = {
    ...makeSession(
      p,
      lessons.find((l) => l.exercises.some((x) => x.id === e.id))!.id,
      now,
    )!,
    heardAudio: true,
    keyboardReady: true,
    exerciseIds: [e.id],
  };
  return p;
}
describe("Unit 1 curriculum", () => {
  it("has fourteen playable lessons and no untaught assessment dependencies", () => {
    expect(lessons).toHaveLength(14);
    expect(characters).toHaveLength(13);
    expect(validateCurriculum()).toEqual([]);
    expect(Object.keys(exerciseById).length).toBeGreaterThan(120);
  });
  it.each(lessons.map((l) => [l.id, l] as const))(
    "%s has valid authored answers, hints, feedback and clear audio",
    (_id, l) => {
      for (const e of l.exercises) {
        expect(evaluateAnswer(e, sample(e)).correct).toBe(true);
        expect(e.hint).toBeTruthy();
        expect(e.feedback.incorrect).toBeTruthy();
        if (e.type === "sound-to-character") {
          expect(e.answers[0]).toBe(itemById[e.itemIds[0]].ko);
          expect(e.display).toBeUndefined();
          expect(e.audio?.text).not.toMatch(/^[ㄱ-ㅣ]$/);
        }
      }
    },
  );
  it("detects audio/answer mismatch, untaught letters, and invalid build pieces", () => {
    const data = structuredClone(lessons);
    data[0].exercises[1].audio!.text = "커";
    data[0].exercises[1].answers = ["ㅓ"];
    data[3].exercises.find((e) => e.type === "build-syllable")!.onsets = [];
    const errors = validateCurriculum(data);
    expect(errors.some((e) => e.includes("Untaught block"))).toBe(true);
    expect(errors.some((e) => e.includes("answer mismatch"))).toBe(true);
    expect(errors.some((e) => e.includes("Unbuildable"))).toBe(true);
  });
  it("keeps every unfamiliar phrase supported and marks casual versus polite", () => {
    for (const item of items.filter((i) => i.kind === "phrase")) {
      expect(item.guided).toBe(true);
      for (const e of Object.values(exerciseById).filter((e) =>
        e.itemIds.includes(item.id),
      ))
        expect(e.type).toBe("guided-phrase");
    }
    expect(itemById["u1-phrase-hi"].speechLevel).toBe("casual");
    expect(itemById["u1-phrase-hello"].speechLevel).toBe("polite");
  });
  it("provides an independent recall route for every taught character", () => {
    const recalled = new Set(
      Object.values(exerciseById)
        .filter((e) => e.type === "type-sound" || e.type === "listen-type")
        .flatMap((e) => e.itemIds),
    );
    expect(characters.every((item) => recalled.has(item.id))).toBe(true);
  });
  it("does not reuse Phase 1 planned lesson IDs as new learning credit", () => {
    expect(lessons.every((l) => /^u1-day-\d\d$/.test(l.id))).toBe(true);
    expect(parseRoute("#/lesson/u2-l1")).toBeNull();
    expect(parseRoute("#/lesson/u1-l1")).toBeNull();
  });
});
describe("answers and controls", () => {
  it("normalizes Unicode NFC and case without accepting wrong scripts", () => {
    expect(normalizeAnswer("  EO ")).toBe("eo");
    const hangul = Object.values(exerciseById).find(
      (e) => e.type === "listen-type",
    )!;
    expect(evaluateAnswer(hangul, "나").correct).toBe(true);
    expect(evaluateAnswer(hangul, "na").correct).toBe(false);
    const rr = lessons[0].exercises.find((e) => e.type === "type-sound")!;
    expect(evaluateAnswer(rr, "아").correct).toBe(false);
    expect(evaluateAnswer(rr, " A ").correct).toBe(true);
  });
  it("composes only valid open syllables", () => {
    expect(composeBlock("ㄴ", "ㅏ")).toBe("나");
    expect(composeBlock("ㅁ", "ㅗ")).toBe("모");
    expect(composeBlock("no", "ㅏ")).toBe("");
    expect(blockParts("밥")).toBeNull();
  });
  it("shuffles positions reproducibly with varied seeds, preserving choices", () => {
    const list = ["a", "b", "c", "d"];
    expect(shuffled(list, "one")).toEqual(shuffled(list, "one"));
    expect(
      new Set(
        Array.from({ length: 20 }, (_, i) =>
          shuffled(list, String(i)).join(""),
        ),
      ).size,
    ).toBeGreaterThan(4);
    expect(shuffled(list, "two").sort()).toEqual(list);
  });
  it("renders independent recall without the answer or an always-visible hint", () => {
    const e = lessons[1].exercises.find((e) => e.type === "type-sound")!;
    const html = renderToStaticMarkup(
      createElement(ExerciseControls, {
        exercise: e,
        answer: "",
        disabled: false,
        seed: "test",
        setAnswer: () => {},
        onSubmit: () => {},
      }),
    );
    expect(html).toContain("English letters");
    expect(html).not.toContain('value="eo"');
    expect(html).not.toContain(e.hint);
  });
  it("applies configured family names and correct topic particles without changing stable IDs", () => {
    const p = freshProgress();
    p.profile.dog = { name: "Buddy", koreanName: "버디" };
    p.profile.brother = { name: "Jay", koreanName: "재이" };
    const dog = resolveExercise(
      Object.values(exerciseById).find((e) =>
        e.profileTemplate?.includes("{dog}"),
      )!,
      p.profile,
    );
    expect(dog.display).toBe("버디 어디 있어요?");
    expect(dog.answers).toEqual(["Where is Buddy?"]);
    const brother = resolveExercise(
      Object.values(exerciseById).find((e) =>
        e.profileTemplate?.includes("{brotherTopic}"),
      )!,
      p.profile,
    );
    expect(brother.display).toBe("재이는 뭐 해요?");
    expect(brother.id).toContain("u1-day-13");
  });
});
describe("learning, completion and review", () => {
  it("does not allow locked lessons or completion without submitting", () => {
    const p = freshProgress();
    expect(makeSession(p, lessons[1].id, now)).toBeNull();
    expect(continueSession(p)).toBe(p);
    expect(nextLesson(p)?.id).toBe(lessons[0].id);
  });
  it("requires real audio or explicit supported fallback before a listening answer", () => {
    const e = lessons[0].exercises[1],
      p = ready(freshProgress(), e);
    p.session!.heardAudio = false;
    expect(submitAnswer(p, e.answers[0], now)).toBe(p);
    p.session!.hintUsed = true;
    const after = submitAnswer(p, e.answers[0], now);
    expect(after.history[0].hintUsed).toBe(true);
    expect(after.mastery[e.itemIds[0]].independentRecalls).toBe(0);
  });
  it("records wrong answers, repeats them once and prevents duplicate submission on reload", () => {
    const e = lessons[0].exercises[0],
      p = ready(freshProgress(), e);
    const after = submitAnswer(p, "wrong", now);
    expect(after.session!.exerciseIds).toEqual([e.id, "retry-" + e.id]);
    expect(after.mastery[e.itemIds[0]].incorrectAttempts).toBe(1);
    expect(submitAnswer(after, e.answers[0], now)).toBe(after);
    const again = continueSession(after);
    again.session!.heardAudio = true;
    const retry =
      exerciseById[again.session!.exerciseIds[again.session!.index]];
    const final = submitAnswer(again, retry.answers[0], now + 1000);
    expect(final.mastery[e.itemIds[0]].hintedAttempts).toBe(0);
    expect(final.history.at(-1)?.mode).toBe("guided");
    expect(final.mastery[e.itemIds[0]].independentRecalls).toBe(0);
    expect(continueSession(final).completedLessonIds).toContain(lessons[0].id);
  });
  it("completes a lesson once at 100 percent and unlocks the next", () => {
    const e = lessons[0].exercises[0],
      p = ready(freshProgress(), e),
      after = submitAnswer(p, sample(e), now);
    expect(completionPercent(after.session!)).toBe(100);
    const done = continueSession(after);
    expect(done.session).toBeNull();
    expect(done.completedLessonIds).toEqual([lessons[0].id]);
    expect(isUnlocked(lessons[1].id, done)).toBe(true);
  });
  it("keeps lucky recognition from becoming mastery and schedules misses sooner", () => {
    const id = soundId("ㅓ");
    let m = newMastery(id);
    for (let i = 0; i < 20; i++)
      m = updateMastery(m, id, true, false, false, "mc", now + i * DAY);
    expect(m.level).not.toBe("mastered");
    expect(m.independentRecalls).toBe(0);
    const missed = updateMastery(m, id, false, false, false, "mc", now);
    expect(Date.parse(missed.nextReviewAt!) - now).toBe(600000);
  });
  it("requires varied delayed independent recall for mastery and demotes after an error", () => {
    const id = soundId("ㅏ");
    let m = updateMastery(undefined, id, true, false, true, "recall-a", now);
    m = updateMastery(m, id, true, false, true, "recall-b", now + DAY);
    m = updateMastery(m, id, true, false, true, "recall-c", now + 2 * DAY);
    expect(m.level).toBe("mastered");
    expect(m.delayedRecalls).toBe(2);
    expect(Date.parse(m.nextReviewAt!) - (now + 2 * DAY)).toBe(7 * DAY);
    m = updateMastery(m, id, false, false, true, "recall-d", now + 3 * DAY);
    expect(m.level).not.toBe("mastered");
    for (let i = 0; i < 10; i++)
      m = updateMastery(
        m,
        id,
        true,
        false,
        false,
        "lucky-choice",
        now + 4 * DAY + i,
      );
    expect(m.level).not.toBe("mastered");
  });
  it("does not grant independent credit when a hint or immediate repeat supplied support", () => {
    const id = soundId("ㅏ"),
      m = updateMastery(undefined, id, true, true, true, "type", now);
    expect(m.independentRecalls).toBe(0);
    expect(Date.parse(m.nextReviewAt!) - now).toBe(3600000);
  });
  it("does not count a just-seen answer as a delayed recall", () => {
    const id = soundId("ㅓ");
    let m = updateMastery(undefined, id, true, false, true, "recall-a", now);
    m = updateMastery(m, id, true, false, false, "recognition", now + 2 * DAY);
    m = updateMastery(
      m,
      id,
      true,
      false,
      true,
      "recall-b",
      now + 2 * DAY + 1000,
    );
    expect(m.delayedRecalls).toBe(0);
  });
  it("prioritizes recently missed sounds and supports practice even when nothing is due", () => {
    const p = freshProgress(),
      a = soundId("ㅏ"),
      eo = soundId("ㅓ");
    p.mastery[a] = updateMastery(undefined, a, true, false, true, "a", now);
    p.mastery[eo] = updateMastery(
      undefined,
      eo,
      false,
      false,
      false,
      "eo",
      now,
    );
    expect(reviewQueue(p, now)[0].itemId).toBe(eo);
    expect(reviewQueue(p, now, true)).toHaveLength(0);
    expect(makeSession(p, null, now)).not.toBeNull();
  });
  it("keeps review within learned content and gates Hangul typing behind orientation", () => {
    const p = freshProgress();
    p.completedLessonIds = [lessons[0].id];
    const session = makeSession(p, null, now)!;
    expect(
      session.exerciseIds.every((id) =>
        exerciseById[id].itemIds.every((item) =>
          lessons[0].newItemIds.includes(item),
        ),
      ),
    ).toBe(true);
    expect(
      session.exerciseIds.every((id) => !exerciseById[id].requiresKeyboard),
    ).toBe(true);
  });
  it("gives consonants recall evidence through learned Hangul typing, separately from block evidence", () => {
    const e = Object.values(exerciseById).find(
        (e) => e.type === "listen-type",
      )!,
      p = freshProgress();
    p.completedLessonIds = lessons.slice(0, 10).map((l) => l.id);
    p.keyboardIntroduced = true;
    ready(p, e);
    const after = submitAnswer(p, e.answers[0], now);
    expect(after.mastery[soundId("ㄴ")].independentRecalls).toBe(1);
    expect(after.mastery[e.itemIds[0]].kind).toBe("syllable");
  });
});
describe("storage and update compatibility", () => {
  it("round trips a partially answered and hinted session across refresh", () => {
    const storage = memory(),
      repo = localProgressRepository(() => storage),
      p = freshProgress();
    p.session = makeSession(p, lessons[0].id, now);
    p.session!.answer = "wrong";
    p.session!.hintUsed = true;
    expect(repo.save(p)).toBe(true);
    expect(repo.load().progress).toEqual(p);
  });
  it("migrates Phase 1 names and preferences, archives planned credit without granting new lesson completion", () => {
    const old = {
      version: 1,
      curriculumVersion: 1,
      profile: freshProgress().profile,
      completedLessonIds: ["u1-l1"],
      mastery: { old: { anything: true } },
      preferences: { romanization: "on-demand" },
      navigation: { page: "learn", previewLessonId: "u2-l1" },
    };
    const p = migratePhaseOne(old)!;
    expect(p.profile).toEqual(old.profile);
    expect(p.preferences.romanization).toBe("on-demand");
    expect(p.completedLessonIds).toEqual([]);
    expect(p.legacyPlan?.completedLessonIds).toEqual(["u1-l1"]);
    expect(p.legacyPlan?.mastery).toEqual(old.mastery);
    expect(isProgress(p)).toBe(true);
  });
  it("preserves existing completion and history when additional lesson IDs are added in a normal update", () => {
    const storage = memory(),
      repo = localProgressRepository(() => storage),
      p = freshProgress();
    p.completedLessonIds = [lessons[0].id, "unit-2-future-stable-id"];
    p.history = [
      {
        exerciseId: "retained-exercise-id",
        itemIds: [soundId("ㅏ")],
        correct: true,
        hintUsed: false,
        mode: "recall",
        at: new Date(now).toISOString(),
      },
    ];
    expect(repo.save(p)).toBe(true);
    expect(repo.load().progress.completedLessonIds).toEqual(
      p.completedLessonIds,
    );
    expect(repo.load().progress.history).toEqual(p.history);
  });
  it("never reads or writes Hangeul progress", () => {
    const storage = memory();
    storage.data.set("hangeul.progress.v2", "original");
    const repo = localProgressRepository(() => storage);
    repo.load();
    repo.save(freshProgress());
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(
      storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY),
    ).toBe(true);
    expect(storage.data.get("hangeul.progress.v2")).toBe("original");
  });
  it.each(["broken", "null", '{"version":99}'])(
    "preserves malformed storage and reports the problem: %s",
    (raw) => {
      const storage = memory();
      storage.data.set(STORAGE_KEY, raw);
      expect(
        localProgressRepository(() => storage).load().warning,
      ).toBeTruthy();
      expect(storage.data.get(STORAGE_KEY)).toBe(raw);
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );
  it("handles blocked reads and failed writes without crashing", () => {
    const repo = localProgressRepository(() => {
      throw Error("blocked");
    });
    expect(repo.load().warning).toBeTruthy();
    expect(repo.save(freshProgress())).toBe(false);
  });
  it("rejects malformed counters, dates and saved sessions", () => {
    const p = freshProgress();
    p.mastery[soundId("ㅏ")] = newMastery(soundId("ㅏ"));
    p.mastery[soundId("ㅏ")].incorrectAttempts = -1;
    expect(isProgress(p)).toBe(false);
    p.mastery = {};
    p.session = { index: 500 } as LearnerProgress["session"];
    expect(isProgress(p)).toBe(false);
  });
});
