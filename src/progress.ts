import { itemById, lessonById, lessons } from "./curriculum";
import type {
  LearnerProfile,
  LearnerProgress,
  MasteryRecord,
  Page,
  ProgressRepository,
} from "./types";

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
    version: 1,
    curriculumVersion: 1,
    profile: structuredClone(defaultProfile),
    completedLessonIds: [],
    mastery: {},
    preferences: { romanization: "early-support" },
    navigation: { page: "learn", previewLessonId: null },
    updatedAt: new Date().toISOString(),
  };
}
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const date = (x: unknown) =>
  typeof x === "string" && Number.isFinite(Date.parse(x));
const count = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0;
function profileValid(x: unknown): x is LearnerProfile {
  return (
    record(x) &&
    typeof x.spellingsConfirmed === "boolean" &&
    ["learner", "brother", "dog"].every((k) => {
      const p = x[k];
      return (
        record(p) &&
        ["name", "koreanName"].every(
          (field) =>
            typeof p[field] === "string" &&
            (p[field] as string).trim().length > 0 &&
            (p[field] as string).length <= 60,
        )
      );
    })
  );
}
function masteryValid(id: string, x: unknown): x is MasteryRecord {
  return (
    !!itemById[id] &&
    record(x) &&
    x.itemId === id &&
    x.kind === itemById[id].kind &&
    ["new", "learning", "practicing", "mastered"].includes(String(x.level)) &&
    [x.correctAttempts, x.incorrectAttempts, x.hintedAttempts].every(count) &&
    (x.lastPracticedAt === null || date(x.lastPracticedAt)) &&
    (x.nextReviewAt === null || date(x.nextReviewAt)) &&
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
export function isProgress(x: unknown): x is LearnerProgress {
  return (
    record(x) &&
    x.version === 1 &&
    x.curriculumVersion === 1 &&
    profileValid(x.profile) &&
    Array.isArray(x.completedLessonIds) &&
    x.completedLessonIds.every(
      (id) => typeof id === "string" && !!lessonById[id],
    ) &&
    new Set(x.completedLessonIds).size === x.completedLessonIds.length &&
    record(x.mastery) &&
    Object.entries(x.mastery).every(([id, m]) => masteryValid(id, m)) &&
    record(x.preferences) &&
    ["on-demand", "early-support"].includes(
      String(x.preferences.romanization),
    ) &&
    record(x.navigation) &&
    pages.includes(x.navigation.page as Page) &&
    (x.navigation.previewLessonId === null ||
      (typeof x.navigation.previewLessonId === "string" &&
        !!lessonById[x.navigation.previewLessonId])) &&
    date(x.updatedAt)
  );
}
export function localProgressRepository(
  storage: () => Pick<Storage, "getItem" | "setItem">,
): ProgressRepository {
  return {
    load() {
      try {
        const raw = storage().getItem(STORAGE_KEY);
        if (raw === null) return { progress: freshProgress(), warning: null };
        const value: unknown = JSON.parse(raw);
        if (!isProgress(value)) throw Error("Unsupported save");
        return { progress: value, warning: null };
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
  const records = Object.values(progress.mastery).filter(
    (m) => m.kind === "vowel" || m.kind === "consonant",
  );
  return {
    practiced: records.filter(
      (m) => m.correctAttempts + m.incorrectAttempts > 0,
    ).length,
    mastered: records.filter((m) => m.level === "mastered").length,
    total: 40,
  };
}
