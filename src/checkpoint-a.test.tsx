import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  characters,
  exerciseById,
  itemById,
  lessons,
  soundId,
  legacySoundLabels,
} from "./curriculum";
import {
  classifyAnswer,
  continueSession,
  keyboardChoice,
  makeSession,
  skipTyping,
  submitAnswer,
  reviewQueue,
  isAnswerReady,
  updateMastery,
} from "./learning";
import {
  freshProgress,
  isProgress,
  localProgressRepository,
  STORAGE_KEY,
} from "./progress";
import { KeyboardHelp, LessonView } from "./components/LessonPlayer";
const now = Date.UTC(2026, 10, 4, 12);
function task(ko: string) {
  return Object.values(exerciseById).find(
    (e) =>
      e.type === "type-sound" &&
      !e.id.startsWith("retry") &&
      e.itemIds[0] === soundId(ko),
  )!;
}
function withTask(ko: string) {
  const p = freshProgress(),
    e = task(ko);
  p.session = {
    ...makeSession(p, lessons[0].id, now)!,
    exerciseIds: [e.id],
    heardAudio: true,
  };
  return { p, e };
}
describe("explicit sound grading", () => {
  it("keeps approximations visible in recent evidence and asks for a later exact recall", () => {
    const { p, e } = withTask("ㅣ"),
      partial = submitAnswer(p, "ee", now),
      id = e.itemIds[0];
    expect(partial.mastery[id].recentPerformance.at(-1)?.outcome).toBe(
      "sound-correct",
    );
    expect(partial.mastery[id].level).not.toBe("mastered");
  });
  it.each([
    ["ㅣ", "i", "correct"],
    ["ㅣ", "ee", "sound-correct"],
    ["ㅣ", "e", "incorrect"],
    ["ㅏ", "a", "correct"],
    ["ㅏ", "AH", "sound-correct"],
    ["ㅜ", "oo", "sound-correct"],
    ["ㅓ", "uh", "incorrect"],
    ["ㅡ", "u", "incorrect"],
    ["ㄱ", "k", "sound-correct"],
    ["ㅇ", "ng", "incorrect"],
  ])("%s / %s → %s", (ko, value, outcome) => {
    expect(classifyAnswer(task(ko), value)).toBe(outcome);
  });
  it("limits approximations to explicitly approved characters and English sound tasks", () => {
    const e = Object.values(exerciseById).find(
      (e) => e.type === "listen-type",
    )!;
    expect(classifyAnswer({ ...e, soundAlternatives: ["na"] }, "na")).toBe(
      "incorrect",
    );
    for (const c of characters) {
      const alternatives = c.soundAlternatives ?? [];
      expect(
        alternatives.some((value) =>
          characters.some((other) => other.id !== c.id && other.rr === value),
        ),
      ).toBe(false);
    }
  });
  it("awards understanding without calling an approximation a mistake or exact independent recall", () => {
    const { p, e } = withTask("ㅏ");
    const exact = submitAnswer(p, "a", now),
      partial = submitAnswer(p, "ah", now),
      hinted = submitAnswer(
        { ...p, session: { ...p.session!, hintUsed: true } },
        "a",
        now,
      );
    const id = e.itemIds[0];
    expect(partial.session?.outcome).toBe("sound-correct");
    expect(partial.session?.lastCorrect).toBe(true);
    expect(partial.mastery[id].correctAttempts).toBe(1);
    expect(partial.mastery[id].incorrectAttempts).toBe(0);
    expect(partial.mastery[id].soundCorrectAttempts).toBe(1);
    expect(partial.mastery[id].independentRecalls).toBe(0);
    expect(partial.mastery[id].evidencePoints).toBeLessThan(
      exact.mastery[id].evidencePoints!,
    );
    expect(partial.mastery[id].evidencePoints).toBeGreaterThan(
      hinted.mastery[id].evidencePoints!,
    );
    expect(Date.parse(partial.mastery[id].nextReviewAt!)).toBeLessThan(
      Date.parse(exact.mastery[id].nextReviewAt!),
    );
    expect(isProgress(partial)).toBe(true);
    expect(continueSession(partial).completedLessonIds).toContain(
      lessons[0].id,
    );
  });
});
describe("short Learn → Recognize → Recall → Review lessons", () => {
  it.each(lessons.map((l) => [l.id, l] as const))(
    "%s has 9–12 tasks, no grids, and old/new coverage",
    (_id, l) => {
      expect(l.exercises.length).toBeGreaterThanOrEqual(9);
      expect(l.exercises.length).toBeLessThanOrEqual(12);
      expect(
        l.exercises.some((e) => (e as unknown as { pairs: unknown }).pairs),
      ).toBe(false);
      for (const id of l.newItemIds.filter((id) =>
        ["vowel", "consonant"].includes(itemById[id].kind),
      )) {
        expect(
          l.exercises.some(
            (e) => e.type === "character-recognition" && e.itemIds.includes(id),
          ),
        ).toBe(true);
        expect(
          l.exercises.some(
            (e) => e.type === "type-sound" && e.itemIds.includes(id),
          ),
        ).toBe(true);
      }
      if (l.day > 1) {
        const old = l.reviewItemIds.slice(0, 3);
        for (const id of old)
          expect(l.exercises.some((e) => e.itemIds.includes(id))).toBe(true);
      }
    },
  );
  it("shows the taught label in introductions and only labels in sound choices", () => {
    const html = renderToStaticMarkup(
      <LessonView
        lesson={lessons[0]}
        progress={freshProgress()}
        update={() => {}}
      />,
    );
    expect(html).toContain("ㅏ");
    expect(html).toContain(">a<");
    for (const l of lessons)
      for (const e of l.exercises.filter(
        (e) => e.type === "character-recognition",
      ))
        expect(e.options!.every((o) => /^[a-z]+$/.test(o.label))).toBe(true);
  });
});
describe("bounded later retries", () => {
  it("queues a different-format task at the end, preserves mistakes and cannot loop", () => {
    let p = freshProgress();
    p.session = makeSession(p, lessons[0].id, now);
    const e = exerciseById[p.session!.exerciseIds[0]],
      core = p.session!.exerciseIds.length;
    p = submitAnswer(p, "wrong", now);
    expect(p.session!.exerciseIds.length).toBe(core + 1);
    const retry = exerciseById[p.session!.exerciseIds.at(-1)!];
    expect(retry.type).not.toBe(e.type);
    expect(retry.itemIds).toEqual(e.itemIds);
    expect(p.mastery[e.itemIds[0]].incorrectAttempts).toBe(1);
    p.session = {
      ...p.session!,
      index: p.session!.exerciseIds.length - 1,
      resolved: false,
      answer: "",
      hintUsed: false,
    };
    p = submitAnswer(p, retry.answers[0], now + 1000);
    expect(p.mastery[e.itemIds[0]].incorrectAttempts).toBe(1);
    expect(p.mastery[e.itemIds[0]].independentRecalls).toBe(0);
    expect(p.session!.exerciseIds.length).toBe(core + 1);
    expect(continueSession(p).completedLessonIds).toContain(lessons[0].id);
  });
  it("caps corrections at three distinct items even when a learner misses every question", () => {
    let p = freshProgress();
    p.session = makeSession(p, lessons[0].id, now);
    const core = p.session!.exerciseIds.length;
    let steps = 0;
    while (p.session) {
      const e = exerciseById[p.session.exerciseIds[p.session.index]];
      p = {
        ...p,
        session: { ...p.session, heardAudio: true, keyboardReady: true },
      };
      p = submitAnswer(p, "wrong", now + steps);
      p = continueSession(p);
      steps++;
      if (steps > core + 3) throw Error("Unbounded correction loop");
    }
    expect(steps).toBeLessThanOrEqual(core + 3);
    expect(p.history.filter((h) => !h.correct).length).toBe(steps);
  });
});
describe("phone keyboard decisions", () => {
  it("shows the exact short help and two choices", () => {
    const html = renderToStaticMarkup(<KeyboardHelp onChoice={() => {}} />);
    expect(html).toContain(
      "Ask Gabe to help set up the Korean keyboard on your phone.",
    );
    expect(html).toContain("I&#x27;m ready");
    expect(html).toContain("Skip for now");
    expect(html).not.toContain("Settings →");
  });
  it("skips all Korean typing in that session without answers, penalties or mastery credit, then offers it later", () => {
    let p = freshProgress();
    p.completedLessonIds = lessons.slice(0, 10).map((l) => l.id);
    p.session = makeSession(p, lessons[10].id, now);
    expect(p.session!.keyboardReady).toBe(false);
    p = keyboardChoice(p, "deferred");
    const ids = Object.keys(p.mastery);
    p = skipTyping(p);
    expect(p.session!.outcome).toBe("skipped");
    expect(Object.keys(p.mastery)).toEqual(ids);
    expect(p.history).toEqual([]);
    p = continueSession(p);
    expect(p.session!.keyboardDecision).toBe("deferred");
    p = skipTyping(p);
    expect(p.history).toEqual([]);
    expect(p.keyboardDeferred).toBe(true);
    const next = makeSession(p, lessons[10].id, now + 1000)!;
    expect(next.keyboardDecision).toBeUndefined();
    expect(next.keyboardReady).toBe(false);
  });
  it("ready permits strict spelling and sound recall never triggers a keyboard requirement", () => {
    let p = freshProgress();
    p.completedLessonIds = lessons.slice(0, 10).map((l) => l.id);
    p.session = makeSession(p, lessons[10].id, now);
    p = keyboardChoice(p, "ready");
    p = { ...p, session: { ...p.session!, heardAudio: true } };
    const e = exerciseById[p.session!.exerciseIds[0]];
    expect(submitAnswer(p, e.answers[0], now).session!.lastCorrect).toBe(true);
    expect(task("ㅣ").requiresKeyboard).toBeUndefined();
  });
});
describe("release compatibility", () => {
  it("resumes an old matching session in place, translates its selection and retains all historical evidence", () => {
    const p = freshProgress(),
      id = "u1-day-01-match";
    p.completedLessonIds = ["u1-day-01"];
    p.session = {
      ...makeSession(p, "u1-day-01", now)!,
      index: 1,
      exerciseIds: ["u1-day-01-recognize-0", id, "u1-day-01-recall-0"],
      answer: { [soundId("ㅏ")]: soundId("ㅗ") },
    };
    p.mastery[soundId("ㅏ")] = updateMastery(
      undefined,
      soundId("ㅏ"),
      false,
      false,
      false,
      "old-match",
      now,
    );
    const raw = JSON.stringify(p),
      map = new Map([[STORAGE_KEY, raw]]);
    const repo = localProgressRepository(() => ({
      getItem: (k) => map.get(k) ?? null,
      setItem: (k, v) => {
        map.set(k, v);
      },
    }));
    const next = repo.load().progress;
    expect(next.session!.index).toBe(1);
    expect(next.session!.exerciseIds).toEqual(p.session.exerciseIds);
    expect(next.session!.answer).toBe("o");
    expect(next.session!.legacyMatchingAnswer).toEqual(p.session.answer);
    expect(next.mastery).toEqual(p.mastery);
    expect(next.completedLessonIds).toEqual(p.completedLessonIds);
    expect(map.get(STORAGE_KEY)).toBe(raw);
    expect(isProgress(next)).toBe(true);
  });
  it("translates saved long choice labels without resetting the session or raw save", () => {
    const p = freshProgress();
    p.session = makeSession(p, lessons[0].id, now);
    const old = Object.keys(legacySoundLabels).find(
      (x) => legacySoundLabels[x] === "i",
    )!;
    p.session!.answer = old;
    const repo = localProgressRepository(() => ({
      getItem: () => JSON.stringify(p),
      setItem: () => {
        throw Error("must not write on load");
      },
    }));
    expect(repo.load().progress.session!.answer).toBe("i");
  });
});
