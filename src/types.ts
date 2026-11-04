export type ItemKind = "vowel" | "consonant" | "syllable" | "phrase";
export type AudioContent = {
  text: string;
  language: "ko-KR";
  mode: "vowel-syllable" | "context-syllable" | "word" | "phrase";
  note?: string;
};
export type LearningItem = {
  soundAlternatives?: string[];
  id: string;
  kind: ItemKind;
  ko: string;
  meaning: string;
  rr?: string;
  audio: AudioContent;
  speechLevel?: "polite" | "casual";
  guided?: boolean;
  profileTemplate?: string;
};
export type ExerciseType =
  | "character-recognition"
  | "sound-to-character"
  | "syllable-reading"
  | "build-syllable"
  | "type-sound"
  | "listen-type"
  | "guided-phrase";
export type Option = { value: string; label: string };
export type Exercise = {
  soundAlternatives?: string[];
  id: string;
  type: ExerciseType;
  objective: string;
  prompt: string;
  display?: string;
  itemIds: string[];
  answers: string[];
  options?: Option[];
  onsets?: string[];
  vowels?: string[];
  hint: string;
  feedback: { correct: string; incorrect: string };
  input?: "Hangul" | "romanization";
  audio?: AudioContent;
  guided?: boolean;
  requiresKeyboard?: boolean;
  profileTemplate?: string;
};
export type TeachingExample = {
  ko: string;
  meaning: string;
  note: string;
  audio: AudioContent;
  profileTemplate?: string;
};
export type Lesson = {
  id: string;
  unitId: string;
  day: number;
  title: string;
  objective: string;
  prerequisites: string[];
  newItemIds: string[];
  reviewItemIds: string[];
  explanation: string;
  examples: TeachingExample[];
  exercises: Exercise[];
  minutes: 4;
  status: "available";
  keyboardIntro?: boolean;
  weakReview?: boolean;
};
export type Unit = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  outcome: string;
  lessonIds: string[];
};
export type MasteryLevel = "new" | "learning" | "practicing" | "mastered";
export type MasteryRecord = {
  soundCorrectAttempts?: number;
  evidencePoints?: number;
  itemId: string;
  kind: ItemKind;
  correctAttempts: number;
  incorrectAttempts: number;
  hintedAttempts: number;
  recentPerformance: {
    correct: boolean;
    hintUsed: boolean;
    at: string;
    outcome?: "correct" | "sound-correct" | "incorrect";
  }[];
  level: MasteryLevel;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  independentRecalls: number;
  delayedRecalls: number;
  lastRecallAt: string | null;
  recallExerciseIds: string[];
};
export type Person = { name: string; koreanName: string };
export type LearnerProfile = {
  learner: Person;
  brother: Person;
  dog: Person;
  spellingsConfirmed: boolean;
};
export type Page = "learn" | "hangul" | "review" | "settings";
export type Answer = string | Record<string, string>;
export type Attempt = {
  outcome?: "correct" | "sound-correct" | "incorrect";
  exerciseId: string;
  itemIds: string[];
  correct: boolean;
  hintUsed: boolean;
  mode: "recognition" | "recall" | "guided";
  at: string;
};
export type PracticeSession = {
  outcome?: "correct" | "sound-correct" | "incorrect" | "skipped";
  keyboardDecision?: "ready" | "deferred";
  retryItemIds?: string[];
  skippedExerciseIds?: string[];
  legacyMatchingAnswer?: Record<string, string>;
  id: string;
  kind: "lesson" | "review";
  lessonId: string | null;
  exerciseIds: string[];
  index: number;
  startedAt: string;
  answer: Answer;
  hintUsed: boolean;
  heardAudio: boolean;
  attempts: number;
  resolved: boolean;
  lastCorrect: boolean | null;
  feedback: string;
  keyboardReady: boolean;
};
export type LearnerProgress = {
  keyboardDeferred?: boolean;
  version: 2;
  curriculumVersion: 2;
  profile: LearnerProfile;
  completedLessonIds: string[];
  mastery: Record<string, MasteryRecord>;
  history: Attempt[];
  preferences: { romanization: "on-demand" | "early-support" };
  navigation: { page: Page; previewLessonId: string | null };
  session: PracticeSession | null;
  keyboardIntroduced: boolean;
  updatedAt: string;
  legacyPlan?: {
    completedLessonIds: string[];
    mastery: Record<string, unknown>;
    previewLessonId: string | null;
  };
};
export interface ProgressRepository {
  load(): { progress: LearnerProgress; warning: string | null };
  save(progress: LearnerProgress): boolean;
}
