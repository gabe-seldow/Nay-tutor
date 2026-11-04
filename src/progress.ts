import {
  characters,
  exerciseById,
  itemById,
  lessonById,
  lessons,
  legacySoundLabels,
} from "./curriculum";
import type {
  LearnerProfile,
  LearnerProgress,
  MasteryRecord,
  Page,
  ProgressRepository,
} from "./types";
import { validStreak } from "./streak";
export const STORAGE_KEY = "nay-tutor.progress.v1";
export const defaultProfile: LearnerProfile = {
  learner: { name: "Jaeyeon", koreanName: "재연" },
  brother: { name: "Jaehun", koreanName: "재훈" },
  dog: { name: "Miguel", koreanName: "미겔" },
  spellingsConfirmed: false,
};
export const pages: Page[] = ["learn", "hangul", "review", "settings"];
export function freshProgress(): LearnerProgress {
  return {
    version: 2,
    curriculumVersion: 2,
    profile: structuredClone(defaultProfile),
    completedLessonIds: [],
    mastery: {},
    history: [],
    preferences: { romanization: "early-support" },
    navigation: { page: "learn", previewLessonId: null },
    session: null,
    keyboardIntroduced: false,
    updatedAt: new Date().toISOString(),
  };
}
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const date = (x: unknown) =>
  typeof x === "string" && Number.isFinite(Date.parse(x));
const count = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
const strings = (x: unknown): x is string[] =>
  Array.isArray(x) && x.every((v) => typeof v === "string" && v.length > 0);
function profileValid(x: unknown): x is LearnerProfile {
  return (
    record(x) &&
    typeof x.spellingsConfirmed === "boolean" &&
    ["learner", "brother", "dog"].every((k) => {
      const p = x[k];
      return (
        record(p) &&
        ["name", "koreanName"].every(
          (f) =>
            typeof p[f] === "string" &&
            (p[f] as string).trim().length > 0 &&
            (p[f] as string).length <= 60,
        )
      );
    })
  );
}
function masteryValid(id: string, x: unknown): x is MasteryRecord {
  return (
    record(x) &&
    (x.soundCorrectAttempts === undefined || count(x.soundCorrectAttempts)) &&
    (x.evidencePoints === undefined ||
      (typeof x.evidencePoints === "number" &&
        Number.isFinite(x.evidencePoints) &&
        x.evidencePoints >= 0)) &&
    x.itemId === id &&
    ["vowel", "consonant", "syllable", "phrase"].includes(String(x.kind)) &&
    (!itemById[id] || itemById[id].kind === x.kind) &&
    ["new", "learning", "practicing", "mastered"].includes(String(x.level)) &&
    [
      x.correctAttempts,
      x.incorrectAttempts,
      x.hintedAttempts,
      x.independentRecalls,
      x.delayedRecalls,
    ].every(count) &&
    (x.lastPracticedAt === null || date(x.lastPracticedAt)) &&
    (x.nextReviewAt === null || date(x.nextReviewAt)) &&
    (x.lastRecallAt === null || date(x.lastRecallAt)) &&
    strings(x.recallExerciseIds) &&
    Array.isArray(x.recentPerformance) &&
    x.recentPerformance.length <= 30 &&
    x.recentPerformance.every(
      (v) =>
        record(v) &&
        typeof v.correct === "boolean" &&
        typeof v.hintUsed === "boolean" &&
        date(v.at),
    )
  );
}
function sessionValid(x: unknown): boolean {
  if (x === null) return true;
  return (
    record(x) &&
    typeof x.id === "string" &&
    ["lesson", "review"].includes(String(x.kind)) &&
    (x.kind === "lesson"
      ? typeof x.lessonId === "string" && !!lessonById[x.lessonId]
      : x.lessonId === null) &&
    strings(x.exerciseIds) &&
    x.exerciseIds.length > 0 &&
    x.exerciseIds.length <= 100 &&
    x.exerciseIds.every((id) => !!exerciseById[id]) &&
    count(x.index) &&
    (x.index as number) < x.exerciseIds.length &&
    date(x.startedAt) &&
    (typeof x.answer === "string" ||
      (record(x.answer) &&
        Object.values(x.answer).every((v) => typeof v === "string"))) &&
    ["hintUsed", "heardAudio", "resolved", "keyboardReady"].every(
      (k) => typeof x[k] === "boolean",
    ) &&
    count(x.attempts) &&
    (x.lastCorrect === null || typeof x.lastCorrect === "boolean") &&
    typeof x.feedback === "string" &&
    (x.outcome === undefined ||
      ["correct", "sound-correct", "incorrect", "skipped"].includes(
        String(x.outcome),
      )) &&
    (x.keyboardDecision === undefined ||
      ["ready", "deferred"].includes(String(x.keyboardDecision))) &&
    (x.retryItemIds === undefined ||
      (strings(x.retryItemIds) && x.retryItemIds.length <= 3)) &&
    (x.skippedExerciseIds === undefined || strings(x.skippedExerciseIds))
  );
}
export function isProgress(x: unknown): x is LearnerProgress {
  return (
    record(x) &&
    x.version === 2 &&
    x.curriculumVersion === 2 &&
    (x.streak === undefined || validStreak(x.streak)) &&
    profileValid(x.profile) &&
    strings(x.completedLessonIds) &&
    new Set(x.completedLessonIds).size === x.completedLessonIds.length &&
    record(x.mastery) &&
    Object.entries(x.mastery).every(([id, m]) => masteryValid(id, m)) &&
    Array.isArray(x.history) &&
    x.history.length <= 2000 &&
    x.history.every(
      (h) =>
        record(h) &&
        typeof h.exerciseId === "string" &&
        strings(h.itemIds) &&
        typeof h.correct === "boolean" &&
        typeof h.hintUsed === "boolean" &&
        ["recognition", "recall", "guided"].includes(String(h.mode)) &&
        date(h.at),
    ) &&
    record(x.preferences) &&
    ["on-demand", "early-support"].includes(
      String(x.preferences.romanization),
    ) &&
    record(x.navigation) &&
    pages.includes(x.navigation.page as Page) &&
    (x.navigation.previewLessonId === null ||
      typeof x.navigation.previewLessonId === "string") &&
    typeof x.keyboardIntroduced === "boolean" &&
    (x.keyboardDeferred === undefined ||
      typeof x.keyboardDeferred === "boolean") &&
    sessionValid(x.session) &&
    date(x.updatedAt) &&
    (x.legacyPlan === undefined ||
      (record(x.legacyPlan) &&
        strings(x.legacyPlan.completedLessonIds) &&
        record(x.legacyPlan.mastery) &&
        (x.legacyPlan.previewLessonId === null ||
          typeof x.legacyPlan.previewLessonId === "string")))
  );
}
export function migratePhaseOne(value: unknown): LearnerProgress | null {
  if (
    !record(value) ||
    value.version !== 1 ||
    value.curriculumVersion !== 1 ||
    !profileValid(value.profile) ||
    !strings(value.completedLessonIds) ||
    !record(value.mastery) ||
    !record(value.preferences) ||
    !["on-demand", "early-support"].includes(
      String(value.preferences.romanization),
    )
  )
    return null;
  const progress = freshProgress();
  progress.profile = value.profile;
  progress.preferences.romanization = value.preferences
    .romanization as LearnerProgress["preferences"]["romanization"];
  progress.legacyPlan = {
    completedLessonIds: value.completedLessonIds,
    mastery: value.mastery,
    previewLessonId:
      record(value.navigation) &&
      typeof value.navigation.previewLessonId === "string"
        ? value.navigation.previewLessonId
        : null,
  };
  if (record(value.navigation) && pages.includes(value.navigation.page as Page))
    progress.navigation.page = value.navigation.page as Page;
  return progress;
}
export function localProgressRepository(
  storage: () => Pick<Storage, "getItem" | "setItem">,
): ProgressRepository {
  return {
    load() {
      try {
        const raw = storage().getItem(STORAGE_KEY);
        if (raw === null) return { progress: freshProgress(), warning: null };
        const parsed: unknown = JSON.parse(raw);
        // Preserve an unfinished choice when labels/grids change in Checkpoint A.
        if (record(parsed) && parsed.version === 2 && record(parsed.session)) {
          const s = parsed.session,
            e =
              typeof s.index === "number" && Array.isArray(s.exerciseIds)
                ? exerciseById[s.exerciseIds[s.index]]
                : undefined;
          if (e && typeof s.answer === "string")
            s.answer = legacySoundLabels[s.answer] ?? s.answer;
          if (e && record(s.answer) && e.type !== "build-syllable") {
            s.legacyMatchingAnswer = { ...s.answer };
            const selected = s.answer[e.itemIds[0]];
            s.answer =
              typeof selected === "string"
                ? (itemById[selected]?.rr ?? "")
                : "";
          }
        }
        const migrated = migratePhaseOne(parsed);
        if (migrated) return { progress: migrated, warning: null };
        if (!isProgress(parsed)) throw Error("Unsupported save");
        const progress = {
          ...parsed,
          navigation: {
            ...parsed.navigation,
            previewLessonId:
              parsed.navigation.previewLessonId &&
              lessonById[parsed.navigation.previewLessonId]
                ? parsed.navigation.previewLessonId
                : null,
          },
        };
        return { progress, warning: null };
      } catch {
        return {
          progress: freshProgress(),
          warning:
            "Saved progress could not be read. A fresh session is open. Your previous save is kept until you make a change.",
        };
      }
    },
    save(progress) {
      try {
        if (!isProgress(progress)) return false;
        storage().setItem(STORAGE_KEY, JSON.stringify(progress));
        return true;
      } catch {
        return false;
      }
    },
  };
}
export const isUnlocked = (id: string, progress: LearnerProgress) =>
  !!lessonById[id] &&
  lessonById[id].prerequisites.every((p) =>
    progress.completedLessonIds.includes(p),
  );
export const nextLesson = (progress: LearnerProgress) =>
  lessons.find(
    (l) =>
      !progress.completedLessonIds.includes(l.id) && isUnlocked(l.id, progress),
  );
export function hangulProgress(progress: LearnerProgress) {
  const records = characters
    .map((i) => progress.mastery[i.id])
    .filter((x): x is MasteryRecord => !!x);
  return {
    practiced: records.filter(
      (m) => m.correctAttempts + m.incorrectAttempts > 0,
    ).length,
    mastered: records.filter((m) => m.level === "mastered").length,
    total: characters.length,
  };
}
