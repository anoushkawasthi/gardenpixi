/**
 * Single source for project rows (TRD §3.3 — dev parse fail-fast at module load).
 */
import raw from "./projects.json";
import { projectsSchema, type Project } from "../schemas/projects";

function loadProjects(): readonly Project[] {
  if (process.env.NODE_ENV !== "production") {
    return projectsSchema.parse(raw);
  }
  return raw as readonly Project[];
}

export const projectsList: readonly Project[] = loadProjects();

export function getProjectById(id: string): Project | undefined {
  return projectsList.find((p) => p.id === id);
}
