import { lessonById } from "./curriculum";
import { pages } from "./progress";
import type { LearnerProgress, Page } from "./types";
export type Route = { page: Page; lessonId: string | null };
export function parseRoute(hash: string): Route | null {
  const path = hash.replace(/^#\/?/, "");
  if (pages.includes(path as Page))
    return { page: path as Page, lessonId: null };
  if (path.startsWith("lesson/") && lessonById[path.slice(7)])
    return { page: "learn", lessonId: path.slice(7) };
  return null;
}
export function savedRoute(progress: LearnerProgress): Route {
  return {
    page: progress.navigation.page,
    lessonId: progress.navigation.previewLessonId,
  };
}
export const routeHref = (route: Route) =>
  route.lessonId ? `#/lesson/${route.lessonId}` : `#/${route.page}`;
