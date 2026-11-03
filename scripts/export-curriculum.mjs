import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { units, lessons, lessonById, itemById } =
    await server.ssrLoadModule("/src/curriculum.ts");
  const { validateCurriculum } = await server.ssrLoadModule(
    "/src/validate-curriculum.ts",
  );
  const errors = validateCurriculum();
  if (errors.length) throw Error(errors.join("\n"));
  const lines = [
    "# Nay Tutor — complete beginner curriculum plan",
    "",
    "Generated from `src/curriculum.ts` by `pnpm curriculum:plan`. Edit source data, then regenerate. All records are **planned**, not playable lessons. This is the full eight-unit outline with representative practice specifications; interactive lesson authoring is Phase 2/4. Estimated durations require learner testing.",
    "",
    "Progression: short supported explanation → sight/sound recognition → guided practice → earlier material revisited. Consonant audio uses full syllables. Similar modern vowel sounds require written context. Optional casual speech follows the polite foundation. No XP, hearts, streaks or leaderboards.",
    "",
    "Family defaults (unconfirmed and configurable): Jaeyeon/재연, Jaehun/재훈, Miguel/미겔. Fixed examples retain their disclosed course spelling; profile-aware exercises come later.",
    "",
  ];
  for (const unit of units) {
    lines.push(`## Unit ${unit.number} — ${unit.title}`, "", unit.outcome, "");
    for (const lesson of lessons.filter((l) => l.unitId === unit.id)) {
      lines.push(
        `### ${lesson.id} — ${lesson.title}`,
        "",
        `- **Objective:** ${lesson.objective}`,
        `- **Prerequisites:** ${lesson.prerequisites.map((id) => `${id}: ${lessonById[id].title}`).join("; ") || "None; no prior Korean."}`,
        `- **Time target:** ${lesson.minutes} minutes (3–5 minute design range).`,
        `- **Implementation:** Phase ${lesson.implementationPhase}; planned.`,
        `- **New material:** ${lesson.newItemIds.map((id) => `${itemById[id].ko} — ${itemById[id].meaning} [${id}]`).join("; ")}`,
        `- **Review material:** ${lesson.reviewItemIds.map((id) => `${itemById[id].ko} [${id}]`).join("; ") || "First lesson; revisit in subsequent lessons."}`,
        "",
        lesson.explanation,
        "",
      );
      for (const example of lesson.examples)
        lines.push(
          `**Teaching example:** ${example.ko} — ${example.meaning}`,
          "",
          example.note,
          "",
        );
      lines.push("**Representative exercise sequence**", "");
      lesson.exercises.forEach((e, i) => {
        lines.push(
          `${i + 1}. **${e.type}** — ${e.objective}`,
          `   - Prompt: ${e.prompt}`,
          `   - Accepted answer: ${e.answers.join(" / ")}`,
          `   - Hint: ${e.hint}`,
          `   - Correct feedback: ${e.feedback.correct}`,
          `   - Incorrect feedback: ${e.feedback.incorrect}`,
          `   - Required item IDs: ${e.requiredItemIds.join(", ")}`,
          ...(e.audio
            ? [
                `   - Audio (authoring-only transcript): ${e.audio.text}; ${e.audio.mode}.`,
              ]
            : []),
          ...(e.input ? [`   - Input language: ${e.input}.`] : []),
          "",
        );
      });
    }
  }
  lines.push(
    "## Phase 2 authoring constraints",
    "",
    "These outlines have explicit sample answers, hints and feedback. Complete playable sequences must still add distractors, matching sets, syllable composition controls, keyboard orientation, repeat practice for every new sound, and supported-to-independent transitions. Do not render authoring answers or audio transcripts in assessment prompts. No test should infer a unique ㅐ/ㅔ or ㅙ/ㅚ/ㅞ spelling from merged audio alone. Curriculum validation is structural; native-speaker review and learner timing remain open.",
    "",
  );
  await mkdir("docs", { recursive: true });
  await writeFile("docs/CURRICULUM.md", lines.join("\n"), "utf8");
  console.log(
    `Wrote complete ${lessons.length}-lesson outline to docs/CURRICULUM.md.`,
  );
} finally {
  await server.close();
}
