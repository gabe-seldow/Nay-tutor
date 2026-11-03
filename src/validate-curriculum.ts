import { characters, items, lessons, units } from "./curriculum";
import type { Lesson } from "./types";
export function validateCurriculum(course: Lesson[] = lessons): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const introduced = new Set<string>();
  const exercises = new Set<string>();
  const catalog = new Map(items.map((x) => [x.id, x]));
  const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);
  if (units.length !== 8) errors.push("Expected eight units.");
  if (new Set(items.map((x) => x.id)).size !== items.length)
    errors.push("Duplicate item IDs.");
  if (
    characters.filter((x) => x.kind === "vowel").length !== 21 ||
    characters.filter((x) => x.kind === "consonant").length !== 19
  )
    errors.push("Expected 21 vowels and 19 consonants.");
  for (const unit of units) {
    if (!unit.lessonIds.length) fail(unit.id, "No lesson outline.");
    if (
      unit.lessonIds.some(
        (id) => !course.some((l) => l.id === id && l.unitId === unit.id),
      )
    )
      fail(unit.id, "Unit inventory mismatch.");
  }
  for (const lesson of course) {
    if (seen.has(lesson.id)) fail(lesson.id, "Duplicate ID.");
    if (lesson.prerequisites.some((id) => !seen.has(id)))
      fail(
        lesson.id,
        "Prerequisite must exist earlier (no cycles or forward edges).",
      );
    if (
      !units.some(
        (u) => u.id === lesson.unitId && u.lessonIds.includes(lesson.id),
      )
    )
      fail(lesson.id, "Unknown unit membership.");
    if (
      lesson.minutes < 3 ||
      lesson.minutes > 5 ||
      !lesson.title ||
      !lesson.objective ||
      !lesson.explanation ||
      !lesson.examples.length ||
      !lesson.exercises.length
    )
      fail(lesson.id, "Incomplete lesson plan.");
    if (!lesson.newItemIds.length) fail(lesson.id, "No new learning items.");
    lesson.newItemIds.forEach((id) => {
      if (!catalog.has(id)) fail(lesson.id, `Unknown item ${id}.`);
      if (introduced.has(id))
        fail(lesson.id, `New item already introduced: ${id}.`);
    });
    lesson.reviewItemIds.forEach((id) => {
      if (!introduced.has(id))
        fail(lesson.id, `Review item not taught earlier: ${id}.`);
    });
    lesson.newItemIds.forEach((id) => introduced.add(id));
    const availableLetters = new Set(
      [...introduced]
        .map((id) => catalog.get(id))
        .filter((x) => x?.kind === "vowel" || x?.kind === "consonant")
        .map((x) => x!.ko),
    );
    const checkLetters = (text: string) => {
      for (const ch of text.normalize("NFC")) {
        const cp = ch.codePointAt(0)!;
        if (cp >= 0xac00 && cp <= 0xd7a3) {
          const n = cp - 0xac00;
          const onset = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"[
            Math.floor(n / 588)
          ];
          const vowel = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"[
            Math.floor((n % 588) / 28)
          ];
          if (!availableLetters.has(onset) || !availableLetters.has(vowel))
            fail(lesson.id, `Untaught initial/vowel in ${ch}.`);
          if (n % 28 && Number(lesson.unitId.split("-")[1]) < 4)
            fail(lesson.id, `Final consonant before Unit 4 in ${ch}.`);
        }
      }
    };
    for (const e of lesson.exercises) {
      if (exercises.has(e.id)) fail(e.id, "Duplicate exercise ID.");
      exercises.add(e.id);
      if (
        e.requiredItemIds.some((id) => !introduced.has(id)) ||
        e.itemIds.some((id) => !introduced.has(id))
      )
        fail(e.id, "Untaught or unknown item dependency.");
      if (
        !e.prompt ||
        !e.objective ||
        !e.hint ||
        !e.feedback.correct ||
        !e.feedback.incorrect ||
        !e.answers.length ||
        e.answers.some((a) => !a.trim())
      )
        fail(e.id, "Incomplete exercise outline.");
      if (new Set(e.answers).size !== e.answers.length)
        fail(e.id, "Duplicate accepted answer.");
      if (e.type === "listen-type" && e.input !== "Hangul")
        fail(e.id, "Typing language must be explicit.");
      if (
        e.type === "listen-type" &&
        course.findIndex((l) => l.id === lesson.id) <
          course.findIndex((l) => l.id === "u2-l8")
      )
        fail(e.id, "Hangul typing before keyboard orientation.");
      if (
        ["listen-type", "listen-select", "sound-to-character"].includes(
          e.type,
        ) &&
        !e.audio
      )
        fail(e.id, "Listening outline has no audio.");
      if (e.audio && e.prompt.includes(e.audio.text))
        fail(e.id, "Listening prompt reveals its transcript.");
      if (e.audio) checkLetters(e.audio.text);
      if (e.input === "Hangul" || e.type === "build-syllable")
        e.answers.forEach(checkLetters);
    }
    for (const example of lesson.examples) {
      if (
        !example.ko ||
        !example.meaning ||
        !example.note ||
        example.audio.language !== "ko-KR"
      )
        fail(lesson.id, "Incomplete example.");
      checkLetters(example.ko);
    }
    seen.add(lesson.id);
  }
  if (characters.some((ch) => !introduced.has(ch.id)))
    errors.push("Some Hangul characters have no introduction lesson.");
  return errors;
}
