import { createServer } from "vite";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  optimizeDeps: { noDiscovery: true, include: [] },
});
try {
  const { validateCurriculum } = await server.ssrLoadModule(
    "/src/validate-curriculum.ts",
  );
  const errors = validateCurriculum();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    const { lessons, units, items } =
      await server.ssrLoadModule("/src/curriculum.ts");
    console.log(
      `Unit 1 valid: ${lessons.length} playable lessons, ${lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises, ${items.length} learning items. Structural validation is not linguistic or native-speaker review.`,
    );
  }
} finally {
  await server.close();
}
