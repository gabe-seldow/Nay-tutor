import { characters, itemById, items, lessons } from "./curriculum";
import { blockParts, composeBlock, evaluateAnswer } from "./learning";
import type { Lesson } from "./types";
export function validateCurriculum(course: Lesson[] = lessons): string[] {
  const errors: string[] = [],
    seen = new Set<string>(),
    known = new Set<string>(),
    exerciseIds = new Set<string>();
  const fail = (id: string, msg: string) => errors.push(`${id}: ${msg}`);
  if (course.length !== 14)
    errors.push("Unit 1 must have 14 playable lessons.");
  if (new Set(items.map((i) => i.id)).size !== items.length)
    errors.push("Duplicate item IDs.");
  if (characters.length !== 13)
    errors.push("Unit 1 must teach six vowels and seven consonants.");
  for (const l of course) {
    if (seen.has(l.id) || l.unitId !== "unit-1" || l.status !== "available")
      fail(l.id, "Invalid playable lesson identity.");
    if (l.prerequisites.some((id) => !seen.has(id)))
      fail(l.id, "Prerequisite must exist earlier.");
    if (
      !l.title ||
      !l.objective ||
      !l.explanation ||
      !l.examples.length ||
      l.exercises.length < 9 ||
      l.exercises.length > 12 ||
      l.minutes !== 4
    )
      fail(l.id, "Incomplete short lesson.");
    l.reviewItemIds.forEach((id) => {
      if (!known.has(id)) fail(l.id, `Untaught review dependency ${id}.`);
    });
    l.newItemIds.forEach((id) => {
      if (!itemById[id] || known.has(id)) fail(l.id, `Invalid new item ${id}.`);
      known.add(id);
    });
    const letters = new Set(
      [...known]
        .map((id) => itemById[id])
        .filter((i) => i?.kind === "vowel" || i?.kind === "consonant")
        .map((i) => i.ko),
    );
    const check = (text: string, carrier = false) => {
      for (const ch of text) {
        if (/[ㄱ-ㅣ]/u.test(ch) && !letters.has(ch))
          fail(l.id, `Untaught letter ${ch}.`);
        if (ch >= "가" && ch <= "힣") {
          const parts = blockParts(ch);
          if (!parts)
            fail(
              l.id,
              `Unsupported final consonant in independent reading: ${ch}.`,
            );
          else if (
            (!letters.has(parts.onset) && !(carrier && parts.onset === "ㅇ")) ||
            !letters.has(parts.vowel)
          )
            fail(l.id, `Untaught block ${ch}.`);
        }
      }
    };
    for (const id of l.newItemIds.filter((id) =>
      ["vowel", "consonant"].includes(itemById[id].kind),
    )) {
      if (
        !l.exercises.some(
          (e) => e.type === "type-sound" && e.itemIds.includes(id),
        )
      )
        fail(l.id, "New letter has no recall task.");
    }
    for (const e of l.exercises) {
      if (exerciseIds.has(e.id)) fail(e.id, "Duplicate exercise ID.");
      exerciseIds.add(e.id);
      if (
        !e.objective ||
        !e.prompt ||
        !e.hint ||
        !e.feedback.correct ||
        !e.feedback.incorrect ||
        !e.answers.length ||
        e.answers.some((a) => !a)
      )
        fail(e.id, "Incomplete exercise.");
      if (e.itemIds.some((id) => !known.has(id)))
        fail(e.id, "Untaught item dependency.");
      const target = itemById[e.itemIds[0]];
      if (!target) {
        fail(e.id, "Unknown target.");
        continue;
      }
      if (target.kind === "phrase" && (!e.guided || e.type !== "guided-phrase"))
        fail(e.id, "Unfamiliar phrase must be guided.");
      if (!e.guided) {
        if (e.display) check(e.display);
        if (e.audio) check(e.audio.text, target.kind === "vowel");
      }
      if (e.audio && (e.audio.language !== "ko-KR" || !e.audio.text))
        fail(e.id, "Invalid Korean audio.");
      if (
        ["sound-to-character", "listen-type", "guided-phrase"].includes(
          e.type,
        ) &&
        !e.audio
      )
        fail(e.id, "Missing required audio.");
      if (
        e.type === "sound-to-character" &&
        (e.display || e.prompt.includes(e.audio!.text))
      )
        fail(e.id, "Audio transcript revealed.");
      if (e.audio && !e.guided && e.audio.text !== target.audio.text)
        fail(e.id, "Audio does not match its target.");
      if (e.type === "sound-to-character" && e.answers[0] !== target.ko)
        fail(e.id, "Sound-to-character answer mismatch.");
      if (
        e.type === "type-sound" &&
        (e.input !== "romanization" || e.answers[0] !== target.rr)
      )
        fail(e.id, "Incorrect sound-label typing.");
      if (e.type === "syllable-reading" && e.answers[0] !== target.rr)
        fail(e.id, "Syllable sound guide mismatch.");
      if (
        e.type === "listen-type" &&
        (l.day < 11 || !e.requiresKeyboard || e.input !== "Hangul")
      )
        fail(e.id, "Hangul typing requires keyboard introduction.");
      if (e.options) {
        if (
          e.options.length < 2 ||
          e.options.length > 4 ||
          new Set(e.options.map((o) => o.value)).size !== e.options.length
        )
          fail(e.id, "Invalid choices.");
        if (e.options.filter((o) => e.answers.includes(o.value)).length !== 1)
          fail(e.id, "Exactly one choice must be correct.");
        if (e.type === "sound-to-character")
          e.options.forEach((o) => check(o.label, target.kind === "vowel"));
      }
      if (e.type === "build-syllable") {
        const parts = blockParts(e.answers[0]);
        if (
          !parts ||
          !e.onsets?.includes(parts.onset) ||
          !e.vowels?.includes(parts.vowel) ||
          composeBlock(parts.onset, parts.vowel) !== e.answers[0]
        )
          fail(e.id, "Unbuildable answer.");
        [...(e.onsets ?? []), ...(e.vowels ?? [])].forEach((ch) => check(ch));
      }
      if (e.type === "listen-type") e.answers.forEach((a) => check(a));
      const sample = e.answers[0];
      if (!evaluateAnswer(e, sample).correct)
        fail(e.id, "Authored correct answer fails validation.");
    }
    seen.add(l.id);
  }
  if (items.some((i) => !known.has(i.id)))
    errors.push("Catalog contains unintroduced material.");
  return errors;
}
