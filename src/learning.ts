import {
  audio,
  characters,
  exerciseById,
  itemById,
  items,
  lessonById,
  lessons,
  soundId,
} from "./curriculum";
import type {
  Answer,
  Exercise,
  LearnerProfile,
  LearnerProgress,
  MasteryRecord,
  PracticeSession,
} from "./types";
export const normalizeAnswer = (value: string) =>
  value.normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
export function composeBlock(onset: string, vowel: string): string {
  const l = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ".indexOf(onset),
    v = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ".indexOf(vowel);
  return l < 0 || v < 0 ? "" : String.fromCodePoint(0xac00 + l * 588 + v * 28);
}
export function blockParts(
  ko: string,
): { onset: string; vowel: string } | null {
  const n = ko.codePointAt(0)! - 0xac00;
  if (n < 0 || n > 11171 || n % 28) return null;
  return {
    onset: "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"[Math.floor(n / 588)],
    vowel: "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"[
      Math.floor((n % 588) / 28)
    ],
  };
}
export function answerText(e: Exercise, answer: Answer): string {
  if (typeof answer === "string") return answer;
  if (e.type === "build-syllable")
    return composeBlock(answer.onset ?? "", answer.vowel ?? "");
  return "";
}
export function isAnswerReady(e: Exercise, answer: Answer): boolean {
  return !!answerText(e, answer).trim();
}
export type Outcome = "correct" | "sound-correct" | "incorrect";
export function classifyAnswer(e: Exercise, answer: Answer): Outcome {
  const text = normalizeAnswer(answerText(e, answer));
  if (e.answers.some((a) => normalizeAnswer(a) === text)) return "correct";
  if (
    e.type === "type-sound" &&
    e.input === "romanization" &&
    e.soundAlternatives?.some((a) => normalizeAnswer(a) === text)
  )
    return "sound-correct";
  return "incorrect";
}
export function evaluateAnswer(e: Exercise, answer: Answer) {
  const outcome = classifyAnswer(e, answer),
    correct = outcome !== "incorrect";
  return {
    outcome,
    correct,
    results: e.itemIds.map((itemId) => ({ itemId, correct })),
  };
}
export function shuffled<T>(list: T[], seed: string): T[] {
  let state = 2166136261;
  for (const c of seed) state = Math.imul(state ^ c.charCodeAt(0), 16777619);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const j = (state >>> 0) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function topicName(name: string): string {
  const cp = name.normalize("NFC").at(-1)?.codePointAt(0) ?? 0;
  return `${name}${cp >= 0xac00 && cp <= 0xd7a3 && (cp - 0xac00) % 28 ? "은" : "는"}`;
}
export function personalText(
  template: string,
  profile: LearnerProfile,
): string {
  return template
    .replaceAll("{dog}", profile.dog.koreanName)
    .replaceAll("{brotherTopic}", topicName(profile.brother.koreanName));
}
export function resolveExercise(
  e: Exercise,
  profile: LearnerProfile,
): Exercise {
  if (!e.guided) return e;
  const text = e.profileTemplate
    ? personalText(e.profileTemplate, profile)
    : e.display!;
  const en = (s: string) =>
    s
      .replaceAll("Jaehun", profile.brother.name)
      .replaceAll("Miguel", profile.dog.name);
  return {
    ...e,
    display: text,
    audio: audio(text, "phrase"),
    answers: e.answers.map(en),
    options: e.options?.map((o) => ({
      value: en(o.value),
      label: en(o.label),
    })),
    hint: en(e.hint),
    feedback: {
      correct: `${text} — ${en(e.answers[0])}.`,
      incorrect: `${text} — ${en(e.answers[0])}.`,
    },
  };
}
export function newMastery(itemId: string): MasteryRecord {
  return {
    itemId,
    kind: itemById[itemId].kind,
    correctAttempts: 0,
    incorrectAttempts: 0,
    hintedAttempts: 0,
    recentPerformance: [],
    level: "new",
    lastPracticedAt: null,
    nextReviewAt: null,
    independentRecalls: 0,
    delayedRecalls: 0,
    lastRecallAt: null,
    recallExerciseIds: [],
  };
}
const HOUR = 3600000,
  DAY = 24 * HOUR;
export function updateMastery(
  previous: MasteryRecord | undefined,
  itemId: string,
  correct: boolean,
  hintUsed: boolean,
  independent: boolean,
  exerciseId: string,
  now: number,
  outcome: Outcome = correct ? "correct" : "incorrect",
  evidence: "recognition" | "listening" | "recall" = independent
    ? "recall"
    : "recognition",
): MasteryRecord {
  const state = previous ?? newMastery(itemId),
    at = new Date(now).toISOString();
  const recall = outcome === "correct" && correct && !hintUsed && independent;
  const delayed =
    recall &&
    state.lastRecallAt !== null &&
    state.lastPracticedAt !== null &&
    now - Date.parse(state.lastPracticedAt) >= DAY;
  const next = {
    ...state,
    soundCorrectAttempts:
      (state.soundCorrectAttempts ?? 0) + Number(outcome === "sound-correct"),
    evidencePoints:
      (state.evidencePoints ?? 0) +
      (correct
        ? hintUsed
          ? 0.25
          : outcome === "sound-correct"
            ? 0.65
            : independent
              ? 1
              : evidence === "listening"
                ? 0.5
                : 0.35
        : 0),
    correctAttempts: state.correctAttempts + Number(correct),
    incorrectAttempts: state.incorrectAttempts + Number(!correct),
    hintedAttempts: state.hintedAttempts + Number(hintUsed),
    recentPerformance: [
      ...state.recentPerformance,
      { correct, hintUsed, at, outcome },
    ].slice(-30),
    lastPracticedAt: at,
    independentRecalls: state.independentRecalls + Number(recall),
    delayedRecalls: state.delayedRecalls + Number(delayed),
    lastRecallAt: recall ? at : state.lastRecallAt,
    recallExerciseIds: recall
      ? [...new Set([...state.recallExerciseIds, exerciseId])]
      : state.recallExerciseIds,
  };
  const recent = next.recentPerformance.slice(-5);
  const mastered =
    (recall || state.level === "mastered") &&
    next.independentRecalls >= 3 &&
    next.delayedRecalls >= 2 &&
    next.recallExerciseIds.length >= 2 &&
    recent.every(
      (r) => r.correct && !r.hintUsed && r.outcome !== "sound-correct",
    );
  next.level = mastered
    ? "mastered"
    : next.independentRecalls >= 2 ||
        (next.evidencePoints >= 2 && next.correctAttempts >= 3)
      ? "practicing"
      : "learning";
  const delay = !correct
    ? 10 * 60000
    : hintUsed || !independent
      ? HOUR
      : outcome === "sound-correct"
        ? 12 * HOUR
        : next.delayedRecalls >= 2
          ? 7 * DAY
          : next.delayedRecalls >= 1
            ? 3 * DAY
            : DAY;
  next.nextReviewAt = new Date(now + delay).toISOString();
  return next;
}
export function learnedItemIds(progress: LearnerProgress): Set<string> {
  const set = new Set(
    lessons
      .filter((l) => progress.completedLessonIds.includes(l.id))
      .flatMap((l) => l.newItemIds),
  );
  Object.entries(progress.mastery).forEach(([id, m]) => {
    if (itemById[id] && m.correctAttempts + m.incorrectAttempts > 0)
      set.add(id);
  });
  return set;
}
export function reviewQueue(
  progress: LearnerProgress,
  now = Date.now(),
  dueOnly = false,
): { itemId: string; weakness: number; due: boolean }[] {
  const learned = learnedItemIds(progress);
  return items
    .filter((i) => learned.has(i.id))
    .map((i) => {
      const m = progress.mastery[i.id];
      const recent = m?.recentPerformance.slice(-5) ?? [];
      const mistakes = recent.filter((r) => !r.correct).length;
      const support = recent.filter(
        (r) => r.hintUsed || r.outcome === "sound-correct",
      ).length;
      return {
        itemId: i.id,
        due: !m?.nextReviewAt || Date.parse(m.nextReviewAt) <= now,
        weakness:
          mistakes * 10 + support * 2 + (m?.level === "mastered" ? 0 : 3),
      };
    })
    .filter((x) => !dueOnly || x.due)
    .sort(
      (a, b) =>
        b.weakness + Number(b.due) * 5 - (a.weakness + Number(a.due) * 5) ||
        (progress.mastery[a.itemId]?.lastPracticedAt ?? "").localeCompare(
          progress.mastery[b.itemId]?.lastPracticedAt ?? "",
        ),
    );
}
export function reviewExercises(progress: LearnerProgress): Exercise[] {
  const learned = learnedItemIds(progress);
  return lessons
    .filter((l) =>
      l.prerequisites.every((id) => progress.completedLessonIds.includes(id)),
    )
    .flatMap((l) => l.exercises)
    .filter(
      (e) =>
        e.itemIds.every((id) => learned.has(id)) &&
        (!e.requiresKeyboard ||
          (progress.keyboardIntroduced && !progress.keyboardDeferred)),
    );
}
export function makeSession(
  progress: LearnerProgress,
  lessonId: string | null,
  now = Date.now(),
): PracticeSession | null {
  const lesson = lessonId ? lessonById[lessonId] : null;
  if (
    lessonId &&
    (!lesson ||
      !lesson.prerequisites.every((id) =>
        progress.completedLessonIds.includes(id),
      ))
  )
    return null;
  let exerciseIds = lesson ? lesson.exercises.map((e) => e.id) : [];
  const queue = reviewQueue(progress, now);
  const rank = (id: string) =>
    queue.findIndex((q) => exerciseById[id].itemIds.includes(q.itemId));
  if (lesson?.weakReview)
    exerciseIds.sort(
      (a, b) => (rank(a) < 0 ? 999 : rank(a)) - (rank(b) < 0 ? 999 : rank(b)),
    );
  if (!lesson) {
    const candidates = reviewExercises(progress);
    const chosen = new Set<string>();
    for (const { itemId } of queue) {
      const matching = candidates.filter((e) => e.itemIds.includes(itemId));
      const recent = progress.history
        .filter((h) => h.itemIds.includes(itemId))
        .at(-1);
      const options = matching.filter((e) => e.id !== recent?.exerciseId);
      const ordered = options.length ? options : matching;
      const pick =
        ordered.find(
          (e) => e.type === "type-sound" || e.type === "listen-type",
        ) ?? ordered[0];
      if (pick) chosen.add(pick.id);
      if (chosen.size >= 8) break;
    }
    exerciseIds = [...chosen];
  }
  if (!exerciseIds.length) return null;
  return {
    id: `practice-${now}-${Math.random().toString(36).slice(2, 8)}`,
    kind: lesson ? "lesson" : "review",
    lessonId: lesson?.id ?? null,
    exerciseIds,
    index: 0,
    startedAt: new Date(now).toISOString(),
    answer: "",
    hintUsed: false,
    heardAudio: false,
    attempts: 0,
    resolved: false,
    lastCorrect: null,
    feedback: "",
    keyboardReady: false,
  };
}
export function submitAnswer(
  progress: LearnerProgress,
  answer: Answer,
  now = Date.now(),
): LearnerProgress {
  const session = progress.session;
  if (
    !session ||
    session.resolved ||
    session.index >= session.exerciseIds.length
  )
    return progress;
  const original = exerciseById[session.exerciseIds[session.index]],
    e = resolveExercise(original, progress.profile);
  if (
    !e ||
    !isAnswerReady(e, answer) ||
    (e.requiresKeyboard && !session.keyboardReady) ||
    (e.audio && !session.heardAudio && !session.hintUsed)
  )
    return progress;
  const result = evaluateAnswer(e, answer);
  const repeated =
    e.id.startsWith("retry-") ||
    session.exerciseIds.slice(0, session.index).includes(e.id);
  const independent =
    ["type-sound", "listen-type"].includes(e.type) && !repeated;
  const mastery = { ...progress.mastery };
  const results = [...result.results];
  if (e.type === "listen-type") {
    const parts = blockParts(e.answers[0]);
    if (parts)
      for (const letter of [parts.onset, parts.vowel]) {
        const id = soundId(letter);
        if (itemById[id] && !results.some((r) => r.itemId === id))
          results.push({ itemId: id, correct: result.correct });
      }
  }
  for (const r of results)
    mastery[r.itemId] = updateMastery(
      mastery[r.itemId],
      r.itemId,
      r.correct,
      session.hintUsed,
      independent && !e.guided,
      e.id,
      now,
      result.outcome,
      e.audio ? "listening" : independent ? "recall" : "recognition",
    );
  const exerciseIds = [...session.exerciseIds];
  const retryItemIds = [...(session.retryItemIds ?? [])];
  const target = e.itemIds[0];
  if (
    !result.correct &&
    !repeated &&
    !retryItemIds.includes(target) &&
    retryItemIds.length < 3
  ) {
    const id = "retry-" + e.id;
    if (exerciseById[id]) {
      exerciseIds.push(id);
      retryItemIds.push(target);
    }
  }
  return {
    ...progress,
    mastery,
    history: [
      ...progress.history,
      {
        exerciseId: e.id,
        itemIds: results.map((r) => r.itemId),
        outcome: result.outcome,
        correct: result.correct,
        hintUsed: session.hintUsed,
        mode:
          e.guided || repeated
            ? ("guided" as const)
            : independent
              ? ("recall" as const)
              : ("recognition" as const),
        at: new Date(now).toISOString(),
      },
    ].slice(-2000),
    session: {
      ...session,
      exerciseIds,
      retryItemIds,
      outcome: result.outcome,
      answer,
      hintUsed: session.hintUsed,
      resolved: true,
      lastCorrect: result.correct,
      attempts: session.attempts + 1,
      feedback:
        result.outcome === "sound-correct"
          ? "We write it " + e.answers[0] + "."
          : result.correct
            ? e.feedback.correct
            : e.feedback.incorrect,
    },
    updatedAt: new Date(now).toISOString(),
  };
}
export function continueSession(progress: LearnerProgress): LearnerProgress {
  const s = progress.session;
  if (!s?.resolved) return progress;
  if (s.index === s.exerciseIds.length - 1) {
    const completed = s.lessonId
      ? [...new Set([...progress.completedLessonIds, s.lessonId])]
      : progress.completedLessonIds;
    return { ...progress, completedLessonIds: completed, session: null };
  }
  return {
    ...progress,
    session: {
      ...s,
      index: s.index + 1,
      answer: "",
      outcome: undefined,
      hintUsed: false,
      heardAudio: false,
      attempts: 0,
      resolved: false,
      lastCorrect: null,
      feedback: "",
    },
  };
}
export function completionPercent(session: PracticeSession): number {
  return Math.round(
    ((session.index + Number(session.resolved)) / session.exerciseIds.length) *
      100,
  );
}

export function keyboardChoice(
  progress: LearnerProgress,
  choice: "ready" | "deferred",
): LearnerProgress {
  if (!progress.session) return progress;
  return {
    ...progress,
    keyboardDeferred: choice === "deferred",
    keyboardIntroduced: choice === "ready" || progress.keyboardIntroduced,
    session: {
      ...progress.session,
      keyboardDecision: choice,
      keyboardReady: choice === "ready",
    },
  };
}
export function skipTyping(progress: LearnerProgress): LearnerProgress {
  const s = progress.session;
  if (
    !s ||
    s.resolved ||
    s.keyboardDecision !== "deferred" ||
    !exerciseById[s.exerciseIds[s.index]].requiresKeyboard
  )
    return progress;
  return {
    ...progress,
    session: {
      ...s,
      resolved: true,
      outcome: "skipped",
      lastCorrect: null,
      feedback: "You can try Korean typing another time.",
      skippedExerciseIds: [
        ...(s.skippedExerciseIds ?? []),
        s.exerciseIds[s.index],
      ],
    },
  };
}
export const masteryLabel = (level: string) =>
  level === "mastered"
    ? "Remembered"
    : level === "practicing"
      ? "Practicing"
      : "Learning";
