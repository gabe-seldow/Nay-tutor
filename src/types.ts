export type ItemKind =
  | "vowel"
  | "consonant"
  | "syllable"
  | "vocabulary"
  | "phrase";
export type AudioContent = {
  text: string;
  language: "ko-KR";
  mode: "vowel-syllable" | "context-syllable" | "word" | "phrase";
  note?: string;
};
type BaseItem = {
  id: string;
  ko: string;
  meaning: string;
  audio: AudioContent;
};
export type HangulCharacter = BaseItem & { kind: "vowel" | "consonant" };
export type Vocabulary = BaseItem & { kind: "vocabulary" };
export type Phrase = BaseItem & {
  kind: "phrase";
  speechLevel: "haeyoche" | "formal-polite" | "casual";
};
export type LearningItem =
  | HangulCharacter
  | Vocabulary
  | Phrase
  | (BaseItem & { kind: "syllable" });
export type ExerciseType =
  | "character-recognition"
  | "sound-to-character"
  | "character-matching"
  | "syllable-reading"
  | "build-syllable"
  | "listen-select"
  | "listen-type"
  | "translate"
  | "complete-phrase"
  | "weak-sound";
export type Exercise = {
  id: string;
  type: ExerciseType;
  objective: string;
  prompt: string;
  itemIds: string[];
  requiredItemIds: string[];
  answers: string[];
  hint: string;
  feedback: { correct: string; incorrect: string };
  input?: "Hangul" | "English" | "romanization";
  audio?: AudioContent;
  status: "planned";
};
export type TeachingExample = {
  ko: string;
  meaning: string;
  note: string;
  audio: AudioContent;
};
export type Lesson = {
  id: string;
  unitId: string;
  title: string;
  objective: string;
  prerequisites: string[];
  newItemIds: string[];
  reviewItemIds: string[];
  explanation: string;
  examples: TeachingExample[];
  exercises: Exercise[];
  minutes: 3 | 4 | 5;
  status: "planned";
  implementationPhase: 2 | 4;
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
export type ReviewSchedule = {
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
};
export type MasteryRecord = ReviewSchedule & {
  itemId: string;
  kind: ItemKind;
  correctAttempts: number;
  incorrectAttempts: number;
  hintedAttempts: number;
  recentPerformance: { correct: boolean; hintUsed: boolean; at: string }[];
  level: MasteryLevel;
};
export type Person = { name: string; koreanName: string };
export type LearnerProfile = {
  learner: Person;
  brother: Person;
  dog: Person;
  spellingsConfirmed: boolean;
};
export type Page = "learn" | "hangul" | "review" | "settings";
export type LearnerProgress = {
  version: 1;
  curriculumVersion: 1;
  profile: LearnerProfile;
  completedLessonIds: string[];
  mastery: Record<string, MasteryRecord>;
  preferences: { romanization: "on-demand" | "early-support" };
  navigation: { page: Page; previewLessonId: string | null };
  updatedAt: string;
};
export interface ProgressRepository {
  load(): { progress: LearnerProgress; warning: string | null };
  save(progress: LearnerProgress): boolean;
}
