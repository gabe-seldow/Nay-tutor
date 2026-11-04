import { createServer } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { lessons, itemById, retiredItemIds } =
    await server.ssrLoadModule("/src/curriculum.ts");
  const { validateCurriculum } = await server.ssrLoadModule(
    "/src/validate-curriculum.ts",
  );
  const errors = validateCurriculum();
  if (errors.length) throw Error(errors.join("\n"));
  const lines = [
    "# Unit 1 — complete authoring inventory",
    "",
    "Generated from the playable curriculum using `pnpm curriculum:plan`. The former eight-unit outline remains in `docs/CURRICULUM.md` as historical planning documentation; it is not loaded into the app.",
    "",
    "Fourteen lessons, estimated 3–5 minutes each. Romanization belongs in teaching/support and explicit sound-label typing. Audio uses full syllables. Guided expressions disclose unfamiliar letters and register.",
    "",
  ];
  for (const l of lessons) {
    lines.push(
      `## ${l.day}. ${l.title} [${l.id}]`,
      "",
      `**Objective:** ${l.objective}`,
      `**Prerequisites:** ${l.prerequisites.join(", ") || "None"}`,
      `**New:** ${
        l.newItemIds
          .filter((id) => !retiredItemIds.has(id))
          .map((id) => `${itemById[id].ko} [${id}]`)
          .join("; ") || "Cumulative practice; no new items."
      }`,
      `**Review:** ${l.reviewItemIds.map((id) => itemById[id].ko).join(" · ") || "First lesson."}`,
      "",
      l.explanation,
      "",
    );
    for (const x of l.examples)
      lines.push(`**Example:** ${x.ko} — ${x.meaning}`, x.note, "");
    lines.push("### Exercise sequence", "");
    for (const e of l.exercises) {
      lines.push(
        `- **${e.id} — ${e.type}:** ${e.prompt}`,
        `  - Objective: ${e.objective}`,
        `  - Accepted answer: ${e.answers.join(" / ")}`,
        ...(e.soundAlternatives?.length
          ? [
              `  - Approved sound approximations: ${e.soundAlternatives.join(", ")}`,
            ]
          : []),
        `  - Requested hint: ${e.hint}`,
        `  - Correct: ${e.feedback.correct}`,
        `  - Incorrect: ${e.feedback.incorrect}`,
        `  - Items: ${e.itemIds.join(", ")}`,
        ...(e.audio
          ? [`  - Authoring-only audio script: ${e.audio.text}`]
          : []),
        ...(e.input ? [`  - Input language: ${e.input}`] : []),
        "",
      );
    }
  }
  await mkdir("docs", { recursive: true });
  await writeFile("docs/UNIT-1.md", lines.join("\n"), "utf8");
  console.log(
    `Wrote ${lessons.length} lessons and ${lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises to docs/UNIT-1.md.`,
  );
} finally {
  await server.close();
}
