import { createSeedState } from "./seed";

/** IDs aus dem Seed für Static Export (GitHub Pages) */
export function seedStaticParams() {
  const seed = createSeedState();
  return {
    projects: seed.projects.map((p) => ({ id: p.id })),
    parts: seed.parts.map((p) => ({ id: p.id })),
    tasks: seed.tasks.map((t) => ({ id: t.id })),
    lops: seed.lops.map((l) => ({ id: l.id })),
    departments: seed.departments.map((d) => ({ id: d.id })),
  };
}
